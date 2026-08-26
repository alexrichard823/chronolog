import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateMedia } from "../../actions";

type Props = { params: Promise<{ familyId: string; mediaId: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditMediaPage({ params, searchParams }: Props) {
  const { familyId, mediaId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, mediaResult, peopleResult, eventsResult, storiesResult, peopleLinksResult, eventLinksResult, storyLinksResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("media_items").select("id, title, description, original_filename, date_captured").eq("id", mediaId).eq("family_id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("events").select("id, title, date_display").eq("family_id", familyId).order("date_start", { nullsFirst: false }),
    supabase.from("stories").select("id, title, date_display").eq("family_id", familyId).order("date_start", { nullsFirst: false }),
    supabase.from("media_people").select("person_id").eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_events").select("event_id").eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_stories").select("story_id").eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (familyResult.error || !familyResult.data || mediaResult.error || !mediaResult.data) notFound();
  if (!membershipResult.data || !["owner", "admin", "editor"].includes(membershipResult.data.role)) redirect(`/families/${familyId}/media/${mediaId}?error=no-edit-access`);

  const media = mediaResult.data;
  const linkedPeople = new Set((peopleLinksResult.data ?? []).map((row) => row.person_id));
  const linkedEvents = new Set((eventLinksResult.data ?? []).map((row) => row.event_id));
  const linkedStories = new Set((storyLinksResult.data ?? []).map((row) => row.story_id));
  const errorMessage = errorCode === "missing-title" ? "Enter a media title." : errorCode === "invalid-date" ? "Check the date and try again." : errorCode === "update-failed" ? "We could not save this media item. Check your access and links." : null;

  return <main className="mx-auto w-full max-w-2xl p-8">
    <Link href={`/families/${familyId}/media/${mediaId}`} className="text-sm underline">Back to {media.title}</Link>
    <h1 className="mt-6 text-3xl font-semibold">Edit Media</h1>
    <p className="mt-2 text-gray-600">Edit the title, description, date, and family links. The uploaded file itself stays unchanged; delete and re-upload the media item if the wrong file was attached.</p>
    {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

    <form action={updateMedia} className="mt-8 space-y-6">
      <input type="hidden" name="familyId" value={familyId} /><input type="hidden" name="mediaId" value={mediaId} />
      <div className="rounded border bg-gray-50 p-4 text-sm"><span className="font-medium">File:</span> {media.original_filename}</div>
      <div><label htmlFor="title" className="block text-sm font-medium">Title</label><input id="title" name="title" required maxLength={200} defaultValue={media.title} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <div><label htmlFor="description" className="block text-sm font-medium">Description</label><textarea id="description" name="description" rows={4} defaultValue={media.description ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <div><label htmlFor="dateCaptured" className="block text-sm font-medium">Date captured or created</label><input id="dateCaptured" name="dateCaptured" type="date" defaultValue={media.date_captured ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>

      <fieldset><legend className="text-sm font-medium">People shown or heard</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{(peopleResult.data ?? []).map((person) => <label key={person.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="personIds" value={person.id} defaultChecked={linkedPeople.has(person.id)} />{person.display_name}</label>)}</div></fieldset>
      <fieldset><legend className="text-sm font-medium">Related events</legend><div className="mt-3 space-y-2">{(eventsResult.data ?? []).map((item) => <label key={item.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="eventIds" value={item.id} defaultChecked={linkedEvents.has(item.id)} /><span>{item.title}{item.date_display ? ` — ${item.date_display}` : ""}</span></label>)}</div></fieldset>
      <fieldset><legend className="text-sm font-medium">Related stories</legend><div className="mt-3 space-y-2">{(storiesResult.data ?? []).map((item) => <label key={item.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="storyIds" value={item.id} defaultChecked={linkedStories.has(item.id)} /><span>{item.title}{item.date_display ? ` — ${item.date_display}` : ""}</span></label>)}</div></fieldset>

      <div className="flex gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Save changes</button><Link href={`/families/${familyId}/media/${mediaId}`} className="rounded border px-4 py-2">Cancel</Link></div>
    </form>
  </main>;
}
