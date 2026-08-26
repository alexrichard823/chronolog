import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createStory } from "../actions";

type Props = { params: Promise<{ familyId: string }>; searchParams: Promise<{ error?: string; eventId?: string; personId?: string }> };

export default async function NewStoryPage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const { error: errorCode, eventId, personId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, peopleResult, eventsResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("events").select("id, title, date_display").eq("family_id", familyId).order("date_start", { nullsFirst: false }),
  ]);
  if (familyResult.error || !familyResult.data) notFound();

  const errorMessage = errorCode === "missing-content" ? "Enter a title and story." : errorCode === "invalid-date" ? "Check the date information and try again." : errorCode === "create-failed" ? "We could not save this story. Check your access and selections." : null;

  return <main className="mx-auto w-full max-w-2xl p-8">
    <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>
    <h1 className="mt-6 text-3xl font-semibold">Add Story</h1>
    <p className="mt-2 text-gray-600">Preserve the context behind the facts. Connect the story to every person and event it belongs to.</p>
    {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

    <details className="mt-6 rounded border p-4"><summary className="cursor-pointer font-medium">Need a writing prompt?</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600"><li>What do you remember most clearly about this time?</li><li>Why did this event matter to the family?</li><li>Who was there, and what did they say or do?</li><li>What happened before and after this moment?</li></ul></details>

    <form action={createStory} className="mt-8 space-y-6"><input type="hidden" name="familyId" value={familyId} />
      <div><label htmlFor="title" className="block text-sm font-medium">Title</label><input id="title" name="title" required maxLength={200} className="mt-2 w-full rounded border px-3 py-2" placeholder="e.g. Why Joseph and Mary left home" /></div>
      <div><label htmlFor="content" className="block text-sm font-medium">Story</label><textarea id="content" name="content" required rows={10} className="mt-2 w-full rounded border px-3 py-2" placeholder="Write the memory, context, or family story here..." /></div>

      <fieldset className="rounded border p-4"><legend className="px-1 text-sm font-medium">Story date</legend><select name="datePrecision" defaultValue="unknown" className="mt-2 w-full rounded border px-3 py-2"><option value="unknown">Unknown</option><option value="exact">Exact date</option><option value="approximate">Approximate year</option><option value="range">Date range</option></select><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="block text-sm">Exact date</label><input type="date" name="exactDate" className="mt-2 w-full rounded border px-3 py-2" /></div><div><label className="block text-sm">Approximate year</label><input type="number" min="1" max="9999" name="approximateYear" className="mt-2 w-full rounded border px-3 py-2" /></div><div><label className="block text-sm">Range start</label><input type="date" name="rangeStart" className="mt-2 w-full rounded border px-3 py-2" /></div><div><label className="block text-sm">Range end</label><input type="date" name="rangeEnd" className="mt-2 w-full rounded border px-3 py-2" /></div></div><p className="mt-3 text-xs text-gray-500">Only the fields for the selected precision are used.</p></fieldset>

      <div><label htmlFor="placeName" className="block text-sm font-medium">Place</label><input id="placeName" name="placeName" maxLength={200} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <fieldset><legend className="text-sm font-medium">People in this story</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{(peopleResult.data ?? []).map((person) => <label key={person.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="personIds" value={person.id} defaultChecked={person.id === personId} />{person.display_name}</label>)}</div></fieldset>
      <fieldset><legend className="text-sm font-medium">Related events</legend><div className="mt-3 space-y-2">{(eventsResult.data ?? []).map((event) => <label key={event.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="eventIds" value={event.id} defaultChecked={event.id === eventId} /><span>{event.title}{event.date_display ? ` — ${event.date_display}` : ""}</span></label>)}</div>{(eventsResult.data ?? []).length === 0 && <p className="mt-2 text-sm text-gray-500">No events have been added yet.</p>}</fieldset>
      <div className="flex gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Save story</button><Link href={`/families/${familyId}`} className="rounded border px-4 py-2">Cancel</Link></div>
    </form>
  </main>;
}
