-- R-03: Block self-links, duplicate direct relationships, reverse spouse duplicates,
-- and obvious parent-child ancestry cycles.

alter table public.relationships
  add constraint relationships_no_self_link
  check (person_a_id <> person_b_id);

alter table public.relationships
  add constraint relationships_spouse_canonical_order
  check (
    relationship_type <> 'spouse_partner'
    or person_a_id < person_b_id
  );

create unique index relationships_parent_child_unique
  on public.relationships (family_id, person_a_id, person_b_id)
  where relationship_type = 'parent_child';

create unique index relationships_spouse_partner_unique
  on public.relationships (family_id, person_a_id, person_b_id)
  where relationship_type = 'spouse_partner';

create or replace function private.prevent_relationship_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  excluded_relationship_id uuid;
  cycle_exists boolean;
begin
  if new.relationship_type <> 'parent_child' then
    return new;
  end if;

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

create trigger relationships_prevent_cycle
before insert or update of family_id, relationship_type, person_a_id, person_b_id
on public.relationships
for each row execute function private.prevent_relationship_cycle();
