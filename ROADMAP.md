# Craft & Cup - Roadmap (updated 2026-07-29, rev 2)

**This file is the canonical roadmap.** Both Claude (chat) and Claude Code read and update it.
When an item ships, move it to Already Shipped with the date, in the same branch as the change.
Sorted by effort. Standing rules live in CLAUDE.md.

**Recommended next:** Email + web push notifications so broadcasts / DMs / friend activity reach
people off-site (today they only live in the in-app bell). Web push needs no paid service and
public/sw.js exists; email needs a service (e.g. Resend).

## In flight (started, not yet merged)
- Fix the broken lint config (eslint.config.mjs ESM import of eslint-config-next/core-web-vitals);
  verify npm run lint passes.
- Delete dead code: the legacy api/analyze.js at the repo root (predates the auth-gated
  src/pages/api/analyze.js; verified NOT served in production) and src/pages/api/hello.js.

## Near-term / quick wins (small, no accounts)
- **Re-enable the Discovery tab.** DiscoveryPage is fully built and wired; only the nav button is
  commented out in index.jsx.
- **Final loading / empty / error polish.** Mostly done; light remaining sweep.
- **AI Gateway follow-ups (optional).** Watch spend in the AI Gateway overview as users log beans;
  AI_GATEWAY_MODEL env var can override the model without a code change.

## Medium code (real work, no accounts)
- **next/image migration.** Bean + recipe photos still use plain img tags. Faster loads, auto
  sizing, less CLS.
- **Coffee agent / drink recommendations.** New /api/recommend route mirroring /api/analyze
  (same auth gate + quota), grounded in the taste fingerprint (src/lib/fingerprint.js) so advice
  is personal to the user's logged palate. Start as a scoped "recommend me something" button, not
  open chat. The same engine later powers Steep and Mix.

## Bigger projects (multi-session, self-contained)
- **Profile overhaul, features 3-5.** Taste match, origin passport, palate evolution. The spine
  (fingerprint + stats + deco dashboard) already shipped.
- **Retire the zoom scaling + full responsive nav.** Rem-based type/spacing rewrite to replace the
  global zoom. Highest layout-wide risk; treat as its own reviewed, well-tested project.

## Needs a service (setup on another platform)
- **Email + web push notifications** (recommended next). **Stripe billing** (paid self-serve).
- **Analytics (Plausible) + error monitoring (Sentry).** **Preview deploys + Lighthouse + DB
  backups / staging.**

## Big bets (plan deliberately)
- **Growth:** referral/invite + waitlist. **Platform expansion:** Steep (tea) + Mix (cocktails) +
  public API (needs a beverage-agnostic refactor first). **Offline** (PWA caching + write queue),
  native share, CSV import.
- **Session security:** log-out-all-devices. (Reset / verify / 2FA are N/A: passwordless.)

## Already shipped (LIVE + verified on mycraftcup.com)
**2026-07-28/29:**
- Security advisor cleared: SECURITY DEFINER execute-grant lockdown
  (supabase-definer-grants-lockdown.sql, RAN + verified). 20 warnings to 8 accepted: anon
  stripped from all 10 flagged functions, is_admin + guard_profile_role locked to owner
  context, default privileges hardened so new functions start locked. The 8 remaining
  authenticated warnings are the client-called RPC set defended by internal is_admin()/
  auth.uid() gates.
- Next.js patched 15.5.15 -> 15.5.22 (May 2026 security release, 13 advisories) via PR #2.
- package-lock.json repaired (missing prettier entry); npm ci works for the first time.
- AI flavor mapping routed through Vercel AI Gateway (PR #3): env-gated via AI_GATEWAY_API_KEY,
  model anthropic/claude-haiku-4.5, BYOK so billing stays on Anthropic, $10 gateway credits as
  automatic failover, per-request cost observability. Deleting the env var reverts instantly.
- Local toolchain on Nicholas's Mac: nvm 0.40.6, Node 24 LTS, npm 11, .env.local for local
  builds, Claude Code 2.1.220 with the official Vercel plugin, CLAUDE.md generated via /init.

**2026-07-24:** logic de-dup: shared src/lib/friends.js (kills the triplicated friend-request
logic + the M9 sync hazard) and src/lib/format.js (one relative-time formatter).

**2026-07-23:** Prettier + ESLint baseline; nav Inbox/Notifications to accessible top-right icon
buttons (HFE); tablet/breakpoint audit; tab-jump/zoom fix; security lockdown (6 advisor fixes,
verified); perf memoization; individual owner DMs; broadcast announcements; owner + admin roles +
founder pin; admin dashboard + moderation; freemium AI quota (10/mo); AI endpoint auth-gate +
rate limit; multi-field search; form autosave + draft restore; recipe tags + version history;
export-my-data + account delete.

**Earlier:** full redesign (light + dark, 0 axe issues); WCAG AA accessibility; onboarding;
Terms + Privacy; PWA install; sitemap/robots; structural de-dup (the /u re-export + CSS).

## Notes for future sessions (chat Claude and Claude Code)
- npm and Node ARE installed on Nicholas's Mac as of 2026-07-29 (nvm). Local next build,
  prettier, and lint all run locally. The old "run npm in /tmp and deliver files" workaround is
  retired.
- Standing rules are in CLAUDE.md: zero em dashes anywhere; one surface per push; next build
  stays clean before any commit; shared logic lives in src/lib (import, never re-inline);
  WCAG 2.1 AA + Nielsen rationale named in commit messages; branches + diffs before commits.
- Default privileges now revoke PUBLIC execute on new functions: every future RPC function
  needs an explicit "grant execute on function ... to authenticated;" in its migration.
- Claude Code is installed but shelved by preference. The working method is chat Claude +
  the browser pipeline (GitHub web editor, verified commits) + Nicholas's local terminal.
- This file moves fast; verify status against git history before quoting it.
- The roadmap copies in the Claude project docs and the desktop artifact are superseded by this
  file.
