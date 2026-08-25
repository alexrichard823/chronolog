-- PE-01: People table and family-scoped authorization.
-- A person is a family-history record and does not require a Chronolog account.

create or replace function private.can_edit_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.family_memberships fm
      where fm.family_id = target_family_id
        and fm.user_id = (select auth.uid())
        and fm.role in ('owner', 'admin', 'editor')
    );
$$;

revoke execute on function private.can_edit_family(uuid) from public, anon;
grant execute on function private.can_edit_family(uuid) to authenticated;

create table public.people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 200),
  first_name text,
  middle_name text,
  last_name text,
  maiden_name text,
  nickname text,
  life_status text not null default 'unknown' check (life_status in ('living', 'deceased', 'unknown')),
  biography text,
  notes text,
  profile_photo_path text,

  birth_date_precision text not null default 'unknown'
    check (birth_date_precision in ('exact', 'month', 'year', 'approximate', 'range', 'before', 'after', 'unknown')),
  birth_date_start date,
  birth_date_end date,
  birth_date_display text,
  birth_date_is_uncertain boolean not null default false,

  death_date_precision text not null default 'unknown'
    check (death_date_precision in ('exact', 'month', 'year', 'approximate', 'range', 'before', 'after', 'unknown')),
  death_date_start date,
  death_date_end date,
  death_date_display text,
  death_date_is_uncertain boolean not null default false,

  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_family_id_idx on public.people (family_id);
create index people_family_display_name_idx on public.people (family_id, display_name);

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

alter table public.people enable row level security;

revoke all on table public.people from anon, authenticated;
grant select, insert, delete on table public.people to authenticated;
grant update (
  display_name,
  first_name,
  middle_name,
  last_name,
  maiden_name,
  nickname,
  life_status,
  biography,
  notes,
  profile_photo_path,
  birth_date_precision,
  birth_date_start,
  birth_date_end,
  birth_date_display,
  birth_date_is_uncertain,
  death_date_precision,
  death_date_start,
  death_date_end,
  death_date_display,
  death_date_is_uncertain,
  updated_by,
  updated_at
) on table public.people to authenticated;

create policy "Family members can view people"
on public.people
for select
to authenticated
using ((select private.is_family_member(family_id)));

create policy "Family editors can add people"
on public.people
for insert
to authenticated
with check (
  (select private.can_edit_family(family_id))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy "Family editors can update people"
on public.people
for update
to authenticated
using ((select private.can_edit_family(family_id)))
with check ((select private.can_edit_family(family_id)));

create policy "Family editors can delete people"
on public.people
for delete
to authenticated
using ((select private.can_edit_family(family_id)));

comment on table public.people is
  'People represented in a family archive. A person record does not require a Chronolog login.';

comment on column public.people.profile_photo_path is
  'Private Supabase Storage object path for the profile image; public URLs are not stored.';

comment on column public.people.birth_date_precision is
  'Interpretation of the birth date fields. PE-05 will add user-facing exact/year/approximate/unknown handling.';

comment on column public.people.death_date_precision is
  'Interpretation of the death date fields. PE-05 will add user-facing exact/year/approximate/unknown handling.';
