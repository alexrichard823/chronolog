-- Phase 8.5: allow authenticated family managers to update only archive metadata.
-- Row Level Security still decides which authenticated roles may update each family row.

grant update (name, description, updated_at)
on table public.families
to authenticated;
