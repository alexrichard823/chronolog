-- R-01: Relationship data model for parent-child and spouse/partner.
-- person_a is the parent for parent_child relationships.

create unique index if not exists people_family_id_id_uidx
  on public.people (family_id, id);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  relationship_type text not null
    check (relationship_type in ('parent_child', 'spouse_partner')),
  person_a_id uuid not null,
  person_b_id uuid not null,
  parent_child_subtype text
    check (parent_child_subtype is null or parent_child_subtype in ('biological', 'adoptive', 'step', 'foster', 'guardian', 'unspecified')),
  partner_status text
    check (partner_status is null or partner_status in ('partner', 'married', 'separated', 'divorced', 'widowed', 'ended')),
  notes text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint relationships_person_a_family_fk
    foreign key (family_id, person_a_id)
    references public.people (family_id, id)
    on delete cascade,
  constraint relationships_person_b_family_fk
    foreign key (family_id, person_b_id)
    references public.people (family_id, id)
    on delete cascade,
  constraint relationships_type_attributes_check check (
    (relationship_type = 'parent_child' and partner_status is null)
    or
    (relationship_type = 'spouse_partner' and parent_child_subtype is null)
  )
);

create index relationships_family_id_idx
  on public.relationships (family_id);
create index relationships_family_person_a_idx
  on public.relationships (family_id, person_a_id);
create index relationships_family_person_b_idx
  on public.relationships (family_id, person_b_id);

create trigger relationships_set_updated_at
before update on public.relationships
for each row execute function public.set_updated_at();

alter table public.relationships enable row level security;

revoke all on table public.relationships from anon, authenticated;
grant select, insert, delete on table public.relationships to authenticated;
grant update (
  parent_child_subtype,
  partner_status,
  notes,
  updated_by,
  updated_at
) on table public.relationships to authenticated;

create policy "Family members can view relationships"
on public.relationships
for select
to authenticated
using ((select private.is_family_member(family_id)));

create policy "Family editors can add relationships"
on public.relationships
for insert
to authenticated
with check (
  (select private.can_edit_family(family_id))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy "Family editors can update relationships"
on public.relationships
for update
to authenticated
using ((select private.can_edit_family(family_id)))
with check ((select private.can_edit_family(family_id)));

create policy "Family editors can delete relationships"
on public.relationships
for delete
to authenticated
using ((select private.can_edit_family(family_id)));

comment on table public.relationships is
  'Stored direct family relationships. Parent-child edges are directional; spouse/partner edges are symmetric.';
comment on column public.relationships.person_a_id is
  'For parent_child, this is the parent. For spouse_partner, either partner until R-03 canonical ordering is enforced.';
comment on column public.relationships.person_b_id is
  'For parent_child, this is the child. For spouse_partner, the other partner.';
