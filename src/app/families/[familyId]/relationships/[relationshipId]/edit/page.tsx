import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createClient } from "@/lib/supabase/server";
import { deleteRelationship, updateRelationship } from "../../actions";

type Props = {
  params: Promise<{ familyId: string; relationshipId: string }>;
  searchParams: Promise<{ error?: string; returnPersonId?: string }>;
};

export default async function EditRelationshipPage({ params, searchParams }: Props) {
  const { familyId, relationshipId } = await params;
  const { error: errorCode, returnPersonId: requestedReturn } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, relationshipResult, peopleResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("relationships").select("id, relationship_type, person_a_id, person_b_id, parent_child_subtype, partner_status, notes").eq("id", relationshipId).eq("family_id", familyId).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (familyResult.error || !familyResult.data || relationshipResult.error || !relationshipResult.data) notFound();
  if (!membershipResult.data || !["owner", "admin", "editor"].includes(membershipResult.data.role)) redirect(`/families/${familyId}?error=no-edit-access`);

  const relationship = relationshipResult.data;
  const people = peopleResult.data ?? [];
  const personById = new Map(people.map((person) => [person.id, person.display_name]));
  const returnPersonId = requestedReturn && personById.has(requestedReturn) ? requestedReturn : relationship.person_a_id;
  const errorMessage = errorCode === "cycle"
    ? "That change would create a circular ancestry. A descendant can never become an ancestor of their own ancestor."
    : errorCode === "duplicate"
      ? "That relationship already exists."
      : errorCode === "invalid-link" || errorCode === "missing-fields"
        ? "Check the people and relationship type. A person cannot be related to themselves."
        : errorCode === "update-failed"
          ? "We could not save this relationship. Check your access and try again."
          : null;

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <Link href={`/families/${familyId}/people/${returnPersonId}`} className="text-sm underline">Back to profile</Link>
      <h1 className="mt-6 text-3xl font-semibold">Edit Relationship</h1>
      <p className="mt-2 text-gray-600">Correct the people, direction, type, and notes. Parent-child direction is stored explicitly and protected against ancestry loops.</p>
      {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

      <form action={updateRelationship} className="mt-8 space-y-6">
        <input type="hidden" name="familyId" value={familyId} />
        <input type="hidden" name="relationshipId" value={relationshipId} />
        <input type="hidden" name="returnPersonId" value={returnPersonId} />

        <div><label htmlFor="relationshipType" className="block text-sm font-medium">Relationship type</label><select id="relationshipType" name="relationshipType" defaultValue={relationship.relationship_type} className="mt-2 w-full rounded border px-3 py-2"><option value="parent_child">Parent → child</option><option value="spouse_partner">Spouse / partner</option></select><p className="mt-2 text-xs text-gray-500">For Parent → child, Person 1 is the parent and Person 2 is the child. For spouses/partners, order does not matter.</p></div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="personAId" className="block text-sm font-medium">Person 1</label><select id="personAId" name="personAId" defaultValue={relationship.person_a_id} className="mt-2 w-full rounded border px-3 py-2">{people.map((person) => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></div>
          <div><label htmlFor="personBId" className="block text-sm font-medium">Person 2</label><select id="personBId" name="personBId" defaultValue={relationship.person_b_id} className="mt-2 w-full rounded border px-3 py-2">{people.map((person) => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></div>
        </div>

        <div><label htmlFor="parentChildSubtype" className="block text-sm font-medium">Parent-child type</label><select id="parentChildSubtype" name="parentChildSubtype" defaultValue={relationship.parent_child_subtype ?? "unspecified"} className="mt-2 w-full rounded border px-3 py-2"><option value="unspecified">Unspecified</option><option value="biological">Biological</option><option value="adoptive">Adoptive</option><option value="step">Step</option><option value="foster">Foster</option><option value="guardian">Guardian</option></select><p className="mt-2 text-xs text-gray-500">Used only for Parent → child relationships.</p></div>
        <div><label htmlFor="partnerStatus" className="block text-sm font-medium">Spouse / partner status</label><select id="partnerStatus" name="partnerStatus" defaultValue={relationship.partner_status ?? "partner"} className="mt-2 w-full rounded border px-3 py-2"><option value="partner">Partner</option><option value="married">Married</option><option value="separated">Separated</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option><option value="ended">Ended</option></select><p className="mt-2 text-xs text-gray-500">Used only for Spouse / partner relationships.</p></div>
        <div><label htmlFor="notes" className="block text-sm font-medium">Notes</label><textarea id="notes" name="notes" rows={4} defaultValue={relationship.notes ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>

        <div className="flex flex-wrap gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Save relationship</button><Link href={`/families/${familyId}/people/${returnPersonId}`} className="rounded border px-4 py-2">Cancel</Link></div>
      </form>

      <section className="mt-10 rounded-xl border border-red-200 p-5">
        <h2 className="font-semibold text-red-800">Delete relationship</h2>
        <p className="mt-2 text-sm text-gray-600">This removes only the relationship. Neither person will be deleted.</p>
        <div className="mt-4"><ConfirmDeleteButton action={deleteRelationship} fields={{ familyId, relationshipId, returnPersonId }} confirmMessage={`Delete this relationship between ${personById.get(relationship.person_a_id) ?? "Person 1"} and ${personById.get(relationship.person_b_id) ?? "Person 2"}? The people themselves will remain.`} label="Delete relationship" /></div>
      </section>
    </main>
  );
}
