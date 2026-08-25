import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PersonProfilePageProps = {
  params: Promise<{ familyId: string; personId: string }>;
  searchParams: Promise<{ relationshipCreated?: string }>;
};

type RelatedPerson = {
  id: string;
  display_name: string;
};

type Relationship = {
  id: string;
  relationship_type: "parent_child" | "spouse_partner";
  person_a_id: string;
  person_b_id: string;
  parent_child_subtype: string | null;
  partner_status: string | null;
};

function readableLabel(value: string | null) {
  if (!value || value === "unspecified") return null;
  return value.replaceAll("_", " ");
}

export default async function PersonProfilePage({ params, searchParams }: PersonProfilePageProps) {
  const { familyId, personId } = await params;
  const { relationshipCreated } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [familyResult, personResult, relationshipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase
      .from("people")
      .select(
        "id, family_id, display_name, first_name, middle_name, last_name, maiden_name, nickname, life_status, biography, notes, profile_photo_path, birth_date_display, death_date_display"
      )
      .eq("id", personId)
      .eq("family_id", familyId)
      .maybeSingle(),
    supabase
      .from("relationships")
      .select(
        "id, relationship_type, person_a_id, person_b_id, parent_child_subtype, partner_status"
      )
      .eq("family_id", familyId)
      .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`),
  ]);

  const family = familyResult.data;
  const person = personResult.data;

  if (familyResult.error || !family || personResult.error || !person) {
    notFound();
  }

  const relationships = (relationshipResult.data ?? []) as Relationship[];
  const relatedIds = Array.from(
    new Set(
      relationships.map((relationship) =>
        relationship.person_a_id === personId
          ? relationship.person_b_id
          : relationship.person_a_id
      )
    )
  );

  let relatedPeople: RelatedPerson[] = [];
  let relatedPeopleError = false;

  if (relatedIds.length > 0) {
    const result = await supabase
      .from("people")
      .select("id, display_name")
      .eq("family_id", familyId)
      .in("id", relatedIds);

    relatedPeople = (result.data ?? []) as RelatedPerson[];
    relatedPeopleError = Boolean(result.error);
  }

  const personById = new Map(relatedPeople.map((relatedPerson) => [relatedPerson.id, relatedPerson]));

  const parents = relationships
    .filter(
      (relationship) =>
        relationship.relationship_type === "parent_child" && relationship.person_b_id === personId
    )
    .map((relationship) => ({ relationship, person: personById.get(relationship.person_a_id) }))
    .filter((item): item is { relationship: Relationship; person: RelatedPerson } => Boolean(item.person));

  const children = relationships
    .filter(
      (relationship) =>
        relationship.relationship_type === "parent_child" && relationship.person_a_id === personId
    )
    .map((relationship) => ({ relationship, person: personById.get(relationship.person_b_id) }))
    .filter((item): item is { relationship: Relationship; person: RelatedPerson } => Boolean(item.person));

  const partners = relationships
    .filter((relationship) => relationship.relationship_type === "spouse_partner")
    .map((relationship) => {
      const partnerId =
        relationship.person_a_id === personId
          ? relationship.person_b_id
          : relationship.person_a_id;
      return { relationship, person: personById.get(partnerId) };
    })
    .filter((item): item is { relationship: Relationship; person: RelatedPerson } => Boolean(item.person));

  const componentName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <Link href={`/families/${familyId}/people`} className="text-sm underline">
        Back to {family.name} people
      </Link>

      {relationshipCreated === "1" && (
        <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Relationship added successfully.
        </p>
      )}

      <section className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-6">
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

          <Link
            href={`/families/${familyId}/people/${personId}/relationships/new`}
            className="shrink-0 rounded bg-black px-4 py-2 text-white"
          >
            Add Relationship
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Relationships</h2>

        {relationshipResult.error || relatedPeopleError ? (
          <p className="mt-4 text-sm text-red-700">We could not load relationships right now.</p>
        ) : relationships.length === 0 ? (
          <div className="mt-4">
            <p className="text-gray-600">No immediate relationships have been added yet.</p>
            <Link
              href={`/families/${familyId}/people/${personId}/relationships/new`}
              className="mt-4 inline-block text-sm font-medium underline"
            >
              Add the first relationship
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-medium">Parents</h3>
              {parents.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {parents.map(({ relationship, person: parent }) => (
                    <li key={relationship.id}>
                      <Link
                        href={`/families/${familyId}/people/${parent.id}`}
                        className="font-medium underline"
                      >
                        {parent.display_name}
                      </Link>
                      {readableLabel(relationship.parent_child_subtype) && (
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {readableLabel(relationship.parent_child_subtype)} parent
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">None added</p>
              )}
            </div>

            <div>
              <h3 className="font-medium">Spouses / Partners</h3>
              {partners.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {partners.map(({ relationship, person: partner }) => (
                    <li key={relationship.id}>
                      <Link
                        href={`/families/${familyId}/people/${partner.id}`}
                        className="font-medium underline"
                      >
                        {partner.display_name}
                      </Link>
                      {readableLabel(relationship.partner_status) && (
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {readableLabel(relationship.partner_status)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">None added</p>
              )}
            </div>

            <div>
              <h3 className="font-medium">Children</h3>
              {children.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {children.map(({ relationship, person: child }) => (
                    <li key={relationship.id}>
                      <Link
                        href={`/families/${familyId}/people/${child.id}`}
                        className="font-medium underline"
                      >
                        {child.display_name}
                      </Link>
                      {readableLabel(relationship.parent_child_subtype) && (
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {readableLabel(relationship.parent_child_subtype)} child
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">None added</p>
              )}
            </div>
          </div>
        )}
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
