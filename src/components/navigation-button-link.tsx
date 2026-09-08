"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { ButtonLink, type ButtonLinkProps } from "@/components/ui";

function NavigationLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();

  return (
    <span data-pending={pending} aria-busy={pending}>
      {children}
      {pending ? <span className="sr-only"> — Opening…</span> : null}
    </span>
  );
}

export function NavigationButtonLink({
  children,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <ButtonLink
      className={["ui-button-feedback", className].filter(Boolean).join(" ")}
      {...props}
    >
      <NavigationLabel>{children}</NavigationLabel>
    </ButtonLink>
  );
}
