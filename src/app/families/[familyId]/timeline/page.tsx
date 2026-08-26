import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { createSignedMediaMap, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

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

function readableType(value: string) {
  return value.replaceAll("_", " ");
}

function timelineHref(familyId: string, personId: string, eventType: string, page: number) {
  const params = new URLSearchParams();
  if (personId) params.set("person", personId);
  if (eventType) params.set("type", eventType);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/families/${familyId}/timeline${query ? `?${query}` : ""}`;
}

export default async function TimelinePage({ params, searchParams }: TimelinePageProps) {
  const { familyId } = await params;
  const requested = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, peopleResult, eventTypesResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("events").select("event_type").eq("family_id", familyId).order("event_type").limit(1000),
  ]);

  const family = familyResult.data;
  if (familyResult.error || !family) notFound();

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
    const { data: personEventLinks } = await supabase
      .from("event_people")
      .select("event_id")
      .eq("family_id", familyId)
      .eq("person_id", selectedPersonId);
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
      console.error("Timeline event query failed", eventsResult.error);
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

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/families/${familyId}`} className="text-sm underline">
          Back to {family.name}
        </Link>
        <Link href={`/families/${familyId}/events/new${selectedPersonId ? `?personId=${selectedPersonId}` : ""}`} className="rounded bg-black px-4 py-2 text-sm text-white">
          Add Event
        </Link>
      </div>

      <section className="mt-6 rounded-xl border p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Family archive</p>
        <h1 className="mt-1 text-3xl font-semibold">Family Timeline</h1>
        <p className="mt-2 text-gray-600">
          Events are shown in chronological order while preserving approximate, ranged, and unknown dates as entered.
        </p>
      </section>

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Filter timeline</h2>
            <p className="mt-1 text-sm text-gray-500">Narrow the family history by person or event type.</p>
          </div>
          {(selectedPersonId || selectedEventType) && (
            <Link href={`/families/${familyId}/timeline`} className="text-sm underline">
              Clear filters
            </Link>
          )}
        </div>

        <form method="get" className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="person" className="block text-sm font-medium">Person</label>
            <select id="person" name="person" defaultValue={selectedPersonId} className="mt-2 w-full rounded border px-3 py-2">
              <option value="">All people</option>
              {people.map((person) => <option key={person.id} value={person.id}>{person.display_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium">Event type</label>
            <select id="type" name="type" defaultValue={selectedEventType} className="mt-2 w-full rounded border px-3 py-2 capitalize">
              <option value="">All event types</option>
              {availableEventTypes.map((eventType) => <option key={eventType} value={eventType}>{readableType(eventType)}</option>)}
            </select>
          </div>
          <button type="submit" className="rounded border px-4 py-2">Apply filters</button>
        </form>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{activePerson ? `${activePerson.display_name}'s timeline` : "Family events"}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {eventCount > 0 ? `Showing ${firstShown}–${lastShown} of ${eventCount} event${eventCount === 1 ? "" : "s"}.` : "No events to show."}
            </p>
          </div>
          {selectedEventType && <p className="text-sm capitalize text-gray-500">Type: {readableType(selectedEventType)}</p>}
        </div>

        {events.length ? (
          <div className="mt-6 space-y-6 border-l pl-6">
            {events.map((event) => {
              const linkedPeople = (peopleIdsByEvent.get(event.id) ?? [])
                .map((id) => personById.get(id))
                .filter((person): person is FamilyPerson => Boolean(person));
              const linkedStories = (storyIdsByEvent.get(event.id) ?? [])
                .map((id) => storyById.get(id))
                .filter((story): story is TimelineStory => Boolean(story));
              const linkedMedia = (mediaIdsByEvent.get(event.id) ?? [])
                .map((id) => mediaById.get(id))
                .filter((item): item is MediaRecord => Boolean(item))
                .sort((a, b) => b.created_at.localeCompare(a.created_at));
              const previewStory = linkedStories[0] ?? null;
              const previewMedia = previewMediaByEvent.get(event.id) ?? null;

              return (
                <article key={event.id} className="relative rounded-xl border bg-white p-5">
                  <span className="absolute -left-[1.9rem] top-6 h-3 w-3 rounded-full border bg-white" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{readableType(event.event_type)}</p>
                      <h3 className="mt-1 text-xl font-semibold">
                        <Link className="underline" href={`/families/${familyId}/events/${event.id}`}>{event.title}</Link>
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {event.date_display || "Date unknown"}
                        {event.place_name ? ` · ${event.place_name}` : ""}
                      </p>
                    </div>
                    {(event.date_is_uncertain || event.date_precision === "unknown") && (
                      <span className="w-fit rounded-full border px-2 py-1 text-xs text-gray-600">
                        {event.date_precision === "unknown" ? "Date unknown" : "Approximate date"}
                      </span>
                    )}
                  </div>

                  {event.description && <p className="mt-4 whitespace-pre-wrap text-gray-700">{event.description}</p>}

                  <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    <div>
                      <h4 className="text-sm font-semibold">People</h4>
                      {linkedPeople.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {linkedPeople.map((person) => (
                            <Link key={person.id} href={`/families/${familyId}/people/${person.id}`} className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">
                              {person.display_name}
                            </Link>
                          ))}
                        </div>
                      ) : <p className="mt-2 text-sm text-gray-500">No people linked.</p>}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Story</h4>
                      {previewStory ? (
                        <div className="mt-2 rounded-lg border p-3">
                          <Link className="font-medium underline" href={`/families/${familyId}/stories/${previewStory.id}`}>{previewStory.title}</Link>
                          <p className="mt-2 line-clamp-3 text-sm text-gray-600">{previewStory.content}</p>
                          {linkedStories.length > 1 && <p className="mt-2 text-xs text-gray-500">+{linkedStories.length - 1} more linked {linkedStories.length - 1 === 1 ? "story" : "stories"}</p>}
                        </div>
                      ) : <p className="mt-2 text-sm text-gray-500">No story linked.</p>}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Media</h4>
                      {previewMedia ? (
                        <div className="mt-2 rounded-lg border p-3">
                          {previewMedia.media_type === "image" ? (
                            <MediaPreview mediaType="image" signedUrl={signedByPath.get(previewMedia.storage_path) ?? null} title={previewMedia.title} compact />
                          ) : (
                            <div className="flex h-24 items-center justify-center rounded-lg bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                              {previewMedia.media_type}
                            </div>
                          )}
                          <Link className="mt-3 block font-medium underline" href={`/families/${familyId}/media/${previewMedia.id}`}>{previewMedia.title}</Link>
                          {linkedMedia.length > 1 && <p className="mt-2 text-xs text-gray-500">+{linkedMedia.length - 1} more linked media {linkedMedia.length - 1 === 1 ? "item" : "items"}</p>}
                        </div>
                      ) : <p className="mt-2 text-sm text-gray-500">No media linked.</p>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border p-6 text-gray-500">
            {selectedPersonId || selectedEventType ? "No events match these filters." : "No events have been added to this family yet."}
          </div>
        )}

        {eventCount > PAGE_SIZE && (
          <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Timeline pagination">
            {page > 1 ? (
              <Link href={timelineHref(familyId, selectedPersonId, selectedEventType, page - 1)} className="rounded border px-4 py-2 text-sm">Previous</Link>
            ) : <span />}
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            {page < totalPages ? (
              <Link href={timelineHref(familyId, selectedPersonId, selectedEventType, page + 1)} className="rounded border px-4 py-2 text-sm">Next</Link>
            ) : <span />}
          </nav>
        )}
      </section>
    </main>
  );
}
