-- Phase 8.5: make ancestry-cycle validation independent of caller RLS
-- and serialize parent-child writes within a family to prevent concurrent write skew.

create or replace function private.prevent_relationship_cycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  excluded_relationship_id uuid;
  cycle_exists boolean;
begin
  if new.relationship_type <> 'parent_child' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.family_id::text, 8252026)
  );

  excluded_relationship_id := case when tg_op = 'UPDATE' then old.id else null end;

  with recursive descendants(person_id) as (
    select r.person_b_id
    from public.relationships r
    where r.family_id = new.family_id
      and r.relationship_type = 'parent_child'
      and r.person_a_id = new.person_b_id
      and (excluded_relationship_id is null or r.id <> excluded_relationship_id)

    union

    select r.person_b_id
    from public.relationships r
    join descendants d on r.person_a_id = d.person_id
    where r.family_id = new.family_id
      and r.relationship_type = 'parent_child'
      and (excluded_relationship_id is null or r.id <> excluded_relationship_id)
  )
  select exists (
    select 1
    from descendants
    where person_id = new.person_a_id
  )
  into cycle_exists;

  if cycle_exists then
    raise exception using
      errcode = '23514',
      message = 'Parent-child relationship would create an ancestry cycle';
  end if;

  return new;
end;
$$;

revoke execute on function private.prevent_relationship_cycle() from public, anon, authenticated;
