# Craft & Cup

An AI-powered coffee journal. Log a bag of beans, describe how it tastes in your
own words, and the app maps those words onto the SCA flavor wheel. Over time the
journal builds a picture of your palate: which flavor families you gravitate to,
which origins you return to, how your taste has drifted month over month.

Live at [mycraftcup.com](https://mycraftcup.com).

## Why it exists

Most coffee apps are either inventory trackers or shopping catalogues. Neither
helps with the actual problem: you drink something excellent, write "kinda
berry, a bit floral" in your notes, and six months later have no idea what that
meant or whether you have ever liked anything similar.

Craft & Cup treats tasting notes as structured data. Free-text notes become
positions on a shared taxonomy, which makes them comparable across beans, across
months, and eventually across people.

## Human factors

This project is a human-factors exercise as much as a product. Design decisions
are made against WCAG 2.1 AA, Nielsen's heuristics, and Apple HIG, and the
reasoning is recorded in commit messages rather than left implicit.

A few of the decisions that shaped the interface:

- **Reflection, not a scoreboard.** Stats and the palate view are framed as
  personal reflection. No streaks, no badges, no points. Journaling should never
  become an obligation to perform.
- **Confirm then undo, not confirm dialogs.** Destructive actions delete
  immediately and offer a five-second undo, which is faster for the common case
  and safer than modal fatigue.
- **Color is never the only signal.** Tasting scores carry a text label
  alongside their color; the evolution chart exposes a spoken-language
  description to assistive technology.
- **Explainable AI.** Every AI-generated recommendation states which of your
  logged data it was drawn from, and recommends styles to seek rather than
  specific products, because the model cannot verify what any roaster has in
  stock.

## Stack

- **Next.js 15** (Pages Router) and **React 19**
- **Supabase** for auth, Postgres, and storage. Auth is fully passwordless
  (Google, Discord, magic link)
- **Anthropic Claude Haiku** for flavor mapping and recommendations, routed
  through **Vercel AI Gateway** for spend tracking and provider failover
- **Vercel** for hosting, with Speed Insights and Analytics

## Architecture notes

**AI never runs on the client.** Every model call goes through a server route
that holds the key, verifies a Supabase session, and enforces a monthly
per-user quota through a `SECURITY DEFINER` Postgres function. Clients send
structured data, never prompt text, so the endpoints cannot be driven as a
general-purpose LLM.

**Aggregation is a single pure module.** `src/lib/fingerprint.js` turns a list of
beans into a palate summary. The dashboard renders it, palate evolution runs it
over time-sliced beans, and the recommender feeds it to the model. One pipeline,
several surfaces.

**Shared logic lives in `src/lib`.** An earlier version of this app carried a
near-duplicate copy of itself, and fixes had to be applied twice. That is why
friend requests, relative-time formatting, and the flavor wheel are extracted
modules rather than inline code.

## Local development

Requires Node 20 or newer.

```bash
npm ci
```

Create `.env.local` with your Supabase project values. Both are publishable and
safe in a client bundle:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Then:

```bash
npm run dev          # http://localhost:3000
npm test             # unit tests for the pure modules in src/lib
npm run lint
npm run format
npm run build
```

Server-only keys (`ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`) are set in Vercel
and are not needed for local development unless you are working on the AI
routes.

## Database

Schema lives in `migrations.sql`, with incremental migrations in the
`supabase-*.sql` files. Each is idempotent and ends with a read-only report
query, so running one twice is safe and you can always see the resulting state.

## Status

In active development. The roadmap is `ROADMAP.md`, kept in the repository so it
stays in step with the code rather than drifting in a separate document.
