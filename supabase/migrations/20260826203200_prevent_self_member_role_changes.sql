create or replace function private.update_family_member_role_impl(
  target_family_id uuid,
  target_user_id uuid,
  target_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  old_role text;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if target_user_id = current_user_id then
    raise exception using errcode = '42501', message = 'You cannot change your own family role';
  end if;
  if not private.can_manage_family(target_family_id) then
    raise exception using errcode = '42501', message = 'Only the family Owner or an Admin can change member roles';
  end if;
  if target_role not in ('admin', 'editor', 'viewer') then
    raise exception using errcode = '22023', message = 'Invalid member role';
  end if;

  select fm.role into old_role
    from public.family_memberships fm
   where fm.family_id = target_family_id and fm.user_id = target_user_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Member not found';
  end if;
  if old_role = 'owner' then
    raise exception using errcode = '42501', message = 'The Owner role cannot be changed here';
  end if;

  update public.family_memberships
     set role = target_role, updated_at = now()
   where family_id = target_family_id and user_id = target_user_id;

  insert into public.activity_log (family_id, actor_user_id, target_user_id, action, metadata)
  values (target_family_id, current_user_id, target_user_id, 'member_role_changed', jsonb_build_object('from', old_role, 'to', target_role));
end;
$$;
