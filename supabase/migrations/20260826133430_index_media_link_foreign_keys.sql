create index media_people_family_media_idx on public.media_people(family_id, media_id);
create index media_events_family_media_idx on public.media_events(family_id, media_id);
create index media_stories_family_media_idx on public.media_stories(family_id, media_id);
