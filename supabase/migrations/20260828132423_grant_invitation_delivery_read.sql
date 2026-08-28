-- The invitation delivery Edge Function uses the Supabase service-role client to
-- read the invitation it is about to email. This project intentionally disables
-- automatic table grants, so grant only the read access that backend function needs.
-- No access is granted to anon or authenticated users.
grant select on table public.invitations to service_role;
