create index invitations_invited_by_idx on public.invitations (invited_by);
create index invitations_accepted_by_idx on public.invitations (accepted_by);
create index activity_log_actor_user_id_idx on public.activity_log (actor_user_id);
create index activity_log_target_user_id_idx on public.activity_log (target_user_id);
