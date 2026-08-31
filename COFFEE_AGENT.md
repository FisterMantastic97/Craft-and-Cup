# Coffee Agent: palate-grounded recommendations (design brief, 2026-07-29)

Status: PHASES 1-3 BUILT (2026-08-11), not yet run/deployed. Decisions below were
made by Nicholas on 2026-07-29. Build notes and deviations are recorded at the
bottom under "As built".
Build phases at the bottom. Read ROADMAP.md and CLAUDE.md first; standing rules apply.

## What it is

One button on the in-app Profile dashboard, next to the palate wheel: "What should I try next?"
Pressing it sends the user's taste fingerprint to the AI and renders coffee STYLE
recommendations grounded in what they have actually logged. It is a scoped action, not an open
chatbot.

## Locked decisions

1. **Placement (v1): Profile dashboard**, composed into the existing deco Palate column so the
   recommendation sits beside the data it derives from (provenance visible on screen). Journal
   placement can come later.
2. **Quota: separate allowance.** Recommendations do NOT draw from the 10/month flavor-map pool.
   New migration extends the existing quota system (see SQL section). Suggested free limit:
   5 recommendations/month; paid plan unmetered, same as flavor maps.
3. **Output: 2 comfort picks + 1 labeled stretch pick.** The stretch is an adjacent style just
   outside the user's pattern, framed as invitation, never pressure.

## Honesty constraint (non-negotiable)

Recommend styles to seek (origin, process, roast level, flavor notes to look for), NEVER
specific purchasable products, roasters, SKUs, or shopping links. The model cannot verify
inventory; invented products would be hallucination presented as a feature. "Look for a
natural-process Ethiopian, light roast, blueberry and jasmine notes" is true at any roaster.

## HFE rationale (name these in commit messages and the case study)

- Every pick carries a "because" tied to the user's logged data: explainability builds trust
  (Nielsen 1, visibility of system status; Nielsen 2, match to the real world).
- Lives beside the palate wheel it derives from: data provenance is literally on screen.
- Scoped button over open chat: recognition over recall for the user; no prompt-injection
  surface or runaway cost for the system.
- Stretch pick framed as exploration support, consistent with the app's
  stats-as-reflection-not-scoreboard principle. No streaks, no pressure.
- Graceful low-data state (below 3 flavor-mapped beans): inviting, not barren.
- Cached against a fingerprint snapshot; regenerates only when the palate changed or the user
  explicitly refreshes. Protects quota and cost; no surprise credit burn.

## Data in

From `computeFingerprint(beans)` + `computeStats(beans)` in `src/lib/fingerprint.js`:
flavor-family distribution, dominant family, top origins, roast profile, top brew method,
bean count, avg score. Plus the 5 most recent beans (name, origin, roast, top flavor notes,
score). Serialize compactly; cap total prompt length like /api/analyze does.

## Output schema (strict JSON, no prose)

```json
{
  "recommendations": [
    {
      "kind": "comfort",
      "title": "Washed Kenyan, light roast",
      "seek": { "origin": "Kenya", "process": "washed", "roast": "light" },
      "notes": ["blackcurrant", "tomato-like acidity", "brown sugar"],
      "why": "You have logged six fruity naturals averaging 8+. This keeps the berry
              brightness you chase and adds clarity."
    },
    { "kind": "comfort", "...": "..." },
    { "kind": "stretch", "...": "..." }
  ],
  "lowData": false
}
```

If the fingerprint is too sparse the model sets `lowData: true` and the client renders the
low-data state instead (the API also short-circuits below 3 flavor-mapped beans without
spending a credit).

## Prompt sketch

System: You are the tasting advisor inside Craft & Cup, a coffee journal. You receive a
user's aggregated palate data. Recommend coffee STYLES to seek out, never specific products,
brands, roasters, or links. Respond with ONLY the JSON schema provided, no preamble, no
markdown fences. Exactly 2 kind:"comfort" picks that extend what the user already loves, and
1 kind:"stretch" pick adjacent to their pattern. Every "why" must reference their actual
logged data. Use plain, warm language; notes vocabulary should align with SCA flavor terms.

User message: the serialized fingerprint payload.

## API route: /api/recommend

Near-clone of `src/pages/api/analyze.js`, keeping its exact layering:
1. POST only; reject others.
2. Supabase session gate (same Bearer flow).
3. Quota: call `consume_rec_credit()` (new, below). In-memory fallback limiter if the RPC is
   unavailable, same pattern, lower ceiling (e.g. 10/hour).
4. Server-side low-data short-circuit before any AI call.
5. Upstream: same env-gated AI Gateway-or-direct-Anthropic routing shipped 2026-07-28
   (AI_GATEWAY_API_KEY / AI_GATEWAY_MODEL / anthropic fallback). Model: haiku.
6. Guarded JSON parse (strip fences, validate shape: exactly 3 recommendations, kinds
   correct); on malformed output return the friendly retry error, never a raw exception.

## SQL migration (deliver as one idempotent, self-verifying block at build time)

Extend the existing quota system rather than duplicating it:
- Add `kind text not null default 'flavor_map'` to `ai_usage` (guarded ALTER).
- New `consume_rec_credit()` SECURITY DEFINER function mirroring `consume_ai_credit()`,
  writing kind 'recommend', REC_FREE_LIMIT = 5, paid plan unmetered.
- Grant execute to authenticated only (match the lockdown posture; nothing for anon).
- Ends with a read-only report grid verifying column + function + grants, per the
  supabase-security-lockdown.sql pattern. Paste the SQL INLINE in chat for Nicholas.

## UI: ProfileDashboard panel

A `.deco-panel` in the Palate column, `.deco-plabel` heading "YOUR NEXT CUP" (placeholder,
Nicholas may rename). States:
- Low data: invitation copy ("Log a few more beans and I will have something real to say."),
  no button spend.
- Idle with cached result: render last recommendations + quiet "Refresh" affordance; refresh
  disabled (with reason on hover/focus) when the fingerprint hash is unchanged.
- Loading: existing skeleton shimmer language, not spinner text.
- Result: 3 cards; comfort picks first; stretch pick visually distinguished (deco diamond
  bullet + "A stretch" label); notes rendered with the existing flavor-chip components and
  taxonomy colors; each card shows its "why" in sentence case.
- Error: active voice + next step, consistent with existing error copy. Show remaining
  allowance ("X of 5 this month") near the button, mirroring AiUsageMeter.
Accessibility: real buttons, aria labels, focus-visible, no sub-24px targets, reduced-motion
respected on any entrance animation, all-caps only on the short label.

## Caching

Store `{ fingerprintHash, result, generatedAt }` (localStorage v1; key per user id).
Hash = stable stringify of the fingerprint object. On dashboard mount: if hash matches, render
cache; never auto-call the API. Supabase-persisted cache can come later if cross-device
matters.

## Build order (one surface per push)

1. SQL migration (inline paste, Nicholas runs it, report grid all green).
2. `/api/recommend` route + `src/lib/recommend.js` (payload serializer, hash, response
   validator). Verify with an authenticated curl/browser probe.
3. ProfileDashboard panel UI + cache wiring.
4. Move the roadmap item to Already Shipped in the same branch as the final PR.

## Later (explicitly out of v1)

Journal placement; conversational follow-ups; palate archetype tie-in ("The Fruit Chaser");
Steep/Mix generalization (the route and prompt take a beverage parameter when that day comes);
Supabase-persisted recommendation history.


## As built (2026-08-11)

Files: `supabase-rec-quota.sql`, `src/lib/recommend.js`, `src/pages/api/recommend.js`,
and the `NextCupPanel` component in `src/pages/index.jsx`.

**Deviation 1: separate rec_usage table, not a kind column on ai_usage.**
`ai_usage` has primary key `(user_id, period)`. Adding `kind` would require dropping
and recreating that PK on a live table AND rewriting the working
`consume_ai_credit()` on-conflict clause. A twin `rec_usage` table gets the same
result with zero surgery on the quota that is currently running in production.

**Deviation 2: the client sends structured palate data, never prompt text.**
The prompt is assembled server-side in the route. If the client supplied prompt
text, the endpoint would be a general-purpose LLM for anyone with an account.
Origin/roast/note strings are user-typed free text, so `src/lib/recommend.js`
strips control characters, collapses whitespace, and length-caps every field
before it reaches the prompt. Covered by unit tests.

**Verified before delivery:** production build green with `/api/recommend`
registered, zero lint errors, zero em dashes, 22 unit tests passing on the
sanitizer, hash stability, and the response validator (rejects wrong counts,
wrong kind mix, missing fields, and markdown-fenced JSON).

**Not yet verified:** the SQL has not been executed and no real model response has
been seen. First run should confirm the report grid is all green, then that a real
recommendation renders.
