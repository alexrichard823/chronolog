import { MorettiTreePrototype } from "./moretti-tree";

export default function TreePrototypePage() {
  return (
    <main className="mx-auto w-full max-w-7xl p-8">
      <section className="rounded-xl border p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">TR-01 technical spike</p>
        <h1 className="mt-1 text-3xl font-semibold">Moretti family tree prototype</h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          Fictional test data only. This prototype checks whether the candidate renderer keeps spouses together and routes children from the correct parent union across four generations.
        </p>
        <p className="mt-2 text-sm text-gray-500">Drag the tree to pan. Zoom, focal-person switching, profile navigation, and production Supabase data belong to TR-02.</p>
      </section>

      <section className="mt-6">
        <MorettiTreePrototype />
      </section>
    </main>
  );
}
