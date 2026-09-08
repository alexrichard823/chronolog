"use client";

import Link, { useLinkStatus } from "next/link";
import { Card } from "@/components/ui";

type FamilyCardProps = {
  id: string;
  name: string;
  peopleCount: number;
  memberCount: number;
};

function FamilyCardContent({ name, peopleCount, memberCount }: Omit<FamilyCardProps, "id">) {
  const { pending } = useLinkStatus();

  return (
    <Card className="flex items-center justify-between gap-4 p-5 sm:p-6" data-pending={pending}>
      <div className="min-w-0">
        <h2 className="break-words text-2xl font-semibold">{name}</h2>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-strong">
          <span>{peopleCount.toLocaleString("en-US")} {peopleCount === 1 ? "person" : "people"}</span>
          <span>{memberCount.toLocaleString("en-US")} {memberCount === 1 ? "member" : "members"}</span>
        </div>
      </div>
      <span className="shrink-0 text-primary" aria-hidden="true">
        {pending ? (
          <svg className="size-5 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" opacity="0.25" />
            <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 5 7 7-7 7" />
          </svg>
        )}
      </span>
      <span className="sr-only" role="status">{pending ? `Opening ${name}…` : ""}</span>
    </Card>
  );
}

export default function FamilyCard({ id, ...props }: FamilyCardProps) {
  return (
    <Link href={`/families/${id}`} className="family-choice">
      <FamilyCardContent {...props} />
    </Link>
  );
}
