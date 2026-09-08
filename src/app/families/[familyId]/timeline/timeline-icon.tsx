import type { ReactNode } from "react";

const paths = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  filter: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="17" r="2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
  place: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2" /></>,
  story: <><path d="M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" /></>,
  media: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8" cy="9" r="1.5" /><path d="m4 18 6-5 4 3 3-3 4 4" /></>,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  timeline: <><path d="M6 3v18" /><circle cx="6" cy="7" r="2" /><circle cx="6" cy="17" r="2" /><path d="M11 7h9m-9 10h6" /></>,
} satisfies Record<string, ReactNode>;

export function TimelineIcon({ name, className = "ui-icon-md" }: { name: keyof typeof paths; className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
