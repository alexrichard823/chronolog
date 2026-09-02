import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DatePrecisionFields } from "@/components/date-precision-fields";
import { createClient } from "@/lib/supabase/server";
import { updateEvent } from "../../actions";

type Props = { params: Promise<{ familyId: string; eventId: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditEventPage({ params, searchParams }: Props) {
  const { familyId, eventId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, eventResult, peopleResult, linksResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("events").select("id, title, event_type, description, place_name, date_precision, date_start, date_end").eq("id", eventId).eq("family_id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("event_people").select("person_id").eq("family_id", familyId).eq("event_id", eventId),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (familyResult.error || !familyResult.data || eventResult.error || !eventResult.data) notFound();
  if (!membershipResult.data || !["owner", "admin", "editor"].includes(membershipResult.data.role)) redirect(`/families/${familyId}/events/${eventId}?error=no-edit-access`);

  const event = eventResult.data;
  const linkedPeople = new Set((linksResult.data ?? []).map((row) => row.person_id));
  const errorMessage = errorCode === "missing-title" ? "Enter an event title." : errorCode === "invalid-date" ? "Check the date information and try again." : errorCode === "update-failed" ? "We could not save this event. Check your access and selections." : null;

  return <main className="mx-auto w-full max-w-2xl p-8">
    <Link href={`/families/${familyId}/events/${eventId}`} className="text-sm underline">Back to {event.title}</Link>
    <h1 className="mt-6 text-3xl font-semibold">Edit Event</h1>
    {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

    <form action={updateEvent} className="mt-8 space-y-6">
      <input type="hidden" name="familyId" value={familyId} /><input type="hidden" name="eventId" value={eventId} />
      <div><label className="block text-sm font-medium" htmlFor="title">Title</label><input id="title" name="title" required maxLength={200} defaultValue={event.title} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <div><label className="block text-sm font-medium" htmlFor="eventType">Event type</label><select id="eventType" name="eventType" defaultValue={event.event_type} className="mt-2 w-full rounded border px-3 py-2"><option value="birth">Birth</option><option value="death">Death</option><option value="marriage">Marriage</option><option value="immigration">Immigration</option><option value="move">Move</option><option value="education">Education</option><option value="employment">Employment</option><option value="military_service">Military service</option><option value="family_milestone">Family milestone</option><option value="custom">Custom</option></select></div>

      <DatePrecisionFields legend="Date" initialPrecision={event.date_precision} initialDateStart={event.date_start} initialDateEnd={event.date_end} />

      <div><label className="block text-sm font-medium" htmlFor="placeName">Place</label><input id="placeName" name="placeName" maxLength={200} defaultValue={event.place_name ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <div><label className="block text-sm font-medium" htmlFor="description">Description</label><textarea id="description" name="description" rows={5} defaultValue={event.description ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
      <fieldset><legend className="text-sm font-medium">People involved</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{(peopleResult.data ?? []).map((person) => <label key={person.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" name="personIds" value={person.id} defaultChecked={linkedPeople.has(person.id)} />{person.display_name}</label>)}</div></fieldset>
      <div className="flex gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Save changes</button><Link href={`/families/${familyId}/events/${eventId}`} className="rounded border px-4 py-2">Cancel</Link></div>
    </form>
  </main>;
}
