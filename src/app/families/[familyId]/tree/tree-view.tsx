"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FamilyTree, type FamilyCardProps } from "@memoir/tree";
import type { ChronologTreePerson } from "@/lib/family-tree";
import { buildChronologFamilyGraph, type TreePersonRecord, type TreeRelationshipRecord } from "@/lib/family-tree";

type Props = {
  familyId: string;
  familyName: string;
  people: TreePersonRecord[];
  relationships: TreeRelationshipRecord[];
  subjectId: string;
};

function PersonCard({ person, relation, selected, ...rootProps }: FamilyCardProps<ChronologTreePerson>) {
  const initials = person.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <article
      {...rootProps}
      className={`min-w-44 cursor-pointer rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-500 ${selected ? "border-black ring-2 ring-black/10" : "border-gray-300"}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-950">{person.display_name}</p>
          <p className="mt-0.5 text-xs text-gray-500">{person.lifeDates}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] capitalize tracking-wide text-gray-400">{relation.label.replaceAll("-", " ")}</p>
    </article>
  );
}

export function TreeView({ familyId, familyName, people, relationships, subjectId }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(subjectId);
  const [zoom, setZoom] = useState(1);

  const graph = useMemo(
    () => buildChronologFamilyGraph({ people, relationships, subjectId }),
    [people, relationships, subjectId],
  );
  const selectedPerson = graph.people[selectedId] ?? graph.people[subjectId];

  function changeZoom(next: number) {
    setZoom(Math.min(1.4, Math.max(0.65, Number(next.toFixed(2)))));
  }

  function centerOn(personId: string) {
    setSelectedId(personId);
    router.replace(`/families/${familyId}/tree?person=${personId}`, { scroll: false });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">Drag to pan. Click a person for a preview.</p>
          <div className="flex items-center gap-2" aria-label="Tree zoom controls">
            <button type="button" onClick={() => changeZoom(zoom - 0.1)} className="rounded border px-3 py-1.5 text-sm" aria-label="Zoom out">−</button>
            <button type="button" onClick={() => setZoom(1)} className="rounded border px-3 py-1.5 text-sm">{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={() => changeZoom(zoom + 0.1)} className="rounded border px-3 py-1.5 text-sm" aria-label="Zoom in">+</button>
          </div>
        </div>

        <div className="h-[72vh] min-h-[520px] overflow-hidden rounded-xl border bg-gray-50">
          <div
            className="h-full origin-center"
            style={{
              transform: `scale(${zoom})`,
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transformOrigin: "center center",
            }}
          >
            <FamilyTree
              graph={graph}
              card={PersonCard}
              interactionMode="pan-page-scroll"
              initialViewport="subject"
              layoutMode="compact-family"
              limits={{ ancestorGenerations: 3, descendantGenerations: 2, lateralFamilyGenerations: 1, partners: null }}
              spacing={{ row: 112, column: 36, padding: 48 }}
              selected={selectedId}
              onPersonClick={(_, personId) => setSelectedId(personId)}
              ariaLabel={`${familyName} family tree`}
            />
          </div>
        </div>
      </section>

      <aside className="h-fit rounded-xl border bg-white p-5 xl:sticky xl:top-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Person preview</p>
        {selectedPerson ? (
          <>
            <h2 className="mt-2 text-xl font-semibold">{selectedPerson.display_name}</h2>
            <p className="mt-1 text-sm text-gray-500">{selectedPerson.lifeDates}</p>
            <div className="mt-5 flex flex-col gap-2">
              {selectedId !== subjectId && (
                <button type="button" onClick={() => centerOn(selectedId)} className="rounded bg-black px-4 py-2 text-sm text-white">
                  Center tree here
                </button>
              )}
              <Link href={`/families/${familyId}/people/${selectedPerson.id}`} className="rounded border px-4 py-2 text-center text-sm">
                Open full profile
              </Link>
              <Link href={`/families/${familyId}/timeline?person=${selectedPerson.id}`} className="rounded border px-4 py-2 text-center text-sm">
                View timeline
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500">Select a person in the tree.</p>
        )}
      </aside>
    </div>
  );
}
