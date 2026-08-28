import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { createSignedMediaMap, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type FamilyDashboardPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ storyCreated?: string; eventDeleted?: string; storyDeleted?: string; familyUpdated?: string; joined?: string; error?: string }>;
};

export default async function FamilyDashboardPage({ params, searchParams }: FamilyDashboardPageProps) {
  const { familyId } = await params;
  const { storyCreated, eventDeleted, storyDeleted, familyUpdated, joined, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, eventsResult, storiesResult, mediaResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name, description").eq("id", familyId).maybeSingle(),
    supabase.from("events").select("id, title, event_type, date_display").eq("family_id", familyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("stories").select("id, title, content, date_display").eq("family_id", familyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("media_items").select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(4),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);

  const family = familyResult.data;
  if (familyResult.error || !family) notFound();

  const media = (mediaResult.data ?? []) as MediaRecord[];
  const signedByPath = await createSignedMediaMap(media.filter((item) => item.media_type === "image").map((item) => item.storage_path));
  const role = membershipResult.data?.role;
  const canEdit = Boolean(role && ["owner", "admin", "editor"].includes(role));
  const canManageArchive = Boolean(role && ["owner", "admin"].includes(role));

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/families" className="text-sm underline">Back to your families</Link>

      {joined === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Invitation accepted. You now have {role ? `${role} ` : ""}access to this family.</p>}
      {storyCreated === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Story saved successfully.</p>}
      {eventDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Event deleted. Linked people, stories, and media were kept.</p>}
      {storyDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Story deleted. Linked people, events, and media were kept.</p>}
      {familyUpdated === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Family archive updated successfully.</p>}
      {errorCode === "no-edit-access" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Your role does not allow adding or editing family content.</p>}
      {errorCode === "no-manage-access" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Only the Owner or an Admin can edit archive settings.</p>}
      {errorCode === "no-member-manage-access" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Only the Owner can manage family members.</p>}
      {errorCode === "owner-only-delete" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Only the Owner can delete the family archive.</p>}

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-sm font-medium uppercase tracking-wide text-gray-500">Family archive</p><h1 className="mt-1 text-3xl font-semibold">{family.name}</h1>{family.description && <p className="mt-3 max-w-2xl text-gray-600">{family.description}</p>}<p className="mt-3 text-sm text-gray-500">Your role: {role ?? "member"}</p></div>
          <div className="flex flex-wrap gap-3"><Link href={`/families/${familyId}/people`} className="rounded border px-4 py-2">View People</Link><Link href={`/families/${familyId}/timeline`} className="rounded border px-4 py-2">View Timeline</Link><Link href={`/families/${familyId}/tree`} className="rounded border px-4 py-2">View Tree</Link><Link href={`/families/${familyId}/media`} className="rounded border px-4 py-2">View Media</Link><Link href={`/families/${familyId}/members`} className="rounded border px-4 py-2">Members</Link>{canManageArchive && <Link href={`/families/${familyId}/edit`} className="rounded border px-4 py-2">Edit Archive</Link>}{canEdit && <><Link href={`/families/${familyId}/people/new`} className="rounded border px-4 py-2">Add Person</Link><Link href={`/families/${familyId}/events/new`} className="rounded border px-4 py-2">Add Event</Link><Link href={`/families/${familyId}/media/new`} className="rounded border px-4 py-2">Add Media</Link><Link href={`/families/${familyId}/stories/new`} className="rounded bg-black px-4 py-2 text-white">Add Story</Link></>}</div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-6"><h2 className="text-lg font-semibold">Recent events</h2>{(eventsResult.data ?? []).length ? <ul className="mt-4 space-y-4">{(eventsResult.data ?? []).map((event) => <li key={event.id}><Link href={`/families/${familyId}/events/${event.id}`} className="font-medium underline">{event.title}</Link><p className="mt-1 text-sm capitalize text-gray-500">{event.event_type.replaceAll("_", " ")}{event.date_display ? ` · ${event.date_display}` : " · Date unknown"}</p></li>)}</ul> : <p className="mt-4 text-gray-500">No events yet.</p>}</div>
        <div className="rounded-xl border p-6"><h2 className="text-lg font-semibold">Recent stories</h2>{(storiesResult.data ?? []).length ? <div className="mt-4 space-y-4">{(storiesResult.data ?? []).map((story) => <article key={story.id}><h3 className="font-medium"><Link className="underline" href={`/families/${familyId}/stories/${story.id}`}>{story.title}</Link></h3><p className="mt-1 text-sm text-gray-500">{story.date_display || "Date unknown"}</p><p className="mt-2 line-clamp-3 text-sm text-gray-700">{story.content}</p></article>)}</div> : <p className="mt-4 text-gray-500">No stories yet.</p>}</div>
      </section>

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Recent media</h2><Link href={`/families/${familyId}/media`} className="text-sm underline">View all media</Link></div>
        {media.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{media.map((item) => <article key={item.id} className="rounded-lg border p-4">{item.media_type === "image" ? <MediaPreview mediaType="image" signedUrl={signedByPath.get(item.storage_path) ?? null} title={item.title} compact /> : <div className="flex h-24 items-center justify-center rounded-lg bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">{item.media_type}</div>}<h3 className="mt-3 font-medium"><Link className="underline" href={`/families/${familyId}/media/${item.id}`}>{item.title}</Link></h3></article>)}</div> : <p className="mt-4 text-gray-500">No media yet.</p>}
      </section>
    </main>
  );
}
