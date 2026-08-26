import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { createSignedMediaMap, formatFileSize, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ familyId: string; mediaId: string }>;
  searchParams: Promise<{ created?: string }>;
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export default async function MediaDetailPage({ params, searchParams }: Props) {
  const { familyId, mediaId } = await params;
  const { created } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, mediaResult, peopleLinksResult, eventLinksResult, storyLinksResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase
      .from("media_items")
      .select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at")
      .eq("id", mediaId)
      .eq("family_id", familyId)
      .maybeSingle(),
    supabase.from("media_people").select("person_id").eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_events").select("event_id").eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_stories").select("story_id").eq("family_id", familyId).eq("media_id", mediaId),
  ]);

  if (familyResult.error || !familyResult.data || mediaResult.error || !mediaResult.data) notFound();
  const media = mediaResult.data as MediaRecord;
  const personIds = (peopleLinksResult.data ?? []).map((row) => row.person_id);
  const eventIds = (eventLinksResult.data ?? []).map((row) => row.event_id);
  const storyIds = (storyLinksResult.data ?? []).map((row) => row.story_id);

  const [peopleResult, eventsResult, storiesResult, signedByPath] = await Promise.all([
    personIds.length ? supabase.from("people").select("id, display_name").eq("family_id", familyId).in("id", personIds).order("display_name") : Promise.resolve({ data: [] }),
    eventIds.length ? supabase.from("events").select("id, title, date_display").eq("family_id", familyId).in("id", eventIds).order("date_start", { nullsFirst: false }) : Promise.resolve({ data: [] }),
    storyIds.length ? supabase.from("stories").select("id, title, date_display").eq("family_id", familyId).in("id", storyIds).order("date_start", { nullsFirst: false }) : Promise.resolve({ data: [] }),
    createSignedMediaMap([media.storage_path]),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/families/${familyId}/media`} className="text-sm underline">Back to {familyResult.data.name} media</Link>
        <Link href={`/families/${familyId}/media/new`} className="rounded border px-3 py-2 text-sm">Add Media</Link>
      </div>

      {created === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Media uploaded successfully.</p>}

      <section className="mt-6 rounded-xl border p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">{media.media_type}</p>
        <h1 className="mt-1 text-3xl font-semibold">{media.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{formatDate(media.date_captured) || "Date unknown"} · {formatFileSize(media.file_size_bytes)}</p>
        {media.description && <p className="mt-5 whitespace-pre-wrap text-gray-700">{media.description}</p>}
        <div className="mt-6">
          <MediaPreview mediaType={media.media_type} signedUrl={signedByPath.get(media.storage_path) ?? null} title={media.title} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold">People</h2>
          {(peopleResult.data ?? []).length ? <ul className="mt-3 space-y-2 text-sm">{(peopleResult.data ?? []).map((person) => <li key={person.id}><Link className="underline" href={`/families/${familyId}/people/${person.id}`}>{person.display_name}</Link></li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No people linked.</p>}
        </div>
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold">Events</h2>
          {(eventsResult.data ?? []).length ? <ul className="mt-3 space-y-2 text-sm">{(eventsResult.data ?? []).map((item) => <li key={item.id}><Link className="underline" href={`/families/${familyId}/events/${item.id}`}>{item.title}</Link>{item.date_display ? <span className="text-gray-500"> · {item.date_display}</span> : null}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No events linked.</p>}
        </div>
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold">Stories</h2>
          {(storiesResult.data ?? []).length ? <ul className="mt-3 space-y-2 text-sm">{(storiesResult.data ?? []).map((item) => <li key={item.id}><Link className="underline" href={`/families/${familyId}/stories/${item.id}`}>{item.title}</Link>{item.date_display ? <span className="text-gray-500"> · {item.date_display}</span> : null}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No stories linked.</p>}
        </div>
      </section>

      <section className="mt-6 rounded-xl border p-5 text-sm text-gray-600">
        <p><span className="font-medium text-gray-800">Original file:</span> {media.original_filename}</p>
        <p className="mt-1"><span className="font-medium text-gray-800">Type:</span> {media.mime_type}</p>
      </section>
    </main>
  );
}
