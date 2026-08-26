create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text,
  event_type text not null default 'custom',
  date_precision text not null default 'unknown' check (date_precision in ('exact','approximate','range','unknown')),
  date_start date,
  date_end date,
  date_display text,
  date_is_uncertain boolean not null default false,
  place_name text,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, id),
  check (date_precision <> 'range' or (date_start is not null and date_end is not null and date_end >= date_start))
);

create table public.event_people (
  family_id uuid not null references public.families(id) on delete cascade,
  event_id uuid not null,
  person_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (event_id, person_id),
  foreign key (family_id, event_id) references public.events(family_id, id) on delete cascade,
  foreign key (family_id, person_id) references public.people(family_id, id) on delete cascade
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  content text not null check (char_length(btrim(content)) >= 1),
  date_precision text not null default 'unknown' check (date_precision in ('exact','approximate','range','unknown')),
  date_start date,
  date_end date,
  date_display text,
  date_is_uncertain boolean not null default false,
  place_name text,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, id),
  check (date_precision <> 'range' or (date_start is not null and date_end is not null and date_end >= date_start))
);

create table public.story_people (
  family_id uuid not null references public.families(id) on delete cascade,
  story_id uuid not null,
  person_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (story_id, person_id),
  foreign key (family_id, story_id) references public.stories(family_id, id) on delete cascade,
  foreign key (family_id, person_id) references public.people(family_id, id) on delete cascade
);

create table public.story_events (
  family_id uuid not null references public.families(id) on delete cascade,
  story_id uuid not null,
  event_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (story_id, event_id),
  foreign key (family_id, story_id) references public.stories(family_id, id) on delete cascade,
  foreign key (family_id, event_id) references public.events(family_id, id) on delete cascade
);

create index events_family_date_idx on public.events(family_id, date_start, created_at);
create index stories_family_date_idx on public.stories(family_id, date_start, created_at);
create index event_people_person_idx on public.event_people(family_id, person_id);
create index story_people_person_idx on public.story_people(family_id, person_id);
create index story_events_event_idx on public.story_events(family_id, event_id);

alter table public.events enable row level security;
alter table public.event_people enable row level security;
alter table public.stories enable row level security;
alter table public.story_people enable row level security;
alter table public.story_events enable row level security;

grant select, insert, update, delete on public.events, public.event_people, public.stories, public.story_people, public.story_events to authenticated;

create policy "members view events" on public.events for select to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = events.family_id and m.user_id = (select auth.uid())));
create policy "editors create events" on public.events for insert to authenticated with check (created_by = (select auth.uid()) and exists (select 1 from public.family_memberships m where m.family_id = events.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));
create policy "editors update events" on public.events for update to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = events.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor'))) with check (exists (select 1 from public.family_memberships m where m.family_id = events.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));
create policy "editors delete events" on public.events for delete to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = events.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));

create policy "members view event people" on public.event_people for select to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = event_people.family_id and m.user_id = (select auth.uid())));
create policy "editors add event people" on public.event_people for insert to authenticated with check (exists (select 1 from public.family_memberships m where m.family_id = event_people.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));
create policy "editors delete event people" on public.event_people for delete to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = event_people.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));

create policy "members view stories" on public.stories for select to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = stories.family_id and m.user_id = (select auth.uid())));
create policy "editors create stories" on public.stories for insert to authenticated with check (created_by = (select auth.uid()) and exists (select 1 from public.family_memberships m where m.family_id = stories.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));
create policy "editors update stories" on public.stories for update to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = stories.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor'))) with check (exists (select 1 from public.family_memberships m where m.family_id = stories.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));
create policy "editors delete stories" on public.stories for delete to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = stories.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));

create policy "members view story people" on public.story_people for select to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = story_people.family_id and m.user_id = (select auth.uid())));
create policy "editors add story people" on public.story_people for insert to authenticated with check (exists (select 1 from public.family_memberships m where m.family_id = story_people.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));
create policy "editors delete story people" on public.story_people for delete to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = story_people.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));

create policy "members view story events" on public.story_events for select to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = story_events.family_id and m.user_id = (select auth.uid())));
create policy "editors add story events" on public.story_events for insert to authenticated with check (exists (select 1 from public.family_memberships m where m.family_id = story_events.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));
create policy "editors delete story events" on public.story_events for delete to authenticated using (exists (select 1 from public.family_memberships m where m.family_id = story_events.family_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin','editor')));