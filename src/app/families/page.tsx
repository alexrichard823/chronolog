import Link from "next/link";
import LogoutButton from "./logout-button";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ familyDeleted?: string; leftFamily?: string; warning?: string; error?: string }>;
};

export default async function FamiliesPage({ searchParams }: Props) {
  const { familyDeleted, leftFamily, warning, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: families, error } = await supabase
    .from("families")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-3xl font-semibold">Your Families</h1><p className="mt-2 text-gray-600">Private family archives you belong to.</p></div>
        <Link href="/families/new" className="rounded bg-black px-4 py-2 text-white">Create family</Link>
      </div>

      {familyDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Family archive deleted successfully.</p>}
      {leftFamily === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">You left the family and no longer have access to it.</p>}
      {warning === "media-cleanup" && <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The archive records were deleted, but one or more private media files could not be cleaned up automatically. They are no longer visible in Chronolog.</p>}
      {errorCode === "delete-failed" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">We could not delete that family archive.</p>}

      {error ? (
        <p className="mt-8 rounded border border-red-200 bg-red-50 p-4 text-red-700">We could not load your families. Please refresh and try again.</p>
      ) : families && families.length > 0 ? (
        <div className="mt-8 grid gap-4">
          {families.map((family) => (
            <Link key={family.id} href={`/families/${family.id}`} className="block rounded-lg border p-5 transition hover:bg-gray-50">
              <h2 className="text-xl font-semibold">{family.name}</h2>
              {family.description && <p className="mt-2 text-gray-600">{family.description}</p>}
              <p className="mt-4 text-sm font-medium">Open family</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">Create your first family archive</h2>
          <p className="mt-2 text-gray-600">Start by naming your family. You can add people, stories, events, and media next.</p>
          <Link href="/families/new" className="mt-5 inline-block rounded bg-black px-4 py-2 text-white">Create family</Link>
        </div>
      )}

      <div className="mt-10 border-t pt-6"><p className="text-sm text-gray-600">Signed in as {user.email}</p><LogoutButton /></div>
    </main>
  );
}
