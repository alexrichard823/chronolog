-- F-01: Family spaces and memberships
-- Source of truth: docs/PRD.md
-- RLS policies are intentionally deferred to the next authorization task.

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text,
  cover_image_path text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_memberships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_memberships_family_user_unique unique (family_id, user_id)
);

create unique index family_memberships_one_owner_per_family
  on public.family_memberships (family_id)
  where role = 'owner';

create index family_memberships_user_id_idx
  on public.family_memberships (user_id);

create index family_memberships_family_id_idx
  on public.family_memberships (family_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger families_set_updated_at
before update on public.families
for each row execute function public.set_updated_at();

create trigger family_memberships_set_updated_at
before update on public.family_memberships
for each row execute function public.set_updated_at();

alter table public.families enable row level security;
alter table public.family_memberships enable row level security;

comment on table public.families is
  'Top-level private family archive/workspace.';

comment on table public.family_memberships is
  'Maps authenticated users to family archives and stores their Owner/Admin/Editor/Viewer role.';

comment on column public.families.cover_image_path is
  'Private Supabase Storage object path; no public URL is stored here.';
