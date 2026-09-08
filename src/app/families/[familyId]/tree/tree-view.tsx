"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { buildFamilyTreeLayout } from "@memoir/tree";
import { Button, ButtonLink, Card, Input, Select } from "@/components/ui";
import { buildChronologFamilyGraph, type ChronologTreePerson, type TreePersonRecord, type TreeRelationshipRecord } from "@/lib/family-tree";
import { MIN_TREE_ZOOM, MAX_TREE_ZOOM } from "@/lib/tree-camera";
import { useTreeCamera } from "./use-tree-camera";

type Props = {
  familyId: string;
  familyName: string;
  people: TreePersonRecord[];
  relationships: TreeRelationshipRecord[];
  subjectId: string;
  canEdit: boolean;
};

const CARD_SIZE = { width: 232, height: 112 };

function Icon({ children }: { children: ReactNode }) {
  return <svg aria-hidden="true" className="ui-icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

function PersonAvatar({ person, large = false }: { person: TreePersonRecord; large?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = person.display_name.trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase();
  return <span className={`tree-avatar${large ? " tree-avatar-large" : ""}`} aria-hidden="true">
    {person.photoUrl && person.photoUrl !== failedUrl ? (
      <Image src={person.photoUrl} alt="" width={large ? 72 : 48} height={large ? 72 : 48} unoptimized draggable={false} onError={() => setFailedUrl(person.photoUrl ?? null)} />
    ) : initials || "?"}
  </span>;
}

function relationshipDetails(personId: string, people: Record<string, ChronologTreePerson>, relationships: TreeRelationshipRecord[]) {
  return relationships.flatMap((link) => {
    if (link.person_a_id !== personId && link.person_b_id !== personId) return [];
    const otherId = link.person_a_id === personId ? link.person_b_id : link.person_a_id;
    const other = people[otherId];
    if (!other) return [];
    const kind = link.relationship_type === "spouse_partner"
      ? "Spouse / partner"
      : link.parent_child_subtype === "guardian"
        ? link.person_b_id === personId ? "Guardian" : "Under their care"
        : link.person_b_id === personId ? "Parent" : "Child";
    const detail = link.relationship_type === "spouse_partner" ? link.partner_status : link.parent_child_subtype;
    return [{ id: link.id, name: other.display_name, kind, detail: detail && detail !== "unspecified" ? detail.replaceAll("_", " ") : null }];
  });
}

function PersonPreview({ person, familyId, subjectId, details, pending, onCenter, onDismiss }: {
  person: ChronologTreePerson; familyId: string; subjectId: string;
  details: ReturnType<typeof relationshipDetails>; pending: boolean;
  onCenter: () => void; onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    function show() {
      if (!dialog) return;
      if (dialog.open) dialog.close();
      if (mobile.matches) dialog.showModal();
      else dialog.show();
    }
    show();
    mobile.addEventListener("change", show);
    return () => { mobile.removeEventListener("change", show); dialog.close(); };
  }, []);
  return <dialog
    ref={dialogRef}
    className="tree-preview ui-card"
    aria-labelledby="tree-preview-name"
    onCancel={(event) => { event.preventDefault(); onDismiss(); }}
    onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onDismiss(); } }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onDismiss();
    }}
  >
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-muted">Person preview</p>
      <Button variant="ghost" aria-label="Close person preview" onClick={onDismiss} autoFocus><Icon><path d="m6 6 12 12M18 6 6 18" /></Icon></Button>
    </div>
    <div className="mt-3 flex items-center gap-4">
      <PersonAvatar person={person} large />
      <div className="min-w-0">
        <h2 id="tree-preview-name" className="text-xl font-semibold wrap-anywhere">{person.display_name}</h2>
        <p className="mt-1 text-sm text-muted wrap-anywhere">{person.lifeDates}</p>
      </div>
    </div>
    <div className="mt-5 grid gap-2">
      <ButtonLink href={`/families/${familyId}/people/${person.id}`}>Open profile</ButtonLink>
      <ButtonLink href={`/families/${familyId}/timeline?person=${person.id}`} variant="secondary">View timeline</ButtonLink>
      <Button variant="ghost" onClick={onCenter} disabled={pending}>{pending ? "Centering…" : subjectId === person.id ? "Recenter on this person" : "Center tree here"}</Button>
    </div>
    {details.length > 0 && <div className="mt-5 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Relationships</h3>
      <ul className="mt-3 space-y-3">{details.map((detail) => <li key={detail.id} className="text-sm">
        <p className="font-medium wrap-anywhere">{detail.name}</p>
        <p className="text-muted">{detail.kind}{detail.detail && <> · <span className="capitalize">{detail.detail}</span></>}</p>
      </li>)}</ul>
    </div>}
  </dialog>;
}

// The key resets person context only when the URL's focal person changes.
export function TreeView(props: Props) {
  const [generations, setGenerations] = useState(2);
  return <TreeExplorer key={props.subjectId} {...props} generations={generations} onGenerationsChange={setGenerations} />;
}

function TreeExplorer({ familyId, familyName, people, relationships, subjectId, canEdit, generations, onGenerationsChange }: Props & {
  generations: number; onGenerationsChange: (value: number) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const previewTrigger = useRef<HTMLElement | null>(null);
  const graph = useMemo(() => buildChronologFamilyGraph({ people, relationships, subjectId }), [people, relationships, subjectId]);
  const layout = useMemo(() => buildFamilyTreeLayout({
    graph, estimatedCardSize: CARD_SIZE, lineShape: "curved", layoutMode: "compact-family", boundsMode: "content",
    spacing: { row: 88, column: 40, padding: 48 },
    limits: { ancestorGenerations: generations, descendantGenerations: generations, lateralFamilyGenerations: 1, parents: null, grandparents: null, siblings: null, halfSiblings: null, partners: null, children: null, grandchildren: null },
  }), [graph, generations]);
  const focalCard = layout.cards.find((card) => card.personId === subjectId)!;
  const subjectPoint = useMemo(() => ({ x: focalCard.x + focalCard.width / 2, y: focalCard.y + focalCard.height / 2 }), [focalCard]);
  const { canvasRef, camera, dragging, center, zoom, handlers } = useTreeCamera(layout.contentBounds, subjectPoint);
  const selectedPerson = previewId ? graph.people[previewId] : null;
  const selectedId = previewId ?? subjectId;
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return people.filter((person) => !term || person.display_name.toLocaleLowerCase().includes(term)).slice(0, 8);
  }, [people, query]);

  function centerOn(personId: string) {
    setSearchOpen(false);
    setQuery("");
    setPreviewId(null);
    if (personId === subjectId) { center(subjectPoint, true); canvasRef.current?.focus({ preventScroll: true }); return; }
    startTransition(() => router.push(`/families/${familyId}/tree?person=${encodeURIComponent(personId)}`, { scroll: false }));
  }

  function dismissPreview() {
    setPreviewId(null);
    previewTrigger.current?.focus({ preventScroll: true });
  }

  const relationshipHref = `/families/${familyId}/people/${selectedId}/relationships/new`;

  return <div className="tree-explorer" aria-busy={pending}>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted wrap-anywhere">{familyName} family</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Family tree</h1>
        <p className="mt-2 text-muted">Your people, connected.</p>
      </div>
      {canEdit && <ButtonLink href={relationshipHref}><Icon><path d="M12 5v14M5 12h14" /></Icon>Add relationship</ButtonLink>}
    </div>

    <Card className="tree-workspace mt-6">
      <div className="tree-toolbar">
        <div className="tree-search" ref={searchRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }}>
          <label htmlFor="tree-search" className="ui-field-label">Find a person</label>
          <form onSubmit={(event) => { event.preventDefault(); if (results[0]) centerOn(results[0].id); }}>
            <div className="relative">
              <span className="tree-search-icon"><Icon><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></Icon></span>
              <Input id="tree-search" type="search" autoComplete="off" placeholder="Search your family" className="pl-10" value={query}
                aria-describedby="tree-search-hint" aria-controls={searchOpen ? "tree-search-results" : undefined}
                onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchOpen(false);
                  if (event.key === "ArrowDown") { event.preventDefault(); document.querySelector<HTMLButtonElement>("#tree-search-results button")?.focus(); }
                }} />
            </div>
          </form>
          <span id="tree-search-hint" className="sr-only">Choose a result to center the tree on that person. Enter chooses the first result.</span>
          {searchOpen && <div id="tree-search-results" className="tree-search-results ui-card" onKeyDown={(event) => { if (event.key === "Escape") { searchRef.current?.querySelector("input")?.focus(); setSearchOpen(false); } }}>
            {results.length ? <ul>{results.map((person) => <li key={person.id}><button type="button" onClick={() => centerOn(person.id)}>
              <span className="font-medium wrap-anywhere">{person.display_name}</span><span className="text-xs text-muted">{graph.people[person.id].lifeDates}</span>
            </button></li>)}</ul> : <p className="p-4 text-sm text-muted" role="status">No people found. Try another name.</p>}
          </div>}
        </div>
        <div className="tree-depth">
          <label htmlFor="tree-generations" className="ui-field-label">Nearby generations</label>
          <Select id="tree-generations" value={generations} onChange={(event) => onGenerationsChange(Number(event.target.value))}>
            <option value={1}>Parents &amp; children</option><option value={2}>2 generations each way</option><option value={3}>3 generations each way</option>
          </Select>
        </div>
        <div className="tree-view-controls">
          <Button variant="secondary" onClick={() => { center(subjectPoint, true); setPreviewId(null); }}><Icon><circle cx="12" cy="12" r="6" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></Icon>Recenter</Button>
          <div className="flex items-center gap-1" role="group" aria-label="Tree zoom">
            <Button variant="ghost" aria-label="Zoom out" disabled={camera.scale <= MIN_TREE_ZOOM} onClick={() => zoom(camera.scale - 0.15)}><Icon><path d="M5 12h14" /></Icon></Button>
            <span className="w-12 text-center text-sm tabular-nums" aria-label="Zoom level">{Math.round(camera.scale * 100)}%</span>
            <Button variant="ghost" aria-label="Zoom in" disabled={camera.scale >= MAX_TREE_ZOOM} onClick={() => zoom(camera.scale + 0.15)}><Icon><path d="M12 5v14M5 12h14" /></Icon></Button>
          </div>
        </div>
      </div>
      <div className="tree-context" aria-live="polite">
        <p className="min-w-0 truncate">Centered on <strong className="font-semibold">{graph.people[subjectId].display_name}</strong></p>
        <p className="shrink-0">{pending ? "Centering…" : `${layout.cards.length} of ${people.length} people shown`}</p>
      </div>
      <div className="tree-stage">
        <div ref={canvasRef} className={`tree-canvas${dragging ? " is-dragging" : ""}`} role="region" aria-label={`${familyName} family tree`} aria-describedby="tree-gesture-help" tabIndex={0} {...handlers}>
          <div className="tree-scene" style={{ width: layout.bounds.width, height: layout.bounds.height, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
            <svg className="tree-connections" aria-hidden="true" width={layout.bounds.width} height={layout.bounds.height}>
              {layout.edges.map((edge) => <path key={edge.id} d={edge.path} data-kind={edge.kind} data-status={edge.status} />)}
            </svg>
            {layout.cards.filter((card) => !card.hiddenCard).map((card) => <button key={card.personId} type="button"
              className="tree-person" data-person-id={card.personId} data-selected={selectedId === card.personId} data-centered={subjectId === card.personId}
              style={{ width: card.width, height: card.height, left: card.x, top: card.y }}
              aria-label={`${card.person.display_name}, ${card.person.lifeDates}${subjectId === card.personId ? ", centered person" : ""}. Open preview`}
              aria-pressed={selectedId === card.personId}
              onFocus={(event) => {
                if (!event.currentTarget.matches(":focus-visible")) return;
                center({ x: card.x + card.width / 2, y: card.y + card.height / 2 });
              }}
              onClick={(event) => { previewTrigger.current = event.currentTarget; setPreviewId(card.personId); }}>
              <PersonAvatar person={card.person} />
              <span className="min-w-0 flex-1 text-left"><span className="tree-person-name">{card.person.display_name}</span><span className="tree-person-dates">{card.person.lifeDates}</span></span>
              {subjectId === card.personId && <span className="tree-center-dot" aria-hidden="true" />}
            </button>)}
          </div>
        </div>
        {selectedPerson && <PersonPreview key={selectedPerson.id} person={selectedPerson} familyId={familyId} subjectId={subjectId} details={relationshipDetails(selectedPerson.id, graph.people, relationships)} pending={pending} onCenter={() => centerOn(selectedPerson.id)} onDismiss={dismissPreview} />}
      </div>
      <div className="tree-footer">
        <p id="tree-gesture-help">Drag to move · Pinch to zoom · Select a person<span className="sr-only">. With the canvas focused, use arrow keys to pan, plus and minus to zoom, and Home to recenter.</span></p>
        <details className="tree-legend">
          <summary>Line guide</summary>
          <div className="tree-legend-content ui-card">
            <p><span className="tree-line-sample" />Parent / child or partnership</p>
            <p><span className="tree-line-sample is-dashed" />Adoptive, step, foster or guardian</p>
            <p><span className="tree-line-sample is-dotted" />Former or separated partnership</p>
            <p className="text-muted">Select a person for exact relationship details. A partnership does not imply parenthood.</p>
          </div>
        </details>
      </div>
    </Card>
  </div>;
}
