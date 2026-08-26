create index event_people_family_event_idx on public.event_people(family_id, event_id);
create index story_people_family_story_idx on public.story_people(family_id, story_id);
create index story_events_family_story_idx on public.story_events(family_id, story_id);
create index events_created_by_idx on public.events(created_by);
create index events_updated_by_idx on public.events(updated_by);
create index stories_created_by_idx on public.stories(created_by);
create index stories_updated_by_idx on public.stories(updated_by);
