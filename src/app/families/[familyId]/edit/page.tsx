import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scheduleFamilyDeletion, updateFamily } from "../../actions";

type Props = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditFamilyPage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, membershipResult, peopleCount, relationshipCount, eventCount, storyCount, mediaCount] = await Promise.all([
    supabase.from("families").select("id, name, description").eq("id", familyId).maybeSingle(),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
    supabase.from("people").select("id", { count: "exact", head: true }).eq("family_id", familyId),
    supabase.from("relationships").select("id", { count: "exact", head: true }).eq("family_id", familyId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("family_id", familyId),
    supabase.from("stories").select("id", { count: "exact", head: true }).eq("family_id", familyId),
    supabase.from("media_items").select("id", { count: "exact", head: true }).eq("family_id", familyId),
  ]);

  if (familyResult.error || !familyResult.data) notFound();
  const role = membershipResult.data?.role;
  if (!role || !["owner", "admin"].includes(role)) redirect(`/families/${familyId}?error=no-manage-access`);

  const family = familyResult.data;
  const errorMessage = errorCode === "invalid-name"
    ? "Family name must be between 1 and 120 characters."
    : errorCode === "update-failed"
      ? "We could not update this family archive."
      : errorCode === "delete-failed"
        ? "We could not delete this family archive. Nothing was intentionally removed."
        : errorCode === "deletion-confirmation"
          ? `Deletion was not scheduled. Type the exact family name, “${familyResult.data.name},” and confirm that you understand the recovery process.`
          : errorCode === "deletion-schedule-failed"
            ? "We could not schedule this archive for deletion. Nothing was removed. Please try again or contact support if the problem continues."
        : null;

  const summary = `${peopleCount.count ?? 0} people, ${relationshipCount.count ?? 0} relationships, ${eventCount.count ?? 0} events, ${storyCount.count ?? 0} stories, and ${mediaCount.count ?? 0} media items`;

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <Link href={`/families/${familyId}`} className="text-sm underline">Back to {family.name}</Link>
      <h1 className="mt-6 text-3xl font-semibold">Edit Family Archive</h1>
      <p className="mt-2 text-gray-600">Update the archive name and description.</p>
      {errorMessage && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

      <form action={updateFamily} className="mt-8 space-y-6">
        <input type="hidden" name="familyId" value={familyId} />
        <div><label htmlFor="name" className="block text-sm font-medium">Family name</label><input id="name" name="name" required minLength={1} maxLength={120} defaultValue={family.name} className="mt-2 w-full rounded border px-3 py-2" /></div>
        <div><label htmlFor="description" className="block text-sm font-medium">Description</label><textarea id="description" name="description" rows={5} defaultValue={family.description ?? ""} className="mt-2 w-full rounded border px-3 py-2" /></div>
        <div className="flex gap-3"><button type="submit" className="rounded bg-black px-4 py-2 text-white">Save archive</button><Link href={`/families/${familyId}`} className="rounded border px-4 py-2">Cancel</Link></div>
      </form>

      {role === "owner" && (
        <section className="mt-12 rounded-xl border border-red-200 p-5">
          <h2 className="font-semibold text-red-800">Delete family archive</h2>
          <p className="mt-2 text-sm text-gray-700">Owner-only. This removes access to the archive and all of its records: {summary}. You can restore it from Recently Deleted for 30 days.</p>
          <p className="mt-2 text-sm font-medium text-red-800">Pending invitations will be revoked. Permanent deletion remains a separate action.</p>
          <form action={scheduleFamilyDeletion} className="mt-5 space-y-4">
            <input type="hidden" name="familyId" value={familyId} />
            <div>
              <label htmlFor="confirmationName" className="block text-sm font-medium">Type <span className="font-semibold">{family.name}</span> to confirm</label>
              <input id="confirmationName" name="confirmationName" required autoComplete="off" className="mt-2 w-full rounded border px-3 py-2" />
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" name="acknowledgeRecovery" required className="mt-1" />
              <span>I understand this archive will immediately disappear for every member and can be restored for 30 days.</span>
            </label>
            <button type="submit" className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50">Move to Recently Deleted</button>
          </form>
        </section>
      )}
    </main>
  );
}
