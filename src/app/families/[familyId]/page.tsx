import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddContentMenu } from "@/components/add-content-menu";
import { MediaPreview } from "@/components/media-preview";
import { ButtonLink, Card } from "@/components/ui";
import { createSignedMediaMap, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type FamilyDashboardPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ storyCreated?: string; eventDeleted?: string; storyDeleted?: string; familyUpdated?: string; joined?: string; restored?: string; error?: string }>;
};

export default async function FamilyDashboardPage({ params, searchParams }: FamilyDashboardPageProps) {
  const { familyId } = await params;
  const { storyCreated, eventDeleted, storyDeleted, familyUpdated, joined, restored, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, eventsResult, storiesResult, mediaResult, membershipResult, memberCountResult, peopleResult] = await Promise.all([
    supabase.from("families").select("id, name, description").eq("id", familyId).maybeSingle(),
    supabase.from("events").select("id, title, event_type, date_display").eq("family_id", familyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("stories").select("id, title, content, date_display").eq("family_id", familyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("media_items").select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(4),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
    supabase.from("family_memberships").select("id", { count: "exact", head: true }).eq("family_id", familyId),
    supabase.from("people").select("id, display_name, birth_date_display, death_date_display").eq("family_id", familyId).order("created_at", { ascending: false }).order("id").limit(5),
  ]);

  const family = familyResult.data;
  if (familyResult.error || !family) notFound();

  const media = (mediaResult.data ?? []) as MediaRecord[];
  const signedByPath = await createSignedMediaMap(media.filter((item) => item.media_type === "image").map((item) => item.storage_path));
  const role = membershipResult.data?.role;
  const canEdit = Boolean(role && ["owner", "admin", "editor"].includes(role));
  const canManageArchive = Boolean(role && ["owner", "admin"].includes(role));
  const memberCount = memberCountResult.error ? null : memberCountResult.count;
  const recentPeople = peopleResult.data ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-8">
      <Link href="/families" className="text-sm underline">Back to your families</Link>

      {joined === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Invitation accepted. You now have {role ? `${role} ` : ""}access to this family.</p>}
      {restored === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Family archive restored. Previous members can access it again.</p>}
      {storyCreated === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Story saved successfully.</p>}
      {eventDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Event deleted. Linked people, stories, and media were kept.</p>}
      {storyDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Story deleted. Linked people, events, and media were kept.</p>}
      {familyUpdated === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Family archive updated successfully.</p>}
      {errorCode === "no-edit-access" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Your role does not allow adding or editing family content.</p>}
      {errorCode === "no-manage-access" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Only the Owner or an Admin can edit archive settings.</p>}
      {errorCode === "no-member-manage-access" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Only the Owner can manage family members.</p>}
      {errorCode === "owner-only-delete" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Only the Owner can delete the family archive.</p>}

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium uppercase tracking-wide text-muted">Family archive</p>
            <h1 className="mt-1 text-3xl font-semibold wrap-anywhere">{family.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 text-sm">
              <Link href={`/families/${familyId}/members`} className="inline-flex min-h-11 items-center gap-1 underline hover:text-primary">
                {memberCount === null ? "Members" : <><span className="font-semibold">{memberCount}</span> {memberCount === 1 ? "member" : "members"}</>}
              </Link>
              <span className="text-muted">Your role: {role ?? "member"}</span>
            </div>
            {memberCount === null && <p className="text-sm text-muted">Member count is unavailable. Open Members to try again.</p>}
            {family.description && <p className="mt-2 max-w-2xl text-muted wrap-anywhere">{family.description}</p>}
          </div>
          {canEdit && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-start">
              {canManageArchive && <ButtonLink href={`/families/${familyId}/edit`} variant="secondary">Edit Archive</ButtonLink>}
              <AddContentMenu familyId={familyId} />
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
        <Card className="p-5 sm:p-6" aria-labelledby="recent-people-heading">
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <h2 id="recent-people-heading" className="text-lg font-semibold">People</h2>
            <Link href={`/families/${familyId}/people`} className="inline-flex min-h-11 items-center text-sm underline hover:text-primary" aria-label="View all people">View all</Link>
          </div>
          {peopleResult.error ? (
            <p className="mt-4 text-sm text-danger" role="status">We could not load recent people. Please refresh and try again.</p>
          ) : recentPeople.length ? (
            <ul className="mt-2">
              {recentPeople.map((person) => (
                <li key={person.id}>
                  <Link href={`/families/${familyId}/people/${person.id}`} className="flex min-h-11 items-center py-2 font-medium underline wrap-anywhere hover:text-primary">
                    {person.display_name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-muted">No people have been added yet.</p>}
        </Card>

        <div className="rounded-xl border bg-surface p-6"><h2 className="text-lg font-semibold">Recent events</h2>{(eventsResult.data ?? []).length ? <ul className="mt-4 space-y-4">{(eventsResult.data ?? []).map((event) => <li key={event.id}><Link href={`/families/${familyId}/events/${event.id}`} className="font-medium underline">{event.title}</Link><p className="mt-1 text-sm capitalize text-gray-500">{event.event_type.replaceAll("_", " ")}{event.date_display ? ` · ${event.date_display}` : " · Date unknown"}</p></li>)}</ul> : <p className="mt-4 text-gray-500">No events yet.</p>}</div>
        <div className="rounded-xl border bg-surface p-6"><h2 className="text-lg font-semibold">Recent stories</h2>{(storiesResult.data ?? []).length ? <div className="mt-4 space-y-4">{(storiesResult.data ?? []).map((story) => <article key={story.id}><h3 className="font-medium"><Link className="underline" href={`/families/${familyId}/stories/${story.id}`}>{story.title}</Link></h3><p className="mt-1 text-sm text-gray-500">{story.date_display || "Date unknown"}</p><p className="mt-2 line-clamp-3 text-sm text-gray-700">{story.content}</p></article>)}</div> : <p className="mt-4 text-gray-500">No stories yet.</p>}</div>

        <section className="rounded-xl border bg-surface p-6">
          <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Recent media</h2><Link href={`/families/${familyId}/media`} className="text-sm underline">View all media</Link></div>
          {media.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{media.map((item) => <article key={item.id} className="rounded-lg border bg-surface p-4">{item.media_type === "image" ? <MediaPreview mediaType="image" signedUrl={signedByPath.get(item.storage_path) ?? null} title={item.title} compact /> : <div className="flex h-24 items-center justify-center rounded-lg bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">{item.media_type}</div>}<h3 className="mt-3 font-medium"><Link className="underline" href={`/families/${familyId}/media/${item.id}`}>{item.title}</Link></h3></article>)}</div> : <p className="mt-4 text-gray-500">No media yet.</p>}
        </section>
      </div>
    </main>
  );
}
