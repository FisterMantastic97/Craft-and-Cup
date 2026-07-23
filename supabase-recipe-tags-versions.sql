-- Craft & Cup - Phase 3 recipe features: tags + versioning
-- Run this in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> Run).
-- Both columns live on the existing recipes table, so they inherit its RLS
-- automatically - no new policies needed.

alter table public.recipes
  add column if not exists tags text[] not null default '{}';

alter table public.recipes
  add column if not exists versions jsonb not null default '[]'::jsonb;

-- tags:     user-defined labels for organizing/filtering recipes (e.g. "morning", "guests").
-- versions: capped history (last 10) of prior states of a recipe, so a dialed-in
--           recipe's edits can be reviewed and restored. Shape per entry:
--           { "savedAt": "<iso timestamp>", "data": { ...prior recipe fields... } }
