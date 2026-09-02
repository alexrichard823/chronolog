import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TreePersonRecord, TreeRelationshipRecord } from "@/lib/family-tree";
import { TreeView } from "./tree-view";

type Props = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ person?: string }>;
};

export default async function FamilyTreePage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const { person: requestedPersonId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [familyResult, peopleResult, relationshipsResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase
      .from("people")
      .select("id, display_name, birth_date_display, death_date_display, created_at")
      .eq("family_id", familyId)
      .order("created_at", { ascending: true }),
    supabase
      .from("relationships")
      .select("id, relationship_type, person_a_id, person_b_id, parent_child_subtype, partner_status")
      .eq("family_id", familyId),
  ]);

  if (familyResult.error || !familyResult.data) notFound();

  if (peopleResult.error || relationshipsResult.error) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6 sm:p-8">
        <Link href={`/families/${familyId}`} className="text-sm underline">Back to family</Link>
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          We could not load the family tree right now.
        </p>
      </main>
    );
  }

  const people = (peopleResult.data ?? []).map((person) => ({
    id: person.id,
    display_name: person.display_name,
    birth_date_display: person.birth_date_display,
    death_date_display: person.death_date_display,
  })) as TreePersonRecord[];
  const relationships = (relationshipsResult.data ?? []) as TreeRelationshipRecord[];

  if (!people.length) {
    return (
      <main className="mx-auto w-full max-w-4xl p-8">
        <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>
        <section className="mt-6 rounded-xl border p-8 text-center">
          <h1 className="text-2xl font-semibold">Family tree</h1>
          <p className="mt-3 text-gray-600">Add the first person before building the tree.</p>
          <Link href={`/families/${familyId}/people/new`} className="mt-5 inline-block rounded bg-black px-4 py-2 text-white">Add Person</Link>
        </section>
      </main>
    );
  }

  const subjectId = people.some((person) => person.id === requestedPersonId)
    ? requestedPersonId!
    : people[0].id;

  return (
    <main className="mx-auto w-full max-w-7xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>
          <h1 className="mt-4 text-3xl font-semibold">Family tree</h1>
          <p className="mt-2 text-gray-600">Explore parent-child and spouse or partner relationships around a focal person.</p>
        </div>
        <Link href={`/families/${familyId}/people/${subjectId}/relationships/new`} className="rounded bg-black px-4 py-2 text-sm text-white">Add Relationship</Link>
      </div>

      <div className="mt-6">
        <TreeView
          key={subjectId}
          familyId={familyId}
          familyName={familyResult.data.name}
          people={people}
          relationships={relationships}
          subjectId={subjectId}
        />
      </div>
    </main>
  );
}
