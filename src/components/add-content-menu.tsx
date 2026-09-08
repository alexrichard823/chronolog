"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";

type Props = {
  familyId: string;
  personId?: string;
};

export function AddContentMenu({ familyId, personId }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const menuId = useId();
  const root = `/families/${familyId}`;
  const personQuery = personId ? `?personId=${encodeURIComponent(personId)}` : "";
  const options = [
    ...(!personId ? [{ label: "Person", href: `${root}/people/new` }] : []),
    { label: "Story", href: `${root}/stories/new${personQuery}` },
    { label: "Event", href: `${root}/events/new${personQuery}` },
    { label: "Media", href: `${root}/media/new${personQuery}` },
  ];

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, []);

  return (
    <details
      ref={detailsRef}
      className="ui-add-menu"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.open = false;
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && event.currentTarget.open) {
          event.preventDefault();
          event.currentTarget.open = false;
          summaryRef.current?.focus();
        }
      }}
    >
      <summary ref={summaryRef} className="ui-button ui-button-primary" aria-controls={menuId}>
        Add
        <svg className="ui-icon-sm" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <ul id={menuId} className="ui-add-menu-options" aria-label="Add to this family">
        {options.map((option) => (
          <li key={option.label}>
            <Link
              href={option.href}
              onClick={() => {
                if (detailsRef.current) detailsRef.current.open = false;
              }}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
