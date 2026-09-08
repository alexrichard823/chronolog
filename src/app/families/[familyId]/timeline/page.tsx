import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { NavigationButtonLink } from "@/components/navigation-button-link";
import { Badge, Card, PageContainer } from "@/components/ui";
import { createSignedMediaMap, type MediaRecord } from "@/lib/media";
import { readableEventType, timelineHref } from "@/lib/timeline-filters";
import { createClient } from "@/lib/supabase/server";
import { TimelineFilters } from "./timeline-filters";
import { TimelineIcon } from "./timeline-icon";
import "./timeline.css";

const PAGE_SIZE = 25;

type TimelinePageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{
    person?: string | string[];
    type?: string | string[];
    page?: string | string[];
  }>;
};

type FamilyPerson = { id: string; display_name: string };
type TimelineEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  date_precision: "exact" | "approximate" | "range" | "unknown";
  date_start: string | null;
  date_end: string | null;
  date_display: string | null;
  date_is_uncertain: boolean;
  place_name: string | null;
  created_at: string;
};
type EventPersonLink = { event_id: string; person_id: string };
type StoryEventLink = { event_id: string; story_id: string };
type MediaEventLink = { event_id: string; media_id: string };
type TimelineStory = { id: string; title: string; content: string; date_display: string | null };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function TimelinePage({ params, searchParams }: TimelinePageProps) {
  const { familyId } = await params;
  const requested = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, peopleResult, eventTypesResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("events").select("event_type").eq("family_id", familyId).order("event_type").limit(1000),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);

  const family = familyResult.data;
  if (familyResult.error || !family || membershipResult.error || !membershipResult.data) notFound();
  const canEdit = ["owner", "admin", "editor"].includes(membershipResult.data.role);

  if (peopleResult.error || eventTypesResult.error) throw new Error("Unable to load timeline filters. Please try again.");

  const people = (peopleResult.data ?? []) as FamilyPerson[];
  const personById = new Map(people.map((person) => [person.id, person]));
  const availableEventTypes = Array.from(
    new Set((eventTypesResult.data ?? []).map((row) => row.event_type).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const requestedPersonId = firstParam(requested.person);
  const requestedEventType = firstParam(requested.type);
  const selectedPersonId = personById.has(requestedPersonId) ? requestedPersonId : "";
  const selectedEventType = availableEventTypes.includes(requestedEventType) ? requestedEventType : "";
  const requestedPage = Number.parseInt(firstParam(requested.page), 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let personEventIds: string[] | null = null;
  if (selectedPersonId) {
    const { data: personEventLinks, error: personEventsError } = await supabase
      .from("event_people")
      .select("event_id")
      .eq("family_id", familyId)
      .eq("person_id", selectedPersonId);
    if (personEventsError) throw new Error("Unable to load this person’s timeline. Please try again.");
    personEventIds = (personEventLinks ?? []).map((row) => row.event_id);
  }

  let events: TimelineEvent[] = [];
  let eventCount = 0;

  if (personEventIds === null || personEventIds.length > 0) {
    let eventsQuery = supabase
      .from("events")
      .select(
        "id, title, description, event_type, date_precision, date_start, date_end, date_display, date_is_uncertain, place_name, created_at",
        { count: "exact" }
      )
      .eq("family_id", familyId);

    if (selectedPersonId && personEventIds) eventsQuery = eventsQuery.in("id", personEventIds);
    if (selectedEventType) eventsQuery = eventsQuery.eq("event_type", selectedEventType);

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;
    const eventsResult = await eventsQuery
      .order("date_start", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .range(start, end);

    if (eventsResult.error) {
      throw new Error("Unable to load timeline events. Please try again.");
    } else {
      events = (eventsResult.data ?? []) as TimelineEvent[];
      eventCount = eventsResult.count ?? events.length;
    }
  }

  const totalPages = Math.max(1, Math.ceil(eventCount / PAGE_SIZE));
  if (eventCount > 0 && page > totalPages) {
    redirect(timelineHref(familyId, selectedPersonId, selectedEventType, totalPages));
  }

  const eventIds = events.map((event) => event.id);
  const [eventPeopleResult, storyEventsResult, mediaEventsResult] = eventIds.length
    ? await Promise.all([
        supabase.from("event_people").select("event_id, person_id").eq("family_id", familyId).in("event_id", eventIds),
        supabase.from("story_events").select("event_id, story_id").eq("family_id", familyId).in("event_id", eventIds),
        supabase.from("media_events").select("event_id, media_id").eq("family_id", familyId).in("event_id", eventIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const eventPeopleLinks = (eventPeopleResult.data ?? []) as EventPersonLink[];
  const storyEventLinks = (storyEventsResult.data ?? []) as StoryEventLink[];
  const mediaEventLinks = (mediaEventsResult.data ?? []) as MediaEventLink[];
  const storyIds = Array.from(new Set(storyEventLinks.map((link) => link.story_id)));
  const mediaIds = Array.from(new Set(mediaEventLinks.map((link) => link.media_id)));

  const [storiesResult, mediaResult] = await Promise.all([
    storyIds.length
      ? supabase.from("stories").select("id, title, content, date_display").eq("family_id", familyId).in("id", storyIds)
      : Promise.resolve({ data: [] }),
    mediaIds.length
      ? supabase
          .from("media_items")
          .select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at")
          .eq("family_id", familyId)
          .in("id", mediaIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const stories = (storiesResult.data ?? []) as TimelineStory[];
  const media = (mediaResult.data ?? []) as MediaRecord[];
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const mediaById = new Map(media.map((item) => [item.id, item]));

  const peopleIdsByEvent = new Map<string, string[]>();
  for (const link of eventPeopleLinks) {
    peopleIdsByEvent.set(link.event_id, [...(peopleIdsByEvent.get(link.event_id) ?? []), link.person_id]);
  }
  const storyIdsByEvent = new Map<string, string[]>();
  for (const link of storyEventLinks) {
    storyIdsByEvent.set(link.event_id, [...(storyIdsByEvent.get(link.event_id) ?? []), link.story_id]);
  }
  const mediaIdsByEvent = new Map<string, string[]>();
  for (const link of mediaEventLinks) {
    mediaIdsByEvent.set(link.event_id, [...(mediaIdsByEvent.get(link.event_id) ?? []), link.media_id]);
  }

  const previewMediaByEvent = new Map<string, MediaRecord>();
  for (const event of events) {
    const linkedMedia = (mediaIdsByEvent.get(event.id) ?? [])
      .map((id) => mediaById.get(id))
      .filter((item): item is MediaRecord => Boolean(item))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (linkedMedia[0]) previewMediaByEvent.set(event.id, linkedMedia[0]);
  }

  const signedByPath = await createSignedMediaMap(
    Array.from(previewMediaByEvent.values())
      .filter((item) => item.media_type === "image")
      .map((item) => item.storage_path)
  );

  const activePerson = selectedPersonId ? personById.get(selectedPersonId) ?? null : null;
  const firstShown = eventCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, eventCount);

  const addEventHref = `/families/${familyId}/events/new${selectedPersonId ? `?personId=${selectedPersonId}` : ""}`;
  const hasFilters = Boolean(selectedPersonId || selectedEventType);

  return (
    <main className="py-6 sm:py-8">
      <PageContainer width="wide" className="min-w-0">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={`/families/${familyId}`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">{family.name} family</Link>
            <h1 className="text-3xl font-semibold tracking-tight">Family timeline</h1>
            <p className="mt-2 max-w-2xl text-muted">Your family’s moments, connected through time.</p>
          </div>
          {canEdit && <NavigationButtonLink href={addEventHref} variant="secondary"><span aria-hidden="true">+</span> Add event</NavigationButtonLink>}
        </header>

        <TimelineFilters familyId={familyId} people={people} eventTypes={availableEventTypes} selectedPersonId={selectedPersonId} selectedEventType={selectedEventType} page={page} />

        <section className="mt-8" aria-labelledby="timeline-results-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 id="timeline-results-heading" className="break-words text-xl font-semibold">{activePerson ? `${activePerson.display_name}’s timeline` : "Family events"}</h2>
              <p className="mt-1 text-sm text-muted" role="status">
                {eventCount > 0 ? `Showing ${firstShown}–${lastShown} of ${eventCount} event${eventCount === 1 ? "" : "s"}` : "No events to show"}
              </p>
            </div>
            {events.length > 0 && <span className="flex items-center gap-2 text-sm text-muted"><TimelineIcon name="timeline" className="ui-icon-sm" /> Oldest to newest</span>}
          </div>

          {events.length ? (
            <div className="relative mt-6 space-y-5 pl-6 sm:pl-8">
              <span aria-hidden="true" className="absolute bottom-8 left-1.5 top-8 w-px bg-primary/25" />
              {events.map((event, index) => {
                const linkedPeople = (peopleIdsByEvent.get(event.id) ?? [])
                  .map((id) => personById.get(id)).filter((person): person is FamilyPerson => Boolean(person));
                const linkedStories = (storyIdsByEvent.get(event.id) ?? [])
                  .map((id) => storyById.get(id)).filter((story): story is TimelineStory => Boolean(story));
                const linkedMedia = (mediaIdsByEvent.get(event.id) ?? [])
                  .map((id) => mediaById.get(id)).filter((item): item is MediaRecord => Boolean(item));
                const previewStory = linkedStories[0] ?? null;
                const previewMedia = previewMediaByEvent.get(event.id) ?? null;
                const dateLabel = event.date_precision === "unknown" ? "Date unknown"
                  : event.date_precision === "range" ? (event.date_is_uncertain ? "Approximate range" : "Date range")
                  : event.date_is_uncertain || event.date_precision === "approximate" ? "Approximate date" : null;
                const firstUndated = event.date_precision === "unknown" && (index === 0 || events[index - 1].date_precision !== "unknown");

                return (
                  <div key={event.id}>
                    {firstUndated && <h3 className="mb-4 mt-8 text-sm font-semibold text-muted-strong">Undated events</h3>}
                    <article className="ui-card timeline-card relative min-w-0 p-4 sm:p-6">
                      <span aria-hidden="true" className="absolute -left-6 top-7 h-3 w-3 rounded-full border-2 border-primary bg-background sm:-left-8" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="primary">{readableEventType(event.event_type)}</Badge>
                        {dateLabel && <Badge>{dateLabel}</Badge>}
                      </div>
                      <h3 className="mt-3 break-words text-xl font-semibold leading-snug">
                        <Link className="text-foreground hover:text-primary hover:underline" href={`/families/${familyId}/events/${event.id}`}>{event.title}</Link>
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-strong">
                        <span className="flex items-start gap-2"><TimelineIcon name="calendar" className="ui-icon-sm mt-0.5 text-primary" />{event.date_display || "Date unknown"}</span>
                        {event.place_name && <span className="flex min-w-0 items-start gap-2"><TimelineIcon name="place" className="ui-icon-sm mt-0.5 text-primary" /><span className="break-words">{event.place_name}</span></span>}
                      </div>
                      {event.description && <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-muted-strong">{event.description}</p>}

                      <div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-3">
                        <div className="min-w-0">
                          <h4 className="flex items-center gap-2 text-sm font-semibold"><TimelineIcon name="people" className="ui-icon-sm text-primary" /> People</h4>
                          {linkedPeople.length ? <div className="mt-3 flex flex-wrap gap-2">
                            {linkedPeople.map((person) => <Link key={person.id} href={`/families/${familyId}/people/${person.id}`}
                              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary active:bg-primary/15">
                              <span className="break-words">{person.display_name}</span>
                            </Link>)}
                          </div> : <p className="mt-3 text-sm text-muted">No people linked.</p>}
                        </div>
                        <div className="min-w-0">
                          <h4 className="flex items-center gap-2 text-sm font-semibold"><TimelineIcon name="story" className="ui-icon-sm text-primary" /> Story</h4>
                          {previewStory ? <div className="mt-3">
                            <Link className="inline-block min-h-11 break-words py-2 font-medium text-primary hover:underline" href={`/families/${familyId}/stories/${previewStory.id}`}>{previewStory.title}</Link>
                            <p className="line-clamp-3 break-words text-sm leading-relaxed text-muted-strong">{previewStory.content}</p>
                            {linkedStories.length > 1 && <p className="mt-2 text-xs text-muted">+{linkedStories.length - 1} more linked {linkedStories.length === 2 ? "story" : "stories"}</p>}
                          </div> : <p className="mt-3 text-sm text-muted">No story linked.</p>}
                        </div>
                        <div className="min-w-0">
                          <h4 className="flex items-center gap-2 text-sm font-semibold"><TimelineIcon name="media" className="ui-icon-sm text-primary" /> Media</h4>
                          {previewMedia ? <div className="mt-3">
                            {previewMedia.media_type === "image" ? <MediaPreview mediaType="image" signedUrl={signedByPath.get(previewMedia.storage_path) ?? null} title={previewMedia.title} compact />
                              : <div className="flex h-24 items-center justify-center gap-2 rounded-md bg-primary-soft text-sm font-medium text-primary"><TimelineIcon name="media" />{readableEventType(previewMedia.media_type)}</div>}
                            <Link className="mt-1 inline-block min-h-11 break-words py-2 font-medium text-primary hover:underline" href={`/families/${familyId}/media/${previewMedia.id}`}>{previewMedia.title}</Link>
                            {linkedMedia.length > 1 && <p className="mt-1 text-xs text-muted">+{linkedMedia.length - 1} more linked media {linkedMedia.length === 2 ? "item" : "items"}</p>}
                          </div> : <p className="mt-3 text-sm text-muted">No media linked.</p>}
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end border-t border-border pt-3">
                        <NavigationButtonLink variant="ghost" href={`/families/${familyId}/events/${event.id}`}>View event <TimelineIcon name="arrow" className="ui-icon-sm" /></NavigationButtonLink>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="mt-6 p-6 text-center sm:p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary"><TimelineIcon name={hasFilters ? "search" : "timeline"} /></span>
              <h3 className="mt-4 text-lg font-semibold">{hasFilters ? "No matching moments yet" : "Every family has a story to tell"}</h3>
              <p className="mt-2 text-muted">{hasFilters ? "Try another person or event type, or clear your filters to see every event." : "Your family’s events will appear here as they’re added."}</p>
              {hasFilters ? <NavigationButtonLink variant="secondary" href={timelineHref(familyId)} className="mt-5">Clear filters</NavigationButtonLink>
                : canEdit && <NavigationButtonLink href={addEventHref} className="mt-5">Add the first event</NavigationButtonLink>}
            </Card>
          )}

          {eventCount > PAGE_SIZE && <nav className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-label="Timeline pagination">
            {page > 1 ? <NavigationButtonLink variant="secondary" href={timelineHref(familyId, selectedPersonId, selectedEventType, page - 1)}>Previous</NavigationButtonLink> : <span />}
            <p className="text-sm text-muted">Page {page} of {totalPages}</p>
            {page < totalPages ? <NavigationButtonLink variant="secondary" href={timelineHref(familyId, selectedPersonId, selectedEventType, page + 1)}>Next</NavigationButtonLink> : <span />}
          </nav>}
        </section>
      </PageContainer>
    </main>
  );
}
