insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'family-media',
  'family-media',
  false,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/x-wav',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text,
  media_type text not null check (media_type in ('image', 'audio', 'video', 'pdf')),
  storage_path text not null unique,
  original_filename text not null check (char_length(btrim(original_filename)) between 1 and 255),
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 26214400),
  date_captured date,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, id),
  check (
    (media_type = 'image' and mime_type in ('image/jpeg', 'image/png', 'image/webp')) or
    (media_type = 'audio' and mime_type in ('audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav')) or
    (media_type = 'video' and mime_type in ('video/mp4', 'video/quicktime', 'video/webm')) or
    (media_type = 'pdf' and mime_type = 'application/pdf')
  )
);

create table public.media_people (
  family_id uuid not null references public.families(id) on delete cascade,
  media_id uuid not null,
  person_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (media_id, person_id),
  foreign key (family_id, media_id) references public.media_items(family_id, id) on delete cascade,
  foreign key (family_id, person_id) references public.people(family_id, id) on delete cascade
);

create table public.media_events (
  family_id uuid not null references public.families(id) on delete cascade,
  media_id uuid not null,
  event_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (media_id, event_id),
  foreign key (family_id, media_id) references public.media_items(family_id, id) on delete cascade,
  foreign key (family_id, event_id) references public.events(family_id, id) on delete cascade
);

create table public.media_stories (
  family_id uuid not null references public.families(id) on delete cascade,
  media_id uuid not null,
  story_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (media_id, story_id),
  foreign key (family_id, media_id) references public.media_items(family_id, id) on delete cascade,
  foreign key (family_id, story_id) references public.stories(family_id, id) on delete cascade
);

create index media_items_family_created_idx on public.media_items(family_id, created_at desc);
create index media_items_created_by_idx on public.media_items(created_by);
create index media_people_person_idx on public.media_people(family_id, person_id);
create index media_events_event_idx on public.media_events(family_id, event_id);
create index media_stories_story_idx on public.media_stories(family_id, story_id);

create trigger media_items_set_updated_at
before update on public.media_items
for each row execute function public.set_updated_at();

alter table public.media_items enable row level security;
alter table public.media_people enable row level security;
alter table public.media_events enable row level security;
alter table public.media_stories enable row level security;

grant select, insert, update, delete on public.media_items, public.media_people, public.media_events, public.media_stories to authenticated;

create policy "members view media items" on public.media_items
for select to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_items.family_id
      and m.user_id = (select auth.uid())
  )
);

create policy "editors create media items" on public.media_items
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.family_memberships m
    where m.family_id = media_items.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "editors update media items" on public.media_items
for update to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_items.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
)
with check (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_items.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "editors delete media items" on public.media_items
for delete to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_items.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "members view media people" on public.media_people
for select to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_people.family_id
      and m.user_id = (select auth.uid())
  )
);

create policy "editors add media people" on public.media_people
for insert to authenticated
with check (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_people.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "editors delete media people" on public.media_people
for delete to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_people.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "members view media events" on public.media_events
for select to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_events.family_id
      and m.user_id = (select auth.uid())
  )
);

create policy "editors add media events" on public.media_events
for insert to authenticated
with check (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_events.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "editors delete media events" on public.media_events
for delete to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_events.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "members view media stories" on public.media_stories
for select to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_stories.family_id
      and m.user_id = (select auth.uid())
  )
);

create policy "editors add media stories" on public.media_stories
for insert to authenticated
with check (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_stories.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "editors delete media stories" on public.media_stories
for delete to authenticated
using (
  exists (
    select 1 from public.family_memberships m
    where m.family_id = media_stories.family_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "family members read private media" on storage.objects
for select to authenticated
using (
  bucket_id = 'family-media'
  and exists (
    select 1 from public.family_memberships m
    where m.family_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
  )
);

create policy "family editors upload private media" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'family-media'
  and exists (
    select 1 from public.family_memberships m
    where m.family_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

create policy "family editors delete private media" on storage.objects
for delete to authenticated
using (
  bucket_id = 'family-media'
  and exists (
    select 1 from public.family_memberships m
    where m.family_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'editor')
  )
);

comment on table public.media_items is 'Private family media metadata. File bytes live in the family-media Supabase Storage bucket.';
comment on column public.media_items.storage_path is 'Private Storage object path; never a public URL.';
