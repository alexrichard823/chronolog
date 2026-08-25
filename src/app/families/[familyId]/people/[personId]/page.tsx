import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PersonProfilePageProps = {
  params: Promise<{ familyId: string; personId: string }>;
};

export default async function PersonProfilePage({ params }: PersonProfilePageProps) {
  const { familyId, personId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: family, error: familyError }, { data: person, error: personError }] =
    await Promise.all([
      supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
      supabase
        .from("people")
        .select(
          "id, family_id, display_name, first_name, middle_name, last_name, maiden_name, nickname, life_status, biography, notes, profile_photo_path, birth_date_display, death_date_display"
        )
        .eq("id", personId)
        .eq("family_id", familyId)
        .maybeSingle(),
    ]);

  if (familyError || !family || personError || !person) {
    notFound();
  }

  const componentName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href={`/families/${familyId}/people`} className="text-sm underline">
        Back to {family.name} people
      </Link>

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-100 text-3xl font-semibold text-gray-500">
            {person.display_name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Person profile
            </p>
            <h1 className="mt-1 text-3xl font-semibold">{person.display_name}</h1>

            {componentName && componentName !== person.display_name && (
              <p className="mt-2 text-gray-600">{componentName}</p>
            )}

            {person.nickname && (
              <p className="mt-1 text-gray-600">Nickname: {person.nickname}</p>
            )}

            <p className="mt-3 text-sm capitalize text-gray-600">
              {person.life_status === "unknown" ? "Life status unknown" : person.life_status}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Life information</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Birth</dt>
              <dd className="mt-1">{person.birth_date_display || "Unknown"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Death</dt>
              <dd className="mt-1">{person.death_date_display || "Unknown"}</dd>
            </div>
            {person.maiden_name && (
              <div>
                <dt className="font-medium text-gray-500">Maiden name</dt>
                <dd className="mt-1">{person.maiden_name}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Biography</h2>
          <p className="mt-4 whitespace-pre-wrap text-gray-700">
            {person.biography || "No biography has been added yet."}
          </p>
        </div>
      </section>

      {person.notes && (
        <section className="mt-6 rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="mt-4 whitespace-pre-wrap text-gray-700">{person.notes}</p>
        </section>
      )}
    </main>
  );
}
