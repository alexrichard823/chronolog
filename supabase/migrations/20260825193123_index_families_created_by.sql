-- F-01 follow-up: cover the families.created_by foreign key for efficient creator lookups.

create index families_created_by_idx
  on public.families (created_by);
