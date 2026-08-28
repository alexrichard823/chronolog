"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12 text-gray-950">
      <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Chronolog</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-gray-600">
          Your family archive has not been intentionally changed by this error. Try the action again, or return to your families.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => reset()} className="rounded bg-black px-5 py-3 font-medium text-white">
            Try again
          </button>
          <a href="/families" className="rounded border border-gray-300 px-5 py-3 font-medium">
            Back to families
          </a>
        </div>
      </section>
    </main>
  );
}
