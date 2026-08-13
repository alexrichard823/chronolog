import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-1 items-center bg-stone-100 px-6 py-16">
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-lg font-semibold text-stone-900">Chronolog</p>
        <div className="mt-20 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Private family history
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-stone-950 sm:text-6xl">
            Preserve the stories behind your family history.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Keep memories, relationships, and family records together in one private place built for generations.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="rounded-lg bg-stone-900 px-5 py-3 text-center font-medium text-white hover:bg-stone-700">
              Create an account
            </Link>
            <Link href="/login" className="rounded-lg border border-stone-300 bg-white px-5 py-3 text-center font-medium text-stone-900 hover:bg-stone-50">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
