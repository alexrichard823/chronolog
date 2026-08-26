import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { createSignedMediaMap, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ familyId: string; storyId: string }>;
};

export default async function StoryDetailPage({ params }: Props) {
  const { familyId, storyId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, storyResult, peopleLinksResult, eventLinksResult, mediaLinksResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("stories").select("id, title, content, date_display, place_name, updated_at").eq("id", storyId).eq("family_id", familyId).maybeSingle(),
    supabase.from("story_people").select("person_id").eq("family_id", familyId).eq("story_id", storyId),
    supabase.from("story_events").select("event_id").eq("family_id", familyId).eq("story_id", storyId),
    supabase.from("media_stories").select("media_id").eq("family_id", familyId).eq("story_id", storyId),
  ]);

  if (familyResult.error || !familyResult.data || storyResult.error || !storyResult.data) notFound();

  const personIds = (peopleLinksResult.data ?? []).map((row) => row.person_id);
  const eventIds = (eventLinksResult.data ?? []).map((row) => row.event_id);
  const mediaIds = (mediaLinksResult.data ?? []).map((row) => row.media_id);

  const [peopleResult, eventsResult, mediaResult] = await Promise.all([
    personIds.length ? supabase.from("people").select("id, display_name").eq("family_id", familyId).in("id", personIds).order("display_name") : Promise.resolve({ data: [] }),
    eventIds.length ? supabase.from("events").select("id, title, date_display").eq("family_id", familyId).in("id", eventIds).order("date_start", { nullsFirst: false }) : Promise.resolve({ data: [] }),
    mediaIds.length ? supabase.from("media_items").select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at").eq("family_id", familyId).in("id", mediaIds).order("created_at") : Promise.resolve({ data: [] }),
  ]);

  const media = (mediaResult.data ?? []) as MediaRecord[];
  const signedByPath = await createSignedMediaMap(media.map((item) => item.storage_path));
  const story = storyResult.data;

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Family story</p>
            <h1 className="mt-1 text-3xl font-semibold">{story.title}</h1>
            <p className="mt-3 text-gray-600">{story.date_display || "Date unknown"}{story.place_name ? ` · ${story.place_name}` : ""}</p>
          </div>
          <Link href={`/families/${familyId}/media/new?storyId=${storyId}`} className="rounded bg-black px-4 py-2 text-center text-white">Add Media</Link>
        </div>
        <p className="mt-6 whitespace-pre-wrap text-gray-700">{story.content}</p>
      </section>

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Media</h2>
          <Link href={`/families/${familyId}/media/new?storyId=${storyId}`} className="text-sm underline">Attach media</Link>
        </div>
        {media.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {media.map((item) => (
              <article key={item.id} className="rounded-lg border p-4">
                <MediaPreview mediaType={item.media_type} signedUrl={signedByPath.get(item.storage_path) ?? null} title={item.title} compact />
                <h3 className="mt-3 font-semibold"><Link className="underline" href={`/families/${familyId}/media/${item.id}`}>{item.title}</Link></h3>
              </article>
            ))}
          </div>
        ) : <p className="mt-4 text-gray-500">No media is attached to this story yet.</p>}
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold">People in this story</h2>
          {(peopleResult.data ?? []).length ? <ul className="mt-3 space-y-2">{(peopleResult.data ?? []).map((person) => <li key={person.id}><Link className="underline" href={`/families/${familyId}/people/${person.id}`}>{person.display_name}</Link></li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No people linked.</p>}
        </div>
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold">Related events</h2>
          {(eventsResult.data ?? []).length ? <ul className="mt-3 space-y-2">{(eventsResult.data ?? []).map((item) => <li key={item.id}><Link className="underline" href={`/families/${familyId}/events/${item.id}`}>{item.title}</Link>{item.date_display ? <span className="text-sm text-gray-500"> · {item.date_display}</span> : null}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No events linked.</p>}
        </div>
      </section>
    </main>
  );
}
