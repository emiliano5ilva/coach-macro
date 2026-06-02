-- Migration: add_plan_built_to_profiles
-- Branch/dev only — do NOT apply to production until the full GoClub redesign ships.
--
-- plan_built is the gate for the 3→5 tab expansion.
-- It is flipped to true by markPlanBuilt() at the end of the
-- second onboarding (Phase 5B). Until then it stays false,
-- keeping the user in the 3-tab state.

alter table public.profiles
  add column if not exists plan_built boolean not null default false;
