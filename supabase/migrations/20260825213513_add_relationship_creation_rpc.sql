-- R-02: Atomic relationship creation, including optional new relative creation.

create or replace function public.create_relationship(
  target_family_id uuid,
  focal_person_id uuid,
  relationship_to_focal text,
  existing_relative_id uuid default null,
  new_relative_name text default null,
  parent_child_subtype_value text default 'unspecified',
  partner_status_value text default 'partner',
  relationship_notes text default null
)
returns table (relationship_id uuid, relative_person_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  relative_id uuid;
  new_relationship_id uuid;
  person_a uuid;
  person_b uuid;
  stored_type text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if not (select private.can_edit_family(target_family_id)) then
    raise exception 'You do not have permission to edit this family';
  end if;

  if relationship_to_focal not in ('parent', 'child', 'spouse_partner') then
    raise exception 'Unsupported relationship type';
  end if;

  if existing_relative_id is not null and nullif(btrim(new_relative_name), '') is not null then
    raise exception 'Choose an existing relative or create a new one, not both';
  end if;

  if existing_relative_id is null and nullif(btrim(new_relative_name), '') is null then
    raise exception 'Choose an existing relative or enter a new relative name';
  end if;

  perform 1
  from public.people p
  where p.id = focal_person_id
    and p.family_id = target_family_id;

  if not found then
    raise exception 'Focal person was not found in this family';
  end if;

  if existing_relative_id is not null then
    perform 1
    from public.people p
    where p.id = existing_relative_id
      and p.family_id = target_family_id;

    if not found then
      raise exception 'Relative was not found in this family';
    end if;

    relative_id := existing_relative_id;
  else
    insert into public.people (
      family_id,
      display_name,
      created_by,
      updated_by
    )
    values (
      target_family_id,
      btrim(new_relative_name),
      (select auth.uid()),
      (select auth.uid())
    )
    returning id into relative_id;
  end if;

  if relationship_to_focal = 'parent' then
    stored_type := 'parent_child';
    person_a := relative_id;
    person_b := focal_person_id;
  elsif relationship_to_focal = 'child' then
    stored_type := 'parent_child';
    person_a := focal_person_id;
    person_b := relative_id;
  else
    stored_type := 'spouse_partner';
    if focal_person_id < relative_id then
      person_a := focal_person_id;
      person_b := relative_id;
    else
      person_a := relative_id;
      person_b := focal_person_id;
    end if;
  end if;

  insert into public.relationships (
    family_id,
    relationship_type,
    person_a_id,
    person_b_id,
    parent_child_subtype,
    partner_status,
    notes,
    created_by,
    updated_by
  )
  values (
    target_family_id,
    stored_type,
    person_a,
    person_b,
    case when stored_type = 'parent_child' then coalesce(parent_child_subtype_value, 'unspecified') else null end,
    case when stored_type = 'spouse_partner' then coalesce(partner_status_value, 'partner') else null end,
    nullif(btrim(relationship_notes), ''),
    (select auth.uid()),
    (select auth.uid())
  )
  returning id into new_relationship_id;

  return query select new_relationship_id, relative_id;
end;
$$;

revoke execute on function public.create_relationship(uuid, uuid, text, uuid, text, text, text, text) from public;
revoke execute on function public.create_relationship(uuid, uuid, text, uuid, text, text, text, text) from anon;
grant execute on function public.create_relationship(uuid, uuid, text, uuid, text, text, text, text) to authenticated;
