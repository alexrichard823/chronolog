import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePerson } from "../../actions";
import DateFields from "../../new/date-fields";

type Props = {
  params: Promise<{ familyId: string; personId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditPersonPage({ params, searchParams }: Props) {
  const { familyId, personId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, personResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name, first_name, middle_name, last_name, maiden_name, nickname, life_status, biography, notes, birth_date_precision, birth_date_start, death_date_precision, death_date_start").eq("id", personId).eq("family_id", familyId).maybeSingle(),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (familyResult.error || !familyResult.data || personResult.error || !personResult.data) notFound();
  if (!membershipResult.data || !["owner", "admin", "editor"].includes(membershipResult.data.role)) redirect(`/families/${familyId}/people/${personId}?error=no-edit-access`);

  const person = personResult.data;
  const errorMessage = errorCode === "missing-name"
    ? "Enter a name for this person."
    : errorCode === "invalid-date"
      ? "Check the birth and death dates and try again."
      : errorCode === "invalid-person"
        ? "Check the person information and try again."
        : errorCode === "update-failed"
          ? "We could not save these changes. Check your access and try again."
          : null;

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <Link href={`/families/${familyId}/people/${personId}`} className="text-sm underline">Back to {person.display_name}</Link>
      <h1 className="mt-6 text-3xl font-semibold">Edit Person</h1>
      <p className="mt-2 text-gray-600">Correct names, life details, dates, biography, and notes without changing this person&apos;s identity in the family tree.</p>
      {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

      <form action={updatePerson} className="mt-8 space-y-6">
        <input type="hidden" name="familyId" value={familyId} />
        <input type="hidden" name="personId" value={personId} />

        <div><label htmlFor="displayName" className="block text-sm font-medium">Display name</label><input id="displayName" name="displayName" required maxLength={200} defaultValue={person.display_name} className="mt-2 w-full rounded border px-3 py-2" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="firstName" className="block text-sm font-medium">First name</label><input id="firstName" name="firstName" defaultValue={person.first_name ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
          <div><label htmlFor="middleName" className="block text-sm font-medium">Middle name</label><input id="middleName" name="middleName" defaultValue={person.middle_name ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
          <div><label htmlFor="lastName" className="block text-sm font-medium">Last name</label><input id="lastName" name="lastName" defaultValue={person.last_name ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
          <div><label htmlFor="maidenName" className="block text-sm font-medium">Maiden name</label><input id="maidenName" name="maidenName" defaultValue={person.maiden_name ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
          <div><label htmlFor="nickname" className="block text-sm font-medium">Nickname</label><input id="nickname" name="nickname" defaultValue={person.nickname ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
          <div><label htmlFor="lifeStatus" className="block text-sm font-medium">Life status</label><select id="lifeStatus" name="lifeStatus" defaultValue={person.life_status} className="mt-2 w-full rounded border px-3 py-2"><option value="unknown">Unknown</option><option value="living">Living</option><option value="deceased">Deceased</option></select></div>
        </div>

        <DateFields prefix="birth" label="Birth date" initialPrecision={person.birth_date_precision} initialDateStart={person.birth_date_start} />
        <DateFields prefix="death" label="Death date" initialPrecision={person.death_date_precision} initialDateStart={person.death_date_start} />

        <div><label htmlFor="biography" className="block text-sm font-medium">Biography</label><textarea id="biography" name="biography" rows={6} defaultValue={person.biography ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
        <div><label htmlFor="notes" className="block text-sm font-medium">Notes</label><textarea id="notes" name="notes" rows={4} defaultValue={person.notes ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>

        <div className="flex gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Save changes</button><Link href={`/families/${familyId}/people/${personId}`} className="rounded border px-4 py-2">Cancel</Link></div>
      </form>
    </main>
  );
}
