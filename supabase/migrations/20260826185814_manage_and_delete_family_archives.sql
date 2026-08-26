-- Phase 8.5: allow Owner/Admin archive metadata edits and Owner-only archive deletion.
-- Archive deletion records private media cleanup authorization before cascading DB rows,
-- so the former owner can remove private Storage objects after the archive record is gone.

create table if not exists private.family_media_cleanup_grants (
  family_id uuid primary key,
  owner_user_id uuid not null,
  storage_paths text[] not null default array[]::text[],
  created_at timestamptz not null default now()
);

revoke all on table private.family_media_cleanup_grants from public, anon, authenticated;

create or replace function private.can_manage_family(target_family_id uuid)
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
        and fm.role in ('owner', 'admin')
    );
$$;

revoke all on function private.can_manage_family(uuid) from public, anon;
grant execute on function private.can_manage_family(uuid) to authenticated;

drop policy if exists "Family managers can update families" on public.families;
create policy "Family managers can update families"
on public.families
for update
to authenticated
using (private.can_manage_family(id))
with check (private.can_manage_family(id));

create or replace function private.can_cleanup_deleted_family_media(target_family_id text)
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
      from private.family_media_cleanup_grants g
      where g.family_id::text = target_family_id
        and g.owner_user_id = (select auth.uid())
    );
$$;

revoke all on function private.can_cleanup_deleted_family_media(text) from public, anon;
grant execute on function private.can_cleanup_deleted_family_media(text) to authenticated;

drop policy if exists "family editors delete private media" on storage.objects;
create policy "family editors delete private media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'family-media'
  and (
    exists (
      select 1
      from public.family_memberships m
      where m.family_id::text = (storage.foldername(name))[1]
        and m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin', 'editor')
    )
    or private.can_cleanup_deleted_family_media((storage.foldername(name))[1])
  )
);

create or replace function public.delete_family_archive(target_family_id uuid)
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

revoke all on function public.delete_family_archive(uuid) from public, anon;
grant execute on function public.delete_family_archive(uuid) to authenticated;

create or replace function public.complete_family_media_cleanup(target_family_id uuid)
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

revoke all on function public.complete_family_media_cleanup(uuid) from public, anon;
grant execute on function public.complete_family_media_cleanup(uuid) to authenticated;
