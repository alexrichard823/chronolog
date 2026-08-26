-- Phase 8.5: keep elevated archive-deletion work out of the exposed public API schema.
-- Public RPCs remain callable by authenticated users, but run as SECURITY INVOKER wrappers.
-- The private implementations retain explicit caller authorization and elevated privileges.

create or replace function private.delete_family_archive_impl(target_family_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  media_paths text[];
begin
  if caller_id is null or not exists (
    select 1
    from public.family_memberships fm
    where fm.family_id = target_family_id
      and fm.user_id = caller_id
      and fm.role = 'owner'
  ) then
    raise exception using errcode = '42501', message = 'Only the family owner can delete this archive';
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

  delete from public.families f where f.id = target_family_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Family archive not found';
  end if;

  return media_paths;
end;
$$;

revoke all on function private.delete_family_archive_impl(uuid) from public, anon;
grant execute on function private.delete_family_archive_impl(uuid) to authenticated;

create or replace function private.complete_family_media_cleanup_impl(target_family_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null or not exists (
    select 1
    from private.family_media_cleanup_grants g
    where g.family_id = target_family_id
      and g.owner_user_id = caller_id
  ) then
    raise exception using errcode = '42501', message = 'Media cleanup is not authorized';
  end if;

  delete from private.family_media_cleanup_grants
  where family_id = target_family_id
    and owner_user_id = caller_id;
end;
$$;

revoke all on function private.complete_family_media_cleanup_impl(uuid) from public, anon;
grant execute on function private.complete_family_media_cleanup_impl(uuid) to authenticated;

create or replace function public.delete_family_archive(target_family_id uuid)
returns text[]
language sql
security invoker
set search_path = ''
as $$
  select private.delete_family_archive_impl(target_family_id);
$$;

revoke all on function public.delete_family_archive(uuid) from public, anon;
grant execute on function public.delete_family_archive(uuid) to authenticated;

create or replace function public.complete_family_media_cleanup(target_family_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.complete_family_media_cleanup_impl(target_family_id);
$$;

revoke all on function public.complete_family_media_cleanup(uuid) from public, anon;
grant execute on function public.complete_family_media_cleanup(uuid) to authenticated;
