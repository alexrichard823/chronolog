-- F-02: Family membership-based RLS and Data API grants.
-- Source of truth: docs/PRD.md

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_family_member(target_family_id uuid)
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
    );
$$;

create or replace function private.is_family_creator(target_family_id uuid)
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
      from public.families f
      where f.id = target_family_id
        and f.created_by = (select auth.uid())
    );
$$;

revoke execute on function private.is_family_member(uuid) from public, anon;
revoke execute on function private.is_family_creator(uuid) from public, anon;
grant execute on function private.is_family_member(uuid) to authenticated;
grant execute on function private.is_family_creator(uuid) to authenticated;

-- New Supabase projects no longer expose public tables to the Data API automatically.
-- Keep anonymous access closed and grant only the operations F-02/F-03 need to signed-in users.
revoke all on table public.families from anon, authenticated;
revoke all on table public.family_memberships from anon, authenticated;
grant select, insert on table public.families to authenticated;
grant select, insert on table public.family_memberships to authenticated;

drop policy if exists "Family members can view families" on public.families;
drop policy if exists "Authenticated users can create families" on public.families;
drop policy if exists "Family members can view memberships" on public.family_memberships;
drop policy if exists "Creators can add their owner membership" on public.family_memberships;

create policy "Family members can view families"
on public.families
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    created_by = (select auth.uid())
    or (select private.is_family_member(id))
  )
);

create policy "Authenticated users can create families"
on public.families
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
);

create policy "Family members can view memberships"
on public.family_memberships
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select private.is_family_member(family_id))
    or (select private.is_family_creator(family_id))
  )
);

create policy "Creators can add their owner membership"
on public.family_memberships
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and role = 'owner'
  and (select private.is_family_creator(family_id))
);
