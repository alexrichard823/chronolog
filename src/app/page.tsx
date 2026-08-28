import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-50 p-6 text-gray-950">
      <div className="flex flex-1 items-center justify-center">
        <section className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Chronolog</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Preserve your family story.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-600">
            Build a private family archive that connects people, relationships, events, stories, media, timelines, and your family tree.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="rounded bg-black px-5 py-3 font-medium text-white">
              Create account
            </Link>
            <Link href="/login" className="rounded border border-gray-300 px-5 py-3 font-medium">
              Log in
            </Link>
          </div>
        </section>
      </div>

      <footer className="mx-auto flex w-full max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 py-4 text-sm text-gray-600">
        <Link href="/privacy" className="hover:text-gray-950">Privacy</Link>
        <Link href="/terms" className="hover:text-gray-950">Terms</Link>
        <span>© {new Date().getFullYear()} Chronolog</span>
      </footer>
    </main>
  );
}
