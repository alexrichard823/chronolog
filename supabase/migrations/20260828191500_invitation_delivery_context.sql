-- Centralize invitation delivery authorization and account-state lookup in the
-- database. The Edge Function calls this only with the service role.
-- This avoids duplicating family-role logic in the email-delivery layer and
-- avoids inferring account existence from Supabase Auth error messages.

create or replace function public.get_invitation_delivery_context(
  target_invitation_id uuid,
  supplied_token_hash text
)
returns table(
  normalized_email text,
  invitation_status text,
  expires_at timestamptz,
  token_matches boolean,
  inviter_is_owner boolean,
  target_account_exists boolean,
  target_has_password boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.normalized_email,
    case
      when i.status = 'pending' and i.expires_at <= now() then 'expired'
      else i.status
    end as invitation_status,
    i.expires_at,
    i.token_hash = supplied_token_hash as token_matches,
    exists (
      select 1
      from public.family_memberships fm
      where fm.family_id = i.family_id
        and fm.user_id = i.invited_by
        and fm.role = 'owner'
    ) as inviter_is_owner,
    exists (
      select 1
      from auth.users u
      where lower(u.email) = i.normalized_email
    ) as target_account_exists,
    coalesce((
      select nullif(u.encrypted_password, '') is not null
      from auth.users u
      where lower(u.email) = i.normalized_email
      order by u.created_at
      limit 1
    ), false) as target_has_password
  from public.invitations i
  where i.id = target_invitation_id;
$$;

revoke all on function public.get_invitation_delivery_context(uuid, text) from public;
revoke all on function public.get_invitation_delivery_context(uuid, text) from anon;
revoke all on function public.get_invitation_delivery_context(uuid, text) from authenticated;
grant execute on function public.get_invitation_delivery_context(uuid, text) to service_role;
