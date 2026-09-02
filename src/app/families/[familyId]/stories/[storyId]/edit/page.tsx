import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DatePrecisionFields } from "@/components/date-precision-fields";
import { createClient } from "@/lib/supabase/server";
import { updateStory } from "../../actions";

type Props = { params: Promise<{ familyId: string; storyId: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditStoryPage({ params, searchParams }: Props) {
  const { familyId, storyId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, storyResult, peopleResult, eventsResult, peopleLinksResult, eventLinksResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("stories").select("id, title, content, place_name, date_precision, date_start, date_end").eq("id", storyId).eq("family_id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("events").select("id, title, date_display").eq("family_id", familyId).order("date_start", { nullsFirst: false }),
    supabase.from("story_people").select("person_id").eq("family_id", familyId).eq("story_id", storyId),
    supabase.from("story_events").select("event_id").eq("family_id", familyId).eq("story_id", storyId),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (familyResult.error || !familyResult.data || storyResult.error || !storyResult.data) notFound();
  if (!membershipResult.data || !["owner", "admin", "editor"].includes(membershipResult.data.role)) redirect(`/families/${familyId}/stories/${storyId}?error=no-edit-access`);

  const story = storyResult.data;
  const linkedPeople = new Set((peopleLinksResult.data ?? []).map((row) => row.person_id));
  const linkedEvents = new Set((eventLinksResult.data ?? []).map((row) => row.event_id));
  const errorMessage = errorCode === "missing-content" ? "Enter a title and story." : errorCode === "invalid-date" ? "Check the date information and try again." : errorCode === "update-failed" ? "We could not save this story. Check your access and selections." : null;

  return <main className="mx-auto w-full max-w-2xl p-8">
    <Link href={`/families/${familyId}/stories/${storyId}`} className="text-sm underline">Back to {story.title}</Link>
    <h1 className="mt-6 text-3xl font-semibold">Edit Story</h1>
    {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

    <form action={updateStory} className="mt-8 space-y-6"><input type="hidden" name="familyId" value={familyId} /><input type="hidden" name="storyId" value={storyId} />
      <div><label htmlFor="title" className="block text-sm font-medium">Title</label><input id="title" name="title" required maxLength={200} defaultValue={story.title} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <div><label htmlFor="content" className="block text-sm font-medium">Story</label><textarea id="content" name="content" required rows={10} defaultValue={story.content} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <DatePrecisionFields legend="Story date" initialPrecision={story.date_precision} initialDateStart={story.date_start} initialDateEnd={story.date_end} />
      <div><label htmlFor="placeName" className="block text-sm font-medium">Place</label><input id="placeName" name="placeName" maxLength={200} defaultValue={story.place_name ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <fieldset><legend className="text-sm font-medium">People in this story</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{(peopleResult.data ?? []).map((person) => <label key={person.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="personIds" value={person.id} defaultChecked={linkedPeople.has(person.id)} />{person.display_name}</label>)}</div></fieldset>
      <fieldset><legend className="text-sm font-medium">Related events</legend><div className="mt-3 space-y-2">{(eventsResult.data ?? []).map((event) => <label key={event.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="eventIds" value={event.id} defaultChecked={linkedEvents.has(event.id)} /><span>{event.title}{event.date_display ? ` — ${event.date_display}` : ""}</span></label>)}</div></fieldset>
      <div className="flex gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Save changes</button><Link href={`/families/${familyId}/stories/${storyId}`} className="rounded border px-4 py-2">Cancel</Link></div>
    </form>
  </main>;
}
