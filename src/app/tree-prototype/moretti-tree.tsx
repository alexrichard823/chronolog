"use client";

import { FamilyTree, type FamilyCardProps, type FamilyGraph } from "@memoir/tree";

type PrototypePerson = {
  id: string;
  name: string;
  lifeDates: string;
};

const people: Record<string, PrototypePerson> = {
  P001: { id: "P001", name: "Antonio Moretti", lifeDates: "1907–1988" },
  P002: { id: "P002", name: "Rosa Bellini Moretti", lifeDates: "c. 1910–1996" },
  P003: { id: "P003", name: "Vincent Moretti", lifeDates: "1935–2011" },
  P004: { id: "P004", name: "Lucia Moretti Romano", lifeDates: "1938–" },
  P005: { id: "P005", name: "Margaret Hayes Moretti", lifeDates: "1937–2018" },
  P006: { id: "P006", name: "Thomas Moretti", lifeDates: "1963–" },
  P007: { id: "P007", name: "Anna Moretti Chen", lifeDates: "1967–" },
  P008: { id: "P008", name: "David Chen", lifeDates: "1965–" },
  P009: { id: "P009", name: "Emma Chen", lifeDates: "1996–" },
};

const graph: FamilyGraph<PrototypePerson> = {
  people,
  subject: "P001",
  partnershipGroups: [
    { id: "P001-P002", partners: ["P001", "P002"], relation: "spouse", order: 1 },
    { id: "P003-P005", partners: ["P003", "P005"], relation: "spouse", order: 1 },
    { id: "P007-P008", partners: ["P007", "P008"], relation: "spouse", order: 1 },
  ],
  parentChildLinks: [
    { id: "P001-P003", groupId: "P001-P002", parentId: "P001", childId: "P003", relation: "biological" },
    { id: "P002-P003", groupId: "P001-P002", parentId: "P002", childId: "P003", relation: "biological" },
    { id: "P001-P004", groupId: "P001-P002", parentId: "P001", childId: "P004", relation: "biological" },
    { id: "P002-P004", groupId: "P001-P002", parentId: "P002", childId: "P004", relation: "biological" },
    { id: "P003-P006", groupId: "P003-P005", parentId: "P003", childId: "P006", relation: "biological" },
    { id: "P005-P006", groupId: "P003-P005", parentId: "P005", childId: "P006", relation: "biological" },
    { id: "P003-P007", groupId: "P003-P005", parentId: "P003", childId: "P007", relation: "biological" },
    { id: "P005-P007", groupId: "P003-P005", parentId: "P005", childId: "P007", relation: "biological" },
    { id: "P007-P009", groupId: "P007-P008", parentId: "P007", childId: "P009", relation: "biological" },
    { id: "P008-P009", groupId: "P007-P008", parentId: "P008", childId: "P009", relation: "biological" },
  ],
};

function MorettiCard({ person, relation, ...rootProps }: FamilyCardProps<PrototypePerson>) {
  return (
    <article
      {...rootProps}
      className="min-w-44 rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-sm"
    >
      <p className="font-semibold text-gray-950">{person.name}</p>
      <p className="mt-1 text-xs text-gray-500">{person.lifeDates}</p>
      <p className="mt-2 text-[11px] capitalize tracking-wide text-gray-400">{relation.label}</p>
    </article>
  );
}

export function MorettiTreePrototype() {
  return (
    <div className="h-[720px] overflow-hidden rounded-xl border bg-gray-50">
      <FamilyTree
        graph={graph}
        card={MorettiCard}
        interactionMode="pan"
        layoutMode="compact-family"
        limits={{ ancestorGenerations: 0, descendantGenerations: 3, partners: null }}
        spacing={{ row: 112, column: 36, padding: 32 }}
      />
    </div>
  );
}
