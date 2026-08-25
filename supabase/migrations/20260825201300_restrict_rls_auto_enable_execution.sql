-- F-01 security hardening.
-- The auto-RLS event-trigger function is infrastructure-only and must not be callable through the public API.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
