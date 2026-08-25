-- F-03: Atomic family creation.
-- Creates the family and required Owner membership in one database transaction.

create or replace function public.create_family(
  family_name text,
  family_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_family_id uuid;
  cleaned_name text := btrim(family_name);
  cleaned_description text := nullif(btrim(coalesce(family_description, '')), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if cleaned_name is null or char_length(cleaned_name) < 1 or char_length(cleaned_name) > 120 then
    raise exception 'Family name must be between 1 and 120 characters';
  end if;

  insert into public.families (name, description, created_by)
  values (cleaned_name, cleaned_description, current_user_id)
  returning id into new_family_id;

  insert into public.family_memberships (family_id, user_id, role)
  values (new_family_id, current_user_id, 'owner');

  return new_family_id;
end;
$$;

revoke execute on function public.create_family(text, text) from public, anon;
grant execute on function public.create_family(text, text) to authenticated;
