import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PeoplePageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ personCreated?: string }>;
};

export default async function PeoplePage({ params, searchParams }: PeoplePageProps) {
  const { familyId } = await params;
  const { personCreated } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: family, error: familyError }, { data: people, error: peopleError }] =
    await Promise.all([
      supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
      supabase
        .from("people")
        .select("id, display_name, life_status, birth_date_display, death_date_display, created_at")
        .eq("family_id", familyId)
        .order("display_name", { ascending: true }),
    ]);

  if (familyError || !family) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href={`/families/${familyId}`} className="text-sm underline">
        Back to {family.name}
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">People</h1>
          <p className="mt-2 text-gray-600">Everyone documented in {family.name}.</p>
        </div>
        <Link
          href={`/families/${familyId}/people/new`}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Add Person
        </Link>
      </div>

      {personCreated === "1" && (
        <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Person added successfully.
        </p>
      )}

      {peopleError ? (
        <p className="mt-8 rounded border border-red-200 bg-red-50 p-4 text-red-700">
          We could not load this family&apos;s people. Please try again.
        </p>
      ) : people && people.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {people.map((person) => (
            <Link
              key={person.id}
              href={`/families/${familyId}/people/${person.id}`}
              className="block rounded-lg border p-5 transition hover:bg-gray-50"
            >
              <h2 className="text-xl font-semibold">{person.display_name}</h2>
              <p className="mt-2 text-sm capitalize text-gray-600">
                {person.life_status === "unknown" ? "Life status unknown" : person.life_status}
              </p>
              <p className="mt-4 text-sm font-medium">Open profile</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">No people yet</h2>
          <p className="mt-2 text-gray-600">Add the first person to start building this family history.</p>
          <Link
            href={`/families/${familyId}/people/new`}
            className="mt-5 inline-block rounded bg-black px-4 py-2 text-white"
          >
            Add Person
          </Link>
        </div>
      )}
    </main>
  );
}
