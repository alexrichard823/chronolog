create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invited_email text not null,
  normalized_email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  token_hash text not null unique check (char_length(token_hash) = 64),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (normalized_email = lower(btrim(invited_email))),
  check (char_length(normalized_email) between 3 and 320)
);

create unique index invitations_one_pending_email_per_family
  on public.invitations (family_id, normalized_email)
  where status = 'pending';
create index invitations_family_created_idx on public.invitations (family_id, created_at desc);
create index invitations_expires_idx on public.invitations (expires_at) where status = 'pending';

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_family_created_idx on public.activity_log (family_id, created_at desc);

alter table public.invitations enable row level security;
alter table public.activity_log enable row level security;
revoke all on table public.invitations from anon, authenticated;
revoke all on table public.activity_log from anon, authenticated;

grant usage on schema private to authenticated;

create or replace function private.create_family_invitation_impl(
  target_family_id uuid,
  target_email text,
  target_role text,
  supplied_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  cleaned_email text := lower(btrim(target_email));
  new_invitation_id uuid;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if not private.can_manage_family(target_family_id) then
    raise exception using errcode = '42501', message = 'Only the family Owner or an Admin can invite members';
  end if;
  if target_role not in ('admin', 'editor', 'viewer') then
    raise exception using errcode = '22023', message = 'Invalid invitation role';
  end if;
  if cleaned_email is null or char_length(cleaned_email) < 3 or char_length(cleaned_email) > 320 or position('@' in cleaned_email) <= 1 then
    raise exception using errcode = '22023', message = 'Enter a valid email address';
  end if;
  if supplied_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid invitation token';
  end if;

  update public.invitations
     set status = 'revoked', revoked_at = now(), updated_at = now()
   where family_id = target_family_id
     and status = 'pending'
     and expires_at <= now();

  if exists (
    select 1
      from public.family_memberships fm
      join auth.users u on u.id = fm.user_id
     where fm.family_id = target_family_id
       and lower(u.email) = cleaned_email
  ) then
    raise exception using errcode = '23505', message = 'That email is already a member of this family';
  end if;

  if exists (
    select 1 from public.invitations i
     where i.family_id = target_family_id
       and i.normalized_email = cleaned_email
       and i.status = 'pending'
  ) then
    raise exception using errcode = '23505', message = 'A pending invitation already exists for that email';
  end if;

  if (select count(*) from public.invitations i where i.invited_by = current_user_id and i.created_at > now() - interval '1 hour') >= 10 then
    raise exception using errcode = '54000', message = 'Invitation rate limit reached. Try again later.';
  end if;

  insert into public.invitations (
    family_id, invited_email, normalized_email, role, token_hash, invited_by, expires_at
  ) values (
    target_family_id, cleaned_email, cleaned_email, target_role, supplied_token_hash, current_user_id, now() + interval '7 days'
  ) returning id into new_invitation_id;

  insert into public.activity_log (family_id, actor_user_id, action, metadata)
  values (target_family_id, current_user_id, 'invitation_created', jsonb_build_object('role', target_role));

  return new_invitation_id;
end;
$$;

create or replace function public.create_family_invitation(
  target_family_id uuid,
  target_email text,
  target_role text,
  supplied_token_hash text
)
returns uuid
language sql
set search_path = ''
as $$
  select private.create_family_invitation_impl(target_family_id, target_email, target_role, supplied_token_hash);
$$;

create or replace function private.accept_family_invitation_impl(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  invitation_row public.invitations%rowtype;
  computed_hash text;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if raw_token is null or char_length(raw_token) < 20 then
    raise exception using errcode = '22023', message = 'Invitation is invalid or no longer available';
  end if;

  computed_hash := encode(extensions.digest(raw_token, 'sha256'), 'hex');
  select * into invitation_row
    from public.invitations i
   where i.token_hash = computed_hash
   for update;

  if not found or invitation_row.status <> 'pending' or invitation_row.expires_at <= now() then
    raise exception using errcode = '22023', message = 'Invitation is invalid or no longer available';
  end if;

  select lower(u.email) into current_email from auth.users u where u.id = current_user_id;
  if current_email is null or current_email <> invitation_row.normalized_email then
    raise exception using errcode = '42501', message = 'Sign in with the email address that received this invitation';
  end if;

  if exists (
    select 1 from public.family_memberships fm
     where fm.family_id = invitation_row.family_id and fm.user_id = current_user_id
  ) then
    raise exception using errcode = '23505', message = 'This account is already a member of the family';
  end if;

  insert into public.family_memberships (family_id, user_id, role)
  values (invitation_row.family_id, current_user_id, invitation_row.role);

  update public.invitations
     set status = 'accepted', accepted_by = current_user_id, accepted_at = now(), updated_at = now()
   where id = invitation_row.id;

  insert into public.activity_log (family_id, actor_user_id, target_user_id, action, metadata)
  values (invitation_row.family_id, current_user_id, current_user_id, 'invitation_accepted', jsonb_build_object('role', invitation_row.role));

  return invitation_row.family_id;
end;
$$;

create or replace function public.accept_family_invitation(raw_token text)
returns uuid
language sql
set search_path = ''
as $$
  select private.accept_family_invitation_impl(raw_token);
$$;

create or replace function private.preview_family_invitation_impl(raw_token text)
returns table (family_name text, role text, email_matches boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  computed_hash text;
begin
  if current_user_id is null or raw_token is null or char_length(raw_token) < 20 then
    return;
  end if;
  computed_hash := encode(extensions.digest(raw_token, 'sha256'), 'hex');
  return query
  select f.name,
         i.role,
         lower(u.email) = i.normalized_email
    from public.invitations i
    join public.families f on f.id = i.family_id
    join auth.users u on u.id = current_user_id
   where i.token_hash = computed_hash
     and i.status = 'pending'
     and i.expires_at > now();
end;
$$;

create or replace function public.preview_family_invitation(raw_token text)
returns table (family_name text, role text, email_matches boolean)
language sql
stable
set search_path = ''
as $$
  select * from private.preview_family_invitation_impl(raw_token);
$$;

create or replace function private.revoke_family_invitation_impl(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  invitation_row public.invitations%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  select * into invitation_row from public.invitations i where i.id = target_invitation_id for update;
  if not found or not private.can_manage_family(invitation_row.family_id) then
    raise exception using errcode = '42501', message = 'Invitation not found or access denied';
  end if;
  if invitation_row.status <> 'pending' or invitation_row.expires_at <= now() then
    raise exception using errcode = '22023', message = 'Only an active pending invitation can be revoked';
  end if;
  update public.invitations set status = 'revoked', revoked_at = now(), updated_at = now() where id = target_invitation_id;
  insert into public.activity_log (family_id, actor_user_id, action, metadata)
  values (invitation_row.family_id, current_user_id, 'invitation_revoked', jsonb_build_object('role', invitation_row.role));
end;
$$;

create or replace function public.revoke_family_invitation(target_invitation_id uuid)
returns void
language sql
set search_path = ''
as $$
  select private.revoke_family_invitation_impl(target_invitation_id);
$$;

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

create or replace function public.update_family_member_role(
  target_family_id uuid,
  target_user_id uuid,
  target_role text
)
returns void
language sql
set search_path = ''
as $$
  select private.update_family_member_role_impl(target_family_id, target_user_id, target_role);
$$;

create or replace function private.remove_family_member_impl(target_family_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  removed_role text;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if not private.can_manage_family(target_family_id) then
    raise exception using errcode = '42501', message = 'Only the family Owner or an Admin can remove members';
  end if;

  select fm.role into removed_role
    from public.family_memberships fm
   where fm.family_id = target_family_id and fm.user_id = target_user_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Member not found';
  end if;
  if removed_role = 'owner' then
    raise exception using errcode = '42501', message = 'The family Owner cannot be removed';
  end if;

  delete from public.family_memberships
   where family_id = target_family_id and user_id = target_user_id;

  insert into public.activity_log (family_id, actor_user_id, target_user_id, action, metadata)
  values (target_family_id, current_user_id, target_user_id, 'member_removed', jsonb_build_object('role', removed_role));
end;
$$;

create or replace function public.remove_family_member(target_family_id uuid, target_user_id uuid)
returns void
language sql
set search_path = ''
as $$
  select private.remove_family_member_impl(target_family_id, target_user_id);
$$;

create or replace function private.list_family_members_impl(target_family_id uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_manage_family(target_family_id) then
    raise exception using errcode = '42501', message = 'Only the family Owner or an Admin can view member management';
  end if;
  return query
  select fm.user_id, u.email::text, fm.role, fm.joined_at
    from public.family_memberships fm
    join auth.users u on u.id = fm.user_id
   where fm.family_id = target_family_id
   order by case fm.role when 'owner' then 0 when 'admin' then 1 when 'editor' then 2 else 3 end, fm.joined_at;
end;
$$;

create or replace function public.list_family_members(target_family_id uuid)
returns table (user_id uuid, email text, role text, joined_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select * from private.list_family_members_impl(target_family_id);
$$;

create or replace function private.list_family_invitations_impl(target_family_id uuid)
returns table (invitation_id uuid, invited_email text, role text, status text, expires_at timestamptz, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_manage_family(target_family_id) then
    raise exception using errcode = '42501', message = 'Only the family Owner or an Admin can view invitations';
  end if;
  return query
  select i.id, i.invited_email, i.role,
         case when i.status = 'pending' and i.expires_at <= now() then 'expired' else i.status end,
         i.expires_at, i.created_at
    from public.invitations i
   where i.family_id = target_family_id
   order by i.created_at desc
   limit 50;
end;
$$;

create or replace function public.list_family_invitations(target_family_id uuid)
returns table (invitation_id uuid, invited_email text, role text, status text, expires_at timestamptz, created_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select * from private.list_family_invitations_impl(target_family_id);
$$;

create or replace function private.list_family_activity_impl(target_family_id uuid)
returns table (action text, actor_email text, target_email text, metadata jsonb, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_manage_family(target_family_id) then
    raise exception using errcode = '42501', message = 'Only the family Owner or an Admin can view collaboration activity';
  end if;
  return query
  select a.action,
         actor.email::text,
         target.email::text,
         a.metadata,
         a.created_at
    from public.activity_log a
    left join auth.users actor on actor.id = a.actor_user_id
    left join auth.users target on target.id = a.target_user_id
   where a.family_id = target_family_id
   order by a.created_at desc
   limit 20;
end;
$$;

create or replace function public.list_family_activity(target_family_id uuid)
returns table (action text, actor_email text, target_email text, metadata jsonb, created_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select * from private.list_family_activity_impl(target_family_id);
$$;

revoke all on function private.create_family_invitation_impl(uuid, text, text, text) from public, anon, authenticated;
revoke all on function private.accept_family_invitation_impl(text) from public, anon, authenticated;
revoke all on function private.preview_family_invitation_impl(text) from public, anon, authenticated;
revoke all on function private.revoke_family_invitation_impl(uuid) from public, anon, authenticated;
revoke all on function private.update_family_member_role_impl(uuid, uuid, text) from public, anon, authenticated;
revoke all on function private.remove_family_member_impl(uuid, uuid) from public, anon, authenticated;
revoke all on function private.list_family_members_impl(uuid) from public, anon, authenticated;
revoke all on function private.list_family_invitations_impl(uuid) from public, anon, authenticated;
revoke all on function private.list_family_activity_impl(uuid) from public, anon, authenticated;

grant execute on function private.create_family_invitation_impl(uuid, text, text, text) to authenticated;
grant execute on function private.accept_family_invitation_impl(text) to authenticated;
grant execute on function private.preview_family_invitation_impl(text) to authenticated;
grant execute on function private.revoke_family_invitation_impl(uuid) to authenticated;
grant execute on function private.update_family_member_role_impl(uuid, uuid, text) to authenticated;
grant execute on function private.remove_family_member_impl(uuid, uuid) to authenticated;
grant execute on function private.list_family_members_impl(uuid) to authenticated;
grant execute on function private.list_family_invitations_impl(uuid) to authenticated;
grant execute on function private.list_family_activity_impl(uuid) to authenticated;

revoke all on function public.create_family_invitation(uuid, text, text, text) from public, anon;
revoke all on function public.accept_family_invitation(text) from public, anon;
revoke all on function public.preview_family_invitation(text) from public, anon;
revoke all on function public.revoke_family_invitation(uuid) from public, anon;
revoke all on function public.update_family_member_role(uuid, uuid, text) from public, anon;
revoke all on function public.remove_family_member(uuid, uuid) from public, anon;
revoke all on function public.list_family_members(uuid) from public, anon;
revoke all on function public.list_family_invitations(uuid) from public, anon;
revoke all on function public.list_family_activity(uuid) from public, anon;

grant execute on function public.create_family_invitation(uuid, text, text, text) to authenticated;
grant execute on function public.accept_family_invitation(text) to authenticated;
grant execute on function public.preview_family_invitation(text) to authenticated;
grant execute on function public.revoke_family_invitation(uuid) to authenticated;
grant execute on function public.update_family_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_family_member(uuid, uuid) to authenticated;
grant execute on function public.list_family_members(uuid) to authenticated;
grant execute on function public.list_family_invitations(uuid) to authenticated;
grant execute on function public.list_family_activity(uuid) to authenticated;
