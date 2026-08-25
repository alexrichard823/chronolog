import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPerson } from "../actions";
import DateFields from "./date-fields";

type NewPersonPageProps = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function NewPersonPage({ params, searchParams }: NewPersonPageProps) {
  const { familyId } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: family, error } = await supabase
    .from("families")
    .select("id, name")
    .eq("id", familyId)
    .maybeSingle();

  if (error || !family) {
    notFound();
  }

  const errorMessage =
    errorCode === "missing-name"
      ? "Enter a name for this person."
      : errorCode === "invalid-date"
        ? "Check the birth and death date information and try again."
        : errorCode === "create-failed"
          ? "We could not add this person. Check your access and try again."
          : null;

  return (
    <main className="mx-auto w-full max-w-xl p-8">
      <Link href={`/families/${familyId}/people`} className="text-sm underline">
        Back to {family.name} people
      </Link>

      <h1 className="mt-6 text-3xl font-semibold">Add Person</h1>
      <p className="mt-2 text-gray-600">
        Add someone to {family.name}. A name is the only required information; dates can be exact,
        year-only, approximate, or unknown.
      </p>

      {errorMessage && (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <form action={createPerson} className="mt-8 space-y-6">
        <input type="hidden" name="familyId" value={familyId} />

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            maxLength={200}
            autoComplete="off"
            className="mt-2 w-full rounded border px-3 py-2"
            placeholder="e.g. Joseph Richard"
          />
        </div>

        <DateFields prefix="birth" label="Birth date" />
        <DateFields prefix="death" label="Death date" />

        <div className="flex gap-3">
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Add person
          </button>
          <Link href={`/families/${familyId}/people`} className="rounded border px-4 py-2">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
