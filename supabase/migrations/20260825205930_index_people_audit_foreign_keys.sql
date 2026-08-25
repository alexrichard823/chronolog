-- PE-01: Index audit foreign keys used for creator/editor lookups.

create index people_created_by_idx on public.people (created_by);
create index people_updated_by_idx on public.people (updated_by);
