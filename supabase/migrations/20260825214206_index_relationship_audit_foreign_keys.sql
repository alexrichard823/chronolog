-- Phase 5 relationship schema hardening: cover audit foreign keys.
create index relationships_created_by_idx on public.relationships (created_by);
create index relationships_updated_by_idx on public.relationships (updated_by);
