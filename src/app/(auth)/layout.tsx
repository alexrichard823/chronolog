import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-stone-100 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-2xl font-semibold tracking-tight text-stone-900"
        >
          Chronolog
        </Link>
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
