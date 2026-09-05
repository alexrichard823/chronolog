import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { permanentlyDeleteFamily, restoreFamily } from "../actions";

type DeletedFamily = {
  family_id: string;
  family_name: string;
  requested_at: string;
  recover_until: string;
};

type Props = {
  searchParams: Promise<{
    scheduled?: string;
    permanentlyDeleted?: string;
    warning?: string;
    error?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function DeletedFamiliesPage({ searchParams }: Props) {
  const { scheduled, permanentlyDeleted, warning, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("list_deleted_family_archives");
  const deletedFamilies = (data ?? []) as DeletedFamily[];

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <Link href="/families" className="text-sm underline">Back to your families</Link>
      <h1 className="mt-6 text-3xl font-semibold">Recently Deleted</h1>
      <p className="mt-2 text-gray-600">Only archives you owned appear here. Restore within 30 days, or permanently delete one now.</p>

      {scheduled === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Archive moved to Recently Deleted. Access was removed for every member.</p>}
      {permanentlyDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Archive permanently deleted.</p>}
      {warning === "media-cleanup" && <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The archive records were deleted, but one or more private media files could not be cleaned up automatically. They remain inaccessible in Chronolog.</p>}
      {errorCode === "restore-failed" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">We could not restore that archive. Its recovery window may have ended.</p>}
      {errorCode === "permanent-confirmation" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Nothing was permanently deleted. Type the exact archive name and confirm the warning.</p>}

      {error ? (
        <p className="mt-8 rounded border border-red-200 bg-red-50 p-4 text-red-700">We could not load recently deleted archives.</p>
      ) : deletedFamilies.length ? (
        <div className="mt-8 space-y-5">
          {deletedFamilies.map((family) => (
            <section key={family.family_id} className="rounded-xl border p-5">
              <h2 className="text-xl font-semibold">{family.family_name}</h2>
              <p className="mt-2 text-sm text-gray-600">Deleted {formatDate(family.requested_at)} · Restore through {formatDate(family.recover_until)}</p>
              <form action={restoreFamily} className="mt-5">
                <input type="hidden" name="familyId" value={family.family_id} />
                <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">Restore archive</button>
              </form>

              <details className="mt-5 border-t pt-4">
                <summary className="cursor-pointer text-sm font-medium text-red-700">Permanently delete now</summary>
                <form action={permanentlyDeleteFamily} className="mt-4 space-y-3">
                  <input type="hidden" name="familyId" value={family.family_id} />
                  <div>
                    <label htmlFor={`confirmation-${family.family_id}`} className="block text-sm">Type <span className="font-semibold">{family.family_name}</span> to confirm</label>
                    <input id={`confirmation-${family.family_id}`} name="confirmationName" required autoComplete="off" className="mt-2 w-full rounded border px-3 py-2" />
                  </div>
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="acknowledgePermanent" required className="mt-1" />
                    <span>I understand permanent deletion removes all archive records and private media and cannot be undone.</span>
                  </label>
                  <button type="submit" className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50">Permanently delete archive</button>
                </form>
              </details>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">No recently deleted archives</h2>
          <p className="mt-2 text-gray-600">Archives moved here remain recoverable for 30 days.</p>
        </div>
      )}
    </main>
  );
}
