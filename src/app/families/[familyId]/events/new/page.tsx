import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "../actions";

type Props = { params: Promise<{ familyId: string }>; searchParams: Promise<{ error?: string }> };

export default async function NewEventPage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, peopleResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
  ]);
  if (familyResult.error || !familyResult.data) notFound();

  const errorMessage = errorCode === "missing-title" ? "Enter an event title." : errorCode === "invalid-date" ? "Check the date information and try again." : errorCode === "create-failed" ? "We could not create this event. Check your access and selections." : null;

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>
      <h1 className="mt-6 text-3xl font-semibold">Add Event</h1>
      <p className="mt-2 text-gray-600">Record what happened, when it happened, where it happened, and everyone involved.</p>
      {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

      <form action={createEvent} className="mt-8 space-y-6">
        <input type="hidden" name="familyId" value={familyId} />
        <div><label className="block text-sm font-medium" htmlFor="title">Title</label><input id="title" name="title" required maxLength={200} className="mt-2 w-full rounded border px-3 py-2" placeholder="e.g. Immigration to the United States" /></div>
        <div><label className="block text-sm font-medium" htmlFor="eventType">Event type</label><select id="eventType" name="eventType" className="mt-2 w-full rounded border px-3 py-2"><option value="birth">Birth</option><option value="death">Death</option><option value="marriage">Marriage</option><option value="immigration">Immigration</option><option value="move">Move</option><option value="education">Education</option><option value="employment">Employment</option><option value="military_service">Military service</option><option value="family_milestone">Family milestone</option><option value="custom">Custom</option></select></div>

        <fieldset className="rounded border p-4"><legend className="px-1 text-sm font-medium">Date</legend>
          <label className="mt-2 block text-sm">Precision</label><select name="datePrecision" defaultValue="unknown" className="mt-2 w-full rounded border px-3 py-2"><option value="unknown">Unknown</option><option value="exact">Exact date</option><option value="approximate">Approximate year</option><option value="range">Date range</option></select>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="block text-sm">Exact date</label><input type="date" name="exactDate" className="mt-2 w-full rounded border px-3 py-2" /></div><div><label className="block text-sm">Approximate year</label><input type="number" min="1" max="9999" name="approximateYear" className="mt-2 w-full rounded border px-3 py-2" placeholder="1930" /></div><div><label className="block text-sm">Range start</label><input type="date" name="rangeStart" className="mt-2 w-full rounded border px-3 py-2" /></div><div><label className="block text-sm">Range end</label><input type="date" name="rangeEnd" className="mt-2 w-full rounded border px-3 py-2" /></div></div>
          <p className="mt-3 text-xs text-gray-500">Only the fields for the selected precision are used.</p>
        </fieldset>

        <div><label className="block text-sm font-medium" htmlFor="placeName">Place</label><input id="placeName" name="placeName" maxLength={200} className="mt-2 w-full rounded border px-3 py-2" placeholder="e.g. Boston, Massachusetts" /></div>
        <div><label className="block text-sm font-medium" htmlFor="description">Description</label><textarea id="description" name="description" rows={5} className="mt-2 w-full rounded border px-3 py-2" /></div>

        <fieldset><legend className="text-sm font-medium">People involved</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{(peopleResult.data ?? []).map((person) => <label key={person.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="personIds" value={person.id} />{person.display_name}</label>)}</div>{(peopleResult.data ?? []).length === 0 && <p className="mt-2 text-sm text-gray-500">Add people first if you want to connect participants.</p>}</fieldset>

        <div className="flex gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Create event</button><Link href={`/families/${familyId}`} className="rounded border px-4 py-2">Cancel</Link></div>
      </form>
    </main>
  );
}
