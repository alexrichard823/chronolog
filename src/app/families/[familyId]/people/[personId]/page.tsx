import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { createSignedMediaMap, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ familyId: string; personId: string }>; searchParams: Promise<{ relationshipCreated?: string }> };
type Relationship = { id: string; relationship_type: "parent_child" | "spouse_partner"; person_a_id: string; person_b_id: string; parent_child_subtype: string | null; partner_status: string | null };
type RelatedPerson = { id: string; display_name: string };

function readableLabel(value: string | null) { return !value || value === "unspecified" ? null : value.replaceAll("_", " "); }

export default async function PersonProfilePage({ params, searchParams }: Props) {
  const { familyId, personId } = await params;
  const { relationshipCreated } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, personResult, relationshipResult, eventLinksResult, storyLinksResult, mediaLinksResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name, first_name, middle_name, last_name, maiden_name, nickname, life_status, biography, notes, birth_date_display, death_date_display").eq("id", personId).eq("family_id", familyId).maybeSingle(),
    supabase.from("relationships").select("id, relationship_type, person_a_id, person_b_id, parent_child_subtype, partner_status").eq("family_id", familyId).or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`),
    supabase.from("event_people").select("event_id").eq("family_id", familyId).eq("person_id", personId),
    supabase.from("story_people").select("story_id").eq("family_id", familyId).eq("person_id", personId),
    supabase.from("media_people").select("media_id").eq("family_id", familyId).eq("person_id", personId),
  ]);

  const family = familyResult.data;
  const person = personResult.data;
  if (familyResult.error || !family || personResult.error || !person) notFound();

  const relationships = (relationshipResult.data ?? []) as Relationship[];
  const relatedIds = Array.from(new Set(relationships.map((r) => r.person_a_id === personId ? r.person_b_id : r.person_a_id)));
  const eventIds = (eventLinksResult.data ?? []).map((row) => row.event_id);
  const storyIds = (storyLinksResult.data ?? []).map((row) => row.story_id);
  const mediaIds = (mediaLinksResult.data ?? []).map((row) => row.media_id);

  const [relatedPeopleResult, eventsResult, storiesResult, mediaResult] = await Promise.all([
    relatedIds.length ? supabase.from("people").select("id, display_name").eq("family_id", familyId).in("id", relatedIds) : Promise.resolve({ data: [] }),
    eventIds.length ? supabase.from("events").select("id, title, event_type, description, date_start, date_display, place_name").eq("family_id", familyId).in("id", eventIds) : Promise.resolve({ data: [] }),
    storyIds.length ? supabase.from("stories").select("id, title, content, date_start, date_display, place_name, updated_at").eq("family_id", familyId).in("id", storyIds) : Promise.resolve({ data: [] }),
    mediaIds.length ? supabase.from("media_items").select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at").eq("family_id", familyId).in("id", mediaIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);

  const relatedPeople = (relatedPeopleResult.data ?? []) as RelatedPerson[];
  const personById = new Map(relatedPeople.map((p) => [p.id, p]));
  const parents = relationships.filter((r) => r.relationship_type === "parent_child" && r.person_b_id === personId).map((r) => ({ relationship: r, person: personById.get(r.person_a_id) })).filter((x): x is { relationship: Relationship; person: RelatedPerson } => Boolean(x.person));
  const children = relationships.filter((r) => r.relationship_type === "parent_child" && r.person_a_id === personId).map((r) => ({ relationship: r, person: personById.get(r.person_b_id) })).filter((x): x is { relationship: Relationship; person: RelatedPerson } => Boolean(x.person));
  const partners = relationships.filter((r) => r.relationship_type === "spouse_partner").map((r) => ({ relationship: r, person: personById.get(r.person_a_id === personId ? r.person_b_id : r.person_a_id) })).filter((x): x is { relationship: Relationship; person: RelatedPerson } => Boolean(x.person));

  const lifeItems = [
    ...(eventsResult.data ?? []).map((event) => ({ kind: "Event" as const, id: event.id, title: event.title, text: event.description, dateStart: event.date_start, dateDisplay: event.date_display, place: event.place_name, eventType: event.event_type })),
    ...(storiesResult.data ?? []).map((story) => ({ kind: "Story" as const, id: story.id, title: story.title, text: story.content, dateStart: story.date_start, dateDisplay: story.date_display, place: story.place_name, eventType: null })),
  ].sort((a, b) => a.dateStart && b.dateStart ? a.dateStart.localeCompare(b.dateStart) : a.dateStart ? -1 : b.dateStart ? 1 : 0);

  const media = (mediaResult.data ?? []) as MediaRecord[];
  const signedByPath = await createSignedMediaMap(media.map((item) => item.storage_path));
  const componentName = [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(" ");

  return <main className="mx-auto w-full max-w-4xl p-8">
    <Link href={`/families/${familyId}/people`} className="text-sm underline">Back to {family.name} people</Link>
    {relationshipCreated === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Relationship added successfully.</p>}

    <section className="mt-6 rounded-xl border p-6"><div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium uppercase tracking-wide text-gray-500">Person profile</p><h1 className="mt-1 text-3xl font-semibold">{person.display_name}</h1>{componentName && componentName !== person.display_name && <p className="mt-2 text-gray-600">{componentName}</p>}{person.nickname && <p className="mt-1 text-gray-600">Nickname: {person.nickname}</p>}<p className="mt-3 text-sm capitalize text-gray-600">{person.life_status === "unknown" ? "Life status unknown" : person.life_status}</p></div><div className="flex flex-wrap gap-2"><Link href={`/families/${familyId}/timeline?person=${personId}`} className="rounded border px-4 py-2">Timeline</Link><Link href={`/families/${familyId}/stories/new?personId=${personId}`} className="rounded border px-4 py-2">Add Story</Link><Link href={`/families/${familyId}/events/new?personId=${personId}`} className="rounded border px-4 py-2">Add Event</Link><Link href={`/families/${familyId}/media/new?personId=${personId}`} className="rounded border px-4 py-2">Add Media</Link><Link href={`/families/${familyId}/people/${personId}/relationships/new`} className="rounded bg-black px-4 py-2 text-white">Add Relationship</Link></div></div></section>

    <section className="mt-6 grid gap-6 md:grid-cols-2"><div className="rounded-xl border p-6"><h2 className="text-lg font-semibold">Life information</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-medium text-gray-500">Birth</dt><dd className="mt-1">{person.birth_date_display || "Unknown"}</dd></div><div><dt className="font-medium text-gray-500">Death</dt><dd className="mt-1">{person.death_date_display || "Unknown"}</dd></div>{person.maiden_name && <div><dt className="font-medium text-gray-500">Maiden name</dt><dd className="mt-1">{person.maiden_name}</dd></div>}</dl></div><div className="rounded-xl border p-6"><h2 className="text-lg font-semibold">Biography</h2><p className="mt-4 whitespace-pre-wrap text-gray-700">{person.biography || "No biography has been added yet."}</p></div></section>

    <section className="mt-6 rounded-xl border p-6"><h2 className="text-lg font-semibold">Relationships</h2>{relationshipResult.error ? <p className="mt-4 text-sm text-red-700">We could not load relationships right now.</p> : <div className="mt-5 grid gap-6 md:grid-cols-3">{[["Parents", parents], ["Spouses / Partners", partners], ["Children", children]].map(([label, items]) => <div key={label as string}><h3 className="font-medium">{label as string}</h3>{(items as typeof parents).length ? <ul className="mt-3 space-y-3">{(items as typeof parents).map(({ relationship, person: relative }) => <li key={relationship.id}><Link href={`/families/${familyId}/people/${relative.id}`} className="font-medium underline">{relative.display_name}</Link>{readableLabel(relationship.relationship_type === "spouse_partner" ? relationship.partner_status : relationship.parent_child_subtype) && <p className="mt-1 text-xs capitalize text-gray-500">{readableLabel(relationship.relationship_type === "spouse_partner" ? relationship.partner_status : relationship.parent_child_subtype)}</p>}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">None added</p>}</div>)}</div>}</section>

    <section className="mt-6 rounded-xl border p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Life story</h2><p className="mt-1 text-sm text-gray-500">Events and stories connected to {person.display_name}, in chronological order.</p></div></div>{lifeItems.length ? <div className="mt-6 space-y-5 border-l pl-5">{lifeItems.map((item) => <article key={`${item.kind}-${item.id}`} className="relative rounded-lg border p-4"><span className="absolute -left-[1.72rem] top-5 h-3 w-3 rounded-full border bg-white" /><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.kind}{item.eventType ? ` · ${item.eventType.replaceAll("_", " ")}` : ""}</p><h3 className="mt-1 text-lg font-semibold"><Link className="underline" href={item.kind === "Event" ? `/families/${familyId}/events/${item.id}` : `/families/${familyId}/stories/${item.id}`}>{item.title}</Link></h3><p className="mt-1 text-sm text-gray-500">{item.dateDisplay || "Date unknown"}{item.place ? ` · ${item.place}` : ""}</p>{item.text && <p className="mt-3 whitespace-pre-wrap text-gray-700">{item.text}</p>}</article>)}</div> : <p className="mt-5 text-gray-500">No events or stories are connected yet.</p>}</section>

    <section className="mt-6 rounded-xl border p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Media</h2><p className="mt-1 text-sm text-gray-500">Photos, recordings, videos, and documents connected to {person.display_name}.</p></div><Link href={`/families/${familyId}/media/new?personId=${personId}`} className="text-sm underline">Attach media</Link></div>{media.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2">{media.map((item) => <article key={item.id} className="rounded-lg border p-4"><MediaPreview mediaType={item.media_type} signedUrl={signedByPath.get(item.storage_path) ?? null} title={item.title} compact /><h3 className="mt-3 font-semibold"><Link className="underline" href={`/families/${familyId}/media/${item.id}`}>{item.title}</Link></h3>{item.description && <p className="mt-2 line-clamp-3 text-sm text-gray-600">{item.description}</p>}</article>)}</div> : <p className="mt-5 text-gray-500">No media is connected yet.</p>}</section>

    {person.notes && <section className="mt-6 rounded-xl border p-6"><h2 className="text-lg font-semibold">Notes</h2><p className="mt-4 whitespace-pre-wrap text-gray-700">{person.notes}</p></section>}
  </main>;
}
