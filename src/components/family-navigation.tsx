"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { logout } from "@/lib/auth/actions";

type FamilyNavigationProps = {
  familyId: string;
  familyName: string;
  role: string;
  userEmail: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: "home" | "people" | "timeline" | "tree" | "media" | "members" | "settings";
  exact?: boolean;
  activePrefixes?: string[];
};

function NavIcon({ name }: { name: NavigationItem["icon"] }) {
  const common = {
    "aria-hidden": true,
    className: "ui-icon-md",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home") {
    return <svg {...common}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></svg>;
  }
  if (name === "people") {
    return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13a5.5 5.5 0 0 1 5.5 5.5V20" /><path d="M16 4.5a3 3 0 0 1 0 5.8" /><path d="M17 13.2a5.5 5.5 0 0 1 3.5 5.1V20" /></svg>;
  }
  if (name === "timeline") {
    return <svg {...common}><path d="M6 3v18" /><circle cx="6" cy="7" r="2" /><circle cx="6" cy="17" r="2" /><path d="M10 7h10" /><path d="M10 17h7" /></svg>;
  }
  if (name === "tree") {
    return <svg {...common}><rect x="9" y="2.5" width="6" height="5" rx="1" /><rect x="2.5" y="16.5" width="6" height="5" rx="1" /><rect x="15.5" y="16.5" width="6" height="5" rx="1" /><path d="M12 7.5v5M5.5 16.5v-4h13v4" /></svg>;
  }
  if (name === "media") {
    return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m5.5 17 4.5-4 3 2.5 2.5-2 3 3.5" /></svg>;
  }
  if (name === "members") {
    return <svg {...common}><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13a5.5 5.5 0 0 1 5.5 5.5V20" /><path d="M14.5 14a4.5 4.5 0 0 1 7 3.7V20" /></svg>;
  }

  return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>;
}

function isItemActive(pathname: string, item: NavigationItem) {
  if (item.exact) return pathname === item.href;
  const prefixes = item.activePrefixes ?? [item.href];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function NavLink({
  item,
  pathname,
  className,
  children,
}: {
  item: NavigationItem;
  pathname: string;
  className: string;
  children?: ReactNode;
}) {
  const active = isItemActive(pathname, item);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`${className}${active ? " is-active" : ""}`}
    >
      <NavIcon name={item.icon} />
      {children ?? <span>{item.label}</span>}
    </Link>
  );
}

function personContext(pathname: string, searchParams: URLSearchParams) {
  const profileMatch = pathname.match(/\/people\/([^/]+)(?:\/|$)/);
  if (profileMatch?.[1] && profileMatch[1] !== "new") return profileMatch[1];
  if (pathname.includes("/timeline") || pathname.includes("/tree")) {
    return searchParams.get("person");
  }
  return null;
}

export function FamilyNavigation({ familyId, familyName, role, userEmail }: FamilyNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const root = `/families/${familyId}`;
  const selectedPersonId = personContext(pathname, searchParams);
  const personQuery = selectedPersonId ? `?person=${encodeURIComponent(selectedPersonId)}` : "";
  const canManageArchive = role === "owner" || role === "admin";

  const primaryItems: NavigationItem[] = [
    { label: "Home", href: root, icon: "home", exact: true },
    {
      label: "People",
      href: `${root}/people`,
      icon: "people",
      activePrefixes: [`${root}/people`, `${root}/relationships`],
    },
    { label: "Timeline", href: `${root}/timeline${personQuery}`, icon: "timeline", activePrefixes: [`${root}/timeline`] },
    { label: "Tree", href: `${root}/tree${personQuery}`, icon: "tree", activePrefixes: [`${root}/tree`] },
  ];
  const secondaryItems: NavigationItem[] = [
    { label: "Media", href: `${root}/media`, icon: "media" },
    { label: "Members", href: `${root}/members`, icon: "members" },
    ...(canManageArchive
      ? [{ label: "Archive settings", href: `${root}/edit`, icon: "settings" as const }]
      : []),
  ];

  useEffect(() => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  }, [pathname]);

  return (
    <>
      <aside className="family-sidebar" aria-label="Family navigation">
        <Link href="/families" className="family-brand" aria-label="Chronolog families">
          <span className="family-brand-mark" aria-hidden="true">C</span>
          <span>Chronolog</span>
        </Link>

        <div className="family-context">
          <p>Family archive</p>
          <Link href={root}>{familyName}</Link>
        </div>

        <nav className="family-primary-links" aria-label="Primary family destinations">
          {primaryItems.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} className="family-nav-link" />
          ))}
        </nav>

        <div className="family-sidebar-divider" />
        <nav className="family-secondary-links" aria-label="Family archive destinations">
          {secondaryItems.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} className="family-nav-link family-nav-link-secondary" />
          ))}
        </nav>

        <div className="family-account">
          <p title={userEmail}>{userEmail}</p>
          <div className="family-account-actions">
            <Link href="/families">Switch family</Link>
            <form action={logout}>
              <button type="submit">Log out</button>
            </form>
          </div>
        </div>
      </aside>

      <header className="family-mobile-header">
        <Link href={root} className="family-mobile-context">
          <span className="family-brand-mark" aria-hidden="true">C</span>
          <span>
            <small>Family archive</small>
            <strong>{familyName}</strong>
          </span>
        </Link>
        <details ref={mobileMenuRef} className="family-mobile-more">
          <summary aria-label="Open family menu">
            <span>More</span>
            <svg aria-hidden="true" className="ui-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
          </summary>
          <div className="family-mobile-menu">
            <nav aria-label="More family destinations">
              {secondaryItems.map((item) => (
                <NavLink key={item.label} item={item} pathname={pathname} className="family-mobile-menu-link" />
              ))}
            </nav>
            <div className="family-mobile-menu-divider" />
            <p title={userEmail}>{userEmail}</p>
            <Link href="/families" className="family-mobile-menu-action">Switch family</Link>
            <form action={logout}>
              <button type="submit" className="family-mobile-menu-action">Log out</button>
            </form>
          </div>
        </details>
      </header>

      <nav className="family-mobile-nav" aria-label="Primary family destinations">
        {primaryItems.map((item) => (
          <NavLink key={item.label} item={item} pathname={pathname} className="family-mobile-nav-link">
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
