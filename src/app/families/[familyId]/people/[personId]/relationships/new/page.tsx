import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RelationshipForm from "./relationship-form";

type AddRelationshipPageProps = {
  params: Promise<{ familyId: string; personId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AddRelationshipPage({
  params,
  searchParams,
}: AddRelationshipPageProps) {
  const { familyId, personId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [familyResult, focalResult, peopleResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase
      .from("people")
      .select("id, display_name")
      .eq("id", personId)
      .eq("family_id", familyId)
      .maybeSingle(),
    supabase
      .from("people")
      .select("id, display_name")
      .eq("family_id", familyId)
      .neq("id", personId)
      .order("display_name", { ascending: true }),
  ]);

  if (familyResult.error || !familyResult.data || focalResult.error || !focalResult.data) {
    notFound();
  }

  const errorMessage =
    errorCode === "missing-fields"
      ? "Choose a relationship type and try again."
      : errorCode === "missing-relative"
        ? "Choose an existing person or enter a new person name."
        : errorCode === "existing-person"
          ? "A person with that name already exists in this family. Choose Existing person and connect that record instead of creating another one."
          : errorCode === "duplicate"
            ? "That direct relationship already exists."
            : errorCode === "cycle"
              ? "That parent-child relationship would create a circular family line, so it was not added."
              : errorCode === "invalid-link"
                ? "That relationship is not valid. A person cannot be directly related to themselves."
                : errorCode === "create-failed"
                  ? "We could not add that relationship. Check the information and try again."
                  : null;

  return (
    <main className="mx-auto w-full max-w-xl p-8">
      <Link href={`/families/${familyId}/people/${personId}`} className="text-sm underline">
        Back to {focalResult.data.display_name}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold">Add Relationship</h1>
      <p className="mt-2 text-gray-600">
        Connect an existing person in {familyResult.data.name}, or create a new relative while making the connection.
      </p>

      {errorMessage && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {peopleResult.error ? (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          We could not load this family&apos;s people.
        </p>
      ) : (
        <RelationshipForm
          familyId={familyId}
          focalPersonId={personId}
          focalPersonName={focalResult.data.display_name}
          people={peopleResult.data ?? []}
        />
      )}
    </main>
  );
}
