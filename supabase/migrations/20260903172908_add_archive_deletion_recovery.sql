-- BF-02: replace immediate family archive destruction with a 30-day recovery flow.
-- Scheduling removes every active membership so existing family RLS and Storage
-- policies immediately make the archive inaccessible. The original memberships
-- are held only in the private schema and restored atomically if the Owner recovers it.

create table private.family_archive_deletion_requests (
  family_id uuid primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  family_name text not null,
  requested_at timestamptz not null default now(),
  recover_until timestamptz not null default (now() + interval '30 days'),
  check (recover_until > requested_at)
);

create index family_archive_deletion_requests_owner_idx
  on private.family_archive_deletion_requests (owner_user_id, requested_at desc);

create table private.family_archive_membership_snapshots (
  family_id uuid not null references private.family_archive_deletion_requests(family_id) on delete cascade,
  membership_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  joined_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (family_id, user_id)
);

revoke all on table private.family_archive_deletion_requests from public, anon, authenticated;
revoke all on table private.family_archive_membership_snapshots from public, anon, authenticated;

-- A deleted archive must not remain visible merely because its Owner created it.
drop policy if exists "Family members can view families" on public.families;
create policy "Family members can view families"
on public.families
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select private.is_family_member(id))
);

drop policy if exists "Family members can view memberships" on public.family_memberships;
create policy "Family members can view memberships"
on public.family_memberships
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or (select private.is_family_member(family_id))
  )
);

create or replace function private.schedule_family_archive_deletion_impl(
  target_family_id uuid,
  expected_family_name text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  archive_name text;
  recovery_deadline timestamptz;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select f.name
    into archive_name
    from public.families f
    join public.family_memberships fm
      on fm.family_id = f.id
     and fm.user_id = caller_id
     and fm.role = 'owner'
   where f.id = target_family_id
   for update of f;

  if not found then
    raise exception using errcode = '42501', message = 'Only the family owner can delete this archive';
  end if;

  if expected_family_name is null or btrim(expected_family_name) <> archive_name then
    raise exception using errcode = '22023', message = 'Type the exact family name to confirm deletion';
  end if;

  if exists (
    select 1
      from private.family_archive_deletion_requests r
     where r.family_id = target_family_id
  ) then
    raise exception using errcode = '23505', message = 'This archive is already scheduled for deletion';
  end if;

  insert into private.family_archive_deletion_requests (
    family_id, owner_user_id, family_name
  ) values (
    target_family_id, caller_id, archive_name
  )
  returning recover_until into recovery_deadline;

  insert into private.family_archive_membership_snapshots (
    family_id, membership_id, user_id, role, joined_at, created_at, updated_at
  )
  select fm.family_id, fm.id, fm.user_id, fm.role, fm.joined_at, fm.created_at, fm.updated_at
    from public.family_memberships fm
   where fm.family_id = target_family_id;

  update public.invitations
     set status = 'revoked', revoked_at = now(), updated_at = now()
   where family_id = target_family_id
     and status = 'pending';

  insert into public.activity_log (family_id, actor_user_id, action, metadata)
  values (
    target_family_id,
    caller_id,
    'family_deletion_scheduled',
    jsonb_build_object('recover_until', recovery_deadline)
  );

  delete from public.family_memberships
   where family_id = target_family_id;

  return recovery_deadline;
end;
$$;

create or replace function private.list_deleted_family_archives_impl()
returns table (
  family_id uuid,
  family_name text,
  requested_at timestamptz,
  recover_until timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.family_id, r.family_name, r.requested_at, r.recover_until
    from private.family_archive_deletion_requests r
   where r.owner_user_id = (select auth.uid())
   order by r.requested_at desc;
$$;

create or replace function private.restore_family_archive_impl(target_family_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  deletion_request private.family_archive_deletion_requests%rowtype;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select *
    into deletion_request
    from private.family_archive_deletion_requests r
   where r.family_id = target_family_id
     and r.owner_user_id = caller_id
   for update;

  if not found then
    raise exception using errcode = '42501', message = 'Only the family owner can restore this archive';
  end if;

  if deletion_request.recover_until < now() then
    raise exception using errcode = '55000', message = 'The recovery window has ended';
  end if;

  insert into public.family_memberships (
    id, family_id, user_id, role, joined_at, created_at, updated_at
  )
  select s.membership_id, s.family_id, s.user_id, s.role, s.joined_at, s.created_at, now()
    from private.family_archive_membership_snapshots s
   where s.family_id = target_family_id;

  insert into public.activity_log (family_id, actor_user_id, action)
  values (target_family_id, caller_id, 'family_deletion_restored');

  delete from private.family_archive_deletion_requests
   where family_id = target_family_id;

  return target_family_id;
end;
$$;

create or replace function private.permanently_delete_family_archive_impl(
  target_family_id uuid,
  expected_family_name text
)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  archive_name text;
  media_paths text[];
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select r.family_name
    into archive_name
    from private.family_archive_deletion_requests r
   where r.family_id = target_family_id
     and r.owner_user_id = caller_id
   for update;

  if not found then
    raise exception using errcode = '42501', message = 'Only the family owner can permanently delete this archive';
  end if;

  if expected_family_name is null or btrim(expected_family_name) <> archive_name then
    raise exception using errcode = '22023', message = 'Type the exact family name to confirm permanent deletion';
  end if;

  select coalesce(array_agg(mi.storage_path order by mi.storage_path), array[]::text[])
    into media_paths
    from public.media_items mi
   where mi.family_id = target_family_id;

  insert into private.family_media_cleanup_grants (family_id, owner_user_id, storage_paths)
  values (target_family_id, caller_id, media_paths)
  on conflict (family_id) do update
  set owner_user_id = excluded.owner_user_id,
      storage_paths = excluded.storage_paths,
      created_at = now();

  delete from public.families
   where id = target_family_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Family archive not found';
  end if;

  delete from private.family_archive_deletion_requests
   where family_id = target_family_id;

  return media_paths;
end;
$$;

revoke all on function private.schedule_family_archive_deletion_impl(uuid, text) from public, anon;
revoke all on function private.list_deleted_family_archives_impl() from public, anon;
revoke all on function private.restore_family_archive_impl(uuid) from public, anon;
revoke all on function private.permanently_delete_family_archive_impl(uuid, text) from public, anon;
grant execute on function private.schedule_family_archive_deletion_impl(uuid, text) to authenticated;
grant execute on function private.list_deleted_family_archives_impl() to authenticated;
grant execute on function private.restore_family_archive_impl(uuid) to authenticated;
grant execute on function private.permanently_delete_family_archive_impl(uuid, text) to authenticated;

create or replace function public.schedule_family_archive_deletion(
  target_family_id uuid,
  expected_family_name text
)
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  select private.schedule_family_archive_deletion_impl(target_family_id, expected_family_name);
$$;

create or replace function public.list_deleted_family_archives()
returns table (
  family_id uuid,
  family_name text,
  requested_at timestamptz,
  recover_until timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_deleted_family_archives_impl();
$$;

create or replace function public.restore_family_archive(target_family_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.restore_family_archive_impl(target_family_id);
$$;

create or replace function public.permanently_delete_family_archive(
  target_family_id uuid,
  expected_family_name text
)
returns text[]
language sql
security invoker
set search_path = ''
as $$
  select private.permanently_delete_family_archive_impl(target_family_id, expected_family_name);
$$;

revoke all on function public.schedule_family_archive_deletion(uuid, text) from public, anon;
revoke all on function public.list_deleted_family_archives() from public, anon;
revoke all on function public.restore_family_archive(uuid) from public, anon;
revoke all on function public.permanently_delete_family_archive(uuid, text) from public, anon;
grant execute on function public.schedule_family_archive_deletion(uuid, text) to authenticated;
grant execute on function public.list_deleted_family_archives() to authenticated;
grant execute on function public.restore_family_archive(uuid) to authenticated;
grant execute on function public.permanently_delete_family_archive(uuid, text) to authenticated;

-- Prevent callers from bypassing recovery by invoking the old immediate-delete RPC.
revoke execute on function public.delete_family_archive(uuid) from authenticated;
revoke execute on function private.delete_family_archive_impl(uuid) from authenticated;
