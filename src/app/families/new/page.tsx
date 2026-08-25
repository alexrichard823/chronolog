import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createFamily } from "../actions";

type NewFamilyPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewFamilyPage({ searchParams }: NewFamilyPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl p-8">
      <Link href="/families" className="text-sm underline">
        Back to your families
      </Link>

      <h1 className="mt-6 text-3xl font-semibold">Create a family</h1>
      <p className="mt-2 text-gray-600">
        Give your private family archive a name. You will become its Owner.
      </p>

      <form action={createFamily} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="mb-1 block font-medium">
            Family name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            className="w-full rounded border px-3 py-2"
            placeholder="Richard Family"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block font-medium">
            Description <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full rounded border px-3 py-2"
            placeholder="Stories, photos, and history from our family."
          />
        </div>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" className="rounded bg-black px-5 py-2 text-white">
          Create family
        </button>
      </form>
    </main>
  );
}
