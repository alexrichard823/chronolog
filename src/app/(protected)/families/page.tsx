import Link from "next/link";
import { logout } from "@/lib/auth/actions";

type FamiliesSearchParams = Promise<{ message?: string }>;

export default async function FamiliesPage({
  searchParams,
}: PageProps<"/families"> & { searchParams: FamiliesSearchParams }) {
  const { message } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <Link href="/families" className="text-2xl font-semibold text-stone-950">
            Chronolog
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Sign out
            </button>
          </form>
        </header>

        {message ? (
          <p role="status" className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wider text-stone-500">My families</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            Your family archives will live here
          </h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            You are securely signed in. Creating and joining private family spaces is the next step in the Chronolog MVP.
          </p>
        </section>
      </div>
    </main>
  );
}
