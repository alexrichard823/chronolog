"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { readableEventType, searchTimelinePeople, timelineHref, type TimelinePerson } from "@/lib/timeline-filters";
import { TimelineIcon } from "./timeline-icon";

type Props = {
  familyId: string;
  people: TimelinePerson[];
  eventTypes: string[];
  selectedPersonId: string;
  selectedEventType: string;
  page: number;
};

type FormProps = Props & {
  pending: boolean;
  applied: boolean;
  onEdit: () => void;
  onApply: (personId: string, eventType: string) => void;
};

function FilterForm({ people, eventTypes, selectedPersonId, selectedEventType, pending, applied, onEdit, onApply }: FormProps) {
  const [personId, setPersonId] = useState(selectedPersonId);
  const [query, setQuery] = useState(people.find((person) => person.id === selectedPersonId)?.display_name ?? "");
  const [eventType, setEventType] = useState(selectedEventType);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const matches = searchTimelinePeople(people, personId ? "" : query);
  const options = !query.trim() || personId ? [{ id: "", display_name: "All people" }, ...matches] : matches;
  const activeOptionId = open && activeIndex >= 0 && activeIndex < options.length ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView({ block: "nearest" });
  }, [activeOptionId]);

  function choose(person: TimelinePerson) {
    inputRef.current?.focus();
    setPersonId(person.id);
    setQuery(person.id ? person.display_name : "");
    setOpen(false);
    setActiveIndex(-1);
    setError("");
    onEdit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => event.key === "ArrowDown"
        ? Math.min(current + 1, options.length - 1)
        : current < 0 ? options.length - 1 : Math.max(0, current - 1));
    } else if (event.key === "Enter" && activeOptionId) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let nextPersonId = personId;
    if (query.trim() && !nextPersonId) {
      const candidates = searchTimelinePeople(people, query);
      if (candidates.length !== 1) {
        setError(candidates.length ? "Choose a person from the matching names." : "No matching person. Try another name or clear the search.");
        setOpen(true);
        inputRef.current?.focus();
        return;
      }
      nextPersonId = candidates[0].id;
      setPersonId(nextPersonId);
      setQuery(candidates[0].display_name);
    }
    setError("");
    setOpen(false);
    onApply(nextPersonId, eventType);
  }

  return (
    <form onSubmit={submit} aria-label="Timeline filters" aria-busy={pending}>
      <fieldset disabled={pending} className="mt-5 grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
        <legend className="sr-only">Filter by person and event type</legend>
        <div className="relative min-w-0" onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActiveIndex(-1); }
        }}>
          <Field label="Search people" htmlFor="timeline-person" error={error}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted"><TimelineIcon name="search" /></span>
              <Input id="timeline-person" ref={inputRef} className="timeline-person-input" placeholder="Search by name…"
                role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listId : undefined}
                aria-activedescendant={activeOptionId} aria-describedby={error ? "timeline-person-error" : "timeline-person-help"}
                aria-invalid={Boolean(error)} autoComplete="off" value={query}
                onFocus={() => setOpen(true)} onKeyDown={handleKeyDown}
                onChange={(event) => { setQuery(event.target.value); setPersonId(""); setOpen(true); setActiveIndex(-1); setError(""); onEdit(); }} />
              {query && <button type="button" aria-label="Clear person search" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted hover:text-primary active:bg-primary-soft"
                onClick={() => choose({ id: "", display_name: "All people" })}><TimelineIcon name="close" /></button>}
            </div>
          </Field>
          {error && <span id="timeline-person-error" className="sr-only">{error}</span>}
          {open && (
            <div className="absolute top-full z-30 mt-2 w-full rounded-lg border border-border bg-surface p-1 shadow-sm">
              <ul id={listId} role="listbox" aria-label="Matching people" className="max-h-64 overflow-y-auto overscroll-contain">
                {options.map((person, index) => (
                  <li key={person.id} role="presentation">
                    <button type="button" role="option" tabIndex={-1} id={`${listId}-${index}`} aria-selected={person.id === personId}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-primary-soft active:bg-primary-soft ${index === activeIndex || person.id === personId ? "bg-primary-soft text-primary" : "text-foreground"}`}
                      onMouseDown={(event) => event.preventDefault()} onClick={() => choose(person)}>
                      <TimelineIcon name="people" className="ui-icon-sm" /><span className="min-w-0 flex-1 break-words">{person.display_name}</span>
                      {person.id === personId && <TimelineIcon name="check" className="ui-icon-sm" />}
                    </button>
                  </li>
                ))}
              </ul>
              {!options.length && <p className="px-3 py-4 text-sm text-muted" role="status">No people found. Try another name.</p>}
            </div>
          )}
        </div>
        <Field label="Event type" htmlFor="timeline-type">
          <Select id="timeline-type" name="type" value={eventType} onChange={(event) => { setEventType(event.target.value); onEdit(); }}>
            <option value="">All event types</option>
            {eventTypes.map((type) => <option key={type} value={type}>{readableEventType(type)}</option>)}
          </Select>
        </Field>
        <Button type="submit" disabled={pending} className="ui-button-feedback w-full md:mt-6 md:w-auto" aria-busy={pending}>
          <span data-pending={pending} className="inline-flex items-center gap-2">
            {pending ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" aria-hidden="true" /> : <TimelineIcon name={applied ? "check" : "filter"} className="ui-icon-sm" />}
            {pending ? "Applying…" : applied ? "Filters applied" : "Apply filters"}
          </span>
        </Button>
      </fieldset>
      <p id="timeline-person-help" className="mt-3 text-sm text-muted">Search and select a person, or leave blank for everyone.</p>
      <p role="status" className="sr-only">{pending ? "Applying timeline filters." : applied ? "Filters applied. Timeline updated." : ""}</p>
    </form>
  );
}

export function TimelineFilters(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastSubmission, setLastSubmission] = useState<string | null>(null);
  const currentHref = timelineHref(props.familyId, props.selectedPersonId, props.selectedEventType, props.page);
  const activePerson = props.people.find((person) => person.id === props.selectedPersonId);
  const activeCount = Number(Boolean(activePerson)) + Number(Boolean(props.selectedEventType));

  function apply(personId: string, eventType: string) {
    const href = timelineHref(props.familyId, personId, eventType);
    setLastSubmission(href);
    startTransition(() => { router.push(href, { scroll: false }); });
  }

  return (
    <Card className="mt-6 p-4 sm:p-6" aria-labelledby="timeline-filter-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary"><TimelineIcon name="filter" /></span>
          <div><h2 id="timeline-filter-heading" className="font-semibold">Filter timeline</h2><p className="text-sm text-muted">Find the moments you’re looking for.</p></div>
        </div>
        {activeCount > 0 && <Button variant="secondary" className="ui-button-feedback" disabled={pending} onClick={() => apply("", "")}>
          <TimelineIcon name="close" className="ui-icon-sm" /> Clear filters
        </Button>}
      </div>
      <FilterForm key={currentHref} {...props} pending={pending} applied={!pending && lastSubmission === currentHref} onEdit={() => setLastSubmission(null)} onApply={apply} />
      {activeCount > 0 && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4" aria-label="Applied filters">
        <span className="text-xs font-medium text-muted">Showing</span>
        {activePerson && <Badge variant="primary" className="max-w-full gap-1.5 break-words"><TimelineIcon name="people" className="ui-icon-sm" />{activePerson.display_name}</Badge>}
        {props.selectedEventType && <Badge variant="primary">{readableEventType(props.selectedEventType)}</Badge>}
      </div>}
    </Card>
  );
}
