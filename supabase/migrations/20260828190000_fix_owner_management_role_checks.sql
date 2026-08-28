-- Fix Owner-only collaboration checks.
-- `current_role` is a PostgreSQL special value, so using it as a PL/pgSQL
-- variable can resolve to the database execution role instead of the
-- Chronolog family membership role. Use an unambiguous variable name.

create or replace function private.create_family_invitation_impl(target_family_id uuid, target_email text, target_role text, supplied_token_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  actor_family_role text;
  cleaned_email text := lower(btrim(target_email));
  new_invitation_id uuid;
begin
  if current_user_id is null then raise exception using errcode='42501', message='Authentication required'; end if;
  select fm.role into actor_family_role from public.family_memberships fm where fm.family_id=target_family_id and fm.user_id=current_user_id;
  if actor_family_role is distinct from 'owner' then raise exception using errcode='42501', message='Only the family Owner can invite members'; end if;
  if target_role not in ('admin','editor','viewer') then raise exception using errcode='22023', message='Invalid invitation role'; end if;
  if cleaned_email is null or char_length(cleaned_email)<3 or char_length(cleaned_email)>320 or position('@' in cleaned_email)<=1 then raise exception using errcode='22023', message='Enter a valid email address'; end if;
  if supplied_token_hash !~ '^[0-9a-f]{64}$' then raise exception using errcode='22023', message='Invalid invitation token'; end if;
  update public.invitations set status='revoked', revoked_at=now(), updated_at=now() where family_id=target_family_id and status='pending' and expires_at<=now();
  if exists (select 1 from public.family_memberships fm join auth.users u on u.id=fm.user_id where fm.family_id=target_family_id and lower(u.email)=cleaned_email) then raise exception using errcode='23505', message='That email is already a member of this family'; end if;
  if exists (select 1 from public.invitations i where i.family_id=target_family_id and i.normalized_email=cleaned_email and i.status='pending') then raise exception using errcode='23505', message='A pending invitation already exists for that email'; end if;
  if (select count(*) from public.invitations i where i.invited_by=current_user_id and i.created_at > now()-interval '1 hour')>=10 then raise exception using errcode='54000', message='Invitation rate limit reached. Try again later.'; end if;
  insert into public.invitations (family_id, invited_email, normalized_email, role, token_hash, invited_by, expires_at)
  values (target_family_id, cleaned_email, cleaned_email, target_role, supplied_token_hash, current_user_id, now()+interval '7 days') returning id into new_invitation_id;
  insert into public.activity_log (family_id, actor_user_id, action, metadata) values (target_family_id, current_user_id, 'invitation_created', jsonb_build_object('role', target_role));
  return new_invitation_id;
end; $$;

create or replace function private.revoke_family_invitation_impl(target_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  invitation_row public.invitations%rowtype;
  actor_family_role text;
begin
  if current_user_id is null then raise exception using errcode='42501', message='Authentication required'; end if;
  select * into invitation_row from public.invitations i where i.id=target_invitation_id for update;
  if not found then raise exception using errcode='42501', message='Invitation not found or access denied'; end if;
  select fm.role into actor_family_role from public.family_memberships fm where fm.family_id=invitation_row.family_id and fm.user_id=current_user_id;
  if actor_family_role is distinct from 'owner' then raise exception using errcode='42501', message='Only the family Owner can revoke invitations'; end if;
  if invitation_row.status <> 'pending' or invitation_row.expires_at <= now() then raise exception using errcode='22023', message='Only an active pending invitation can be revoked'; end if;
  update public.invitations set status='revoked', revoked_at=now(), updated_at=now() where id=target_invitation_id;
  insert into public.activity_log (family_id, actor_user_id, action, metadata) values (invitation_row.family_id, current_user_id, 'invitation_revoked', jsonb_build_object('role', invitation_row.role));
end; $$;

create or replace function private.update_family_member_role_impl(target_family_id uuid, target_user_id uuid, target_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  actor_family_role text;
  old_role text;
begin
  if current_user_id is null then raise exception using errcode='42501', message='Authentication required'; end if;
  if target_user_id=current_user_id then raise exception using errcode='42501', message='You cannot change your own family role'; end if;
  select fm.role into actor_family_role from public.family_memberships fm where fm.family_id=target_family_id and fm.user_id=current_user_id;
  if actor_family_role is distinct from 'owner' then raise exception using errcode='42501', message='Only the family Owner can change member roles'; end if;
  if target_role not in ('admin','editor','viewer') then raise exception using errcode='22023', message='Invalid member role'; end if;
  select fm.role into old_role from public.family_memberships fm where fm.family_id=target_family_id and fm.user_id=target_user_id for update;
  if not found then raise exception using errcode='P0002', message='Member not found'; end if;
  if old_role='owner' then raise exception using errcode='42501', message='The Owner role cannot be changed here'; end if;
  update public.family_memberships set role=target_role, updated_at=now() where family_id=target_family_id and user_id=target_user_id;
  insert into public.activity_log (family_id, actor_user_id, target_user_id, action, metadata) values (target_family_id, current_user_id, target_user_id, 'member_role_changed', jsonb_build_object('from', old_role, 'to', target_role));
end; $$;

create or replace function private.remove_family_member_impl(target_family_id uuid, target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  actor_family_role text;
  removed_role text;
begin
  if current_user_id is null then raise exception using errcode='42501', message='Authentication required'; end if;
  select fm.role into actor_family_role from public.family_memberships fm where fm.family_id=target_family_id and fm.user_id=current_user_id;
  if target_user_id <> current_user_id and actor_family_role is distinct from 'owner' then raise exception using errcode='42501', message='Only the family Owner can remove members'; end if;
  select fm.role into removed_role from public.family_memberships fm where fm.family_id=target_family_id and fm.user_id=target_user_id for update;
  if not found then raise exception using errcode='P0002', message='Member not found'; end if;
  if removed_role='owner' then raise exception using errcode='42501', message='The family Owner cannot be removed'; end if;
  delete from public.family_memberships where family_id=target_family_id and user_id=target_user_id;
  insert into public.activity_log (family_id, actor_user_id, target_user_id, action, metadata) values (target_family_id, current_user_id, target_user_id, 'member_removed', jsonb_build_object('role', removed_role));
end; $$;
