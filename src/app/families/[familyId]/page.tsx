import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type FamilyDashboardPageProps = {
  params: Promise<{ familyId: string }>;
};

export default async function FamilyDashboardPage({ params }: FamilyDashboardPageProps) {
  const { familyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: family, error } = await supabase
    .from("families")
    .select("id, name, description")
    .eq("id", familyId)
    .maybeSingle();

  if (error || !family) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href="/families" className="text-sm underline">
        Back to your families
      </Link>

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Family archive
            </p>
            <h1 className="mt-1 text-3xl font-semibold">{family.name}</h1>
            {family.description && (
              <p className="mt-3 max-w-2xl text-gray-600">{family.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/families/${familyId}/people`}
              className="rounded border px-4 py-2"
            >
              View People
            </Link>
            <Link
              href={`/families/${familyId}/people/new`}
              className="rounded bg-black px-4 py-2 text-white"
            >
              Add Person
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-dashed p-8 text-center">
        <h2 className="text-xl font-semibold">Your family dashboard is ready</h2>
        <p className="mt-2 text-gray-600">
          People are available now. Stories, events, media, timeline, and tree views will appear here as those features are built.
        </p>
      </section>
    </main>
  );
}
