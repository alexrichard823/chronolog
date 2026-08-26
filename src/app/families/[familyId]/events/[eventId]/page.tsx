import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { createSignedMediaMap, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ familyId: string; eventId: string }>; searchParams: Promise<{ created?: string }> };

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { familyId, eventId } = await params;
  const { created } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, eventResult, peopleLinksResult, storyLinksResult, mediaLinksResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("events").select("id, title, description, event_type, date_display, place_name").eq("id", eventId).eq("family_id", familyId).maybeSingle(),
    supabase.from("event_people").select("person_id").eq("family_id", familyId).eq("event_id", eventId),
    supabase.from("story_events").select("story_id").eq("family_id", familyId).eq("event_id", eventId),
    supabase.from("media_events").select("media_id").eq("family_id", familyId).eq("event_id", eventId),
  ]);
  if (familyResult.error || !familyResult.data || eventResult.error || !eventResult.data) notFound();

  const personIds = (peopleLinksResult.data ?? []).map((row) => row.person_id);
  const storyIds = (storyLinksResult.data ?? []).map((row) => row.story_id);
  const mediaIds = (mediaLinksResult.data ?? []).map((row) => row.media_id);
  const [peopleResult, storiesResult, mediaResult] = await Promise.all([
    personIds.length ? supabase.from("people").select("id, display_name").eq("family_id", familyId).in("id", personIds) : Promise.resolve({ data: [] }),
    storyIds.length ? supabase.from("stories").select("id, title, content, date_display").eq("family_id", familyId).in("id", storyIds).order("date_start", { nullsFirst: false }) : Promise.resolve({ data: [] }),
    mediaIds.length ? supabase.from("media_items").select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at").eq("family_id", familyId).in("id", mediaIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const event = eventResult.data;
  const media = (mediaResult.data ?? []) as MediaRecord[];
  const signedByPath = await createSignedMediaMap(media.map((item) => item.storage_path));

  return <main className="mx-auto w-full max-w-4xl p-8">
    <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>
    {created === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Event created successfully.</p>}
    <section className="mt-6 rounded-xl border p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium uppercase tracking-wide text-gray-500">{event.event_type.replaceAll("_", " ")}</p><h1 className="mt-1 text-3xl font-semibold">{event.title}</h1><p className="mt-3 text-gray-600">{event.date_display || "Date unknown"}{event.place_name ? ` · ${event.place_name}` : ""}</p></div><Link href={`/families/${familyId}/media/new?eventId=${eventId}`} className="rounded border px-4 py-2 text-center">Add Media</Link></div>{event.description && <p className="mt-5 whitespace-pre-wrap text-gray-700">{event.description}</p>}</section>
    <section className="mt-6 rounded-xl border p-6"><h2 className="text-lg font-semibold">People involved</h2>{(peopleResult.data ?? []).length ? <ul className="mt-4 space-y-2">{(peopleResult.data ?? []).map((person) => <li key={person.id}><Link className="underline" href={`/families/${familyId}/people/${person.id}`}>{person.display_name}</Link></li>)}</ul> : <p className="mt-4 text-gray-500">No people connected yet.</p>}</section>
    <section className="mt-6 rounded-xl border p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Stories about this event</h2><Link href={`/families/${familyId}/stories/new?eventId=${eventId}`} className="rounded bg-black px-3 py-2 text-sm text-white">Add story</Link></div>{(storiesResult.data ?? []).length ? <div className="mt-4 space-y-4">{(storiesResult.data ?? []).map((story) => <article key={story.id} className="rounded border p-4"><h3 className="font-semibold"><Link className="underline" href={`/families/${familyId}/stories/${story.id}`}>{story.title}</Link></h3><p className="mt-1 text-sm text-gray-500">{story.date_display || "Date unknown"}</p><p className="mt-3 whitespace-pre-wrap text-gray-700">{story.content}</p></article>)}</div> : <p className="mt-4 text-gray-500">No stories are linked to this event yet.</p>}</section>
    <section className="mt-6 rounded-xl border p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Media</h2><Link href={`/families/${familyId}/media/new?eventId=${eventId}`} className="text-sm underline">Attach media</Link></div>{media.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2">{media.map((item) => <article key={item.id} className="rounded-lg border p-4"><MediaPreview mediaType={item.media_type} signedUrl={signedByPath.get(item.storage_path) ?? null} title={item.title} compact /><h3 className="mt-3 font-semibold"><Link className="underline" href={`/families/${familyId}/media/${item.id}`}>{item.title}</Link></h3>{item.description && <p className="mt-2 line-clamp-3 text-sm text-gray-600">{item.description}</p>}</article>)}</div> : <p className="mt-4 text-gray-500">No media is linked to this event yet.</p>}</section>
  </main>;
}
