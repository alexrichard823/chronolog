-- BF-02: cover the auth.users foreign key used while restoring memberships.

create index family_archive_membership_snapshots_user_idx
  on private.family_archive_membership_snapshots (user_id);
