import Link from "next/link";
import LogoutButton from "./logout-button";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Card, PageContainer } from "@/components/ui";
import FamilyCard from "./family-card";

type Props = {
  searchParams: Promise<{ familyDeleted?: string; leftFamily?: string; warning?: string; error?: string }>;
};

export default async function FamiliesPage({ searchParams }: Props) {
  const { familyDeleted, leftFamily, warning, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: families, error } = await supabase
    .from("families")
    .select("id, name, people(count), family_memberships(count)")
    .order("created_at", { ascending: true });

  return (
    <main>
      <PageContainer width="narrow" className="flex min-h-dvh flex-col py-8 sm:py-10">
        <header>
          <Link href="/families" className="family-brand" aria-label="Chronolog families">
            <span className="family-brand-mark" aria-hidden="true">C</span>
            <span>Chronolog</span>
          </Link>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Your Families</h1>
              <p className="mt-2 text-muted">Private family archives you belong to.</p>
            </div>
            <ButtonLink href="/families/new" className="self-start whitespace-nowrap sm:self-auto">Create family</ButtonLink>
          </div>
        </header>

        {familyDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Family archive permanently deleted.</p>}
        {leftFamily === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">You left the family and no longer have access to it.</p>}
        {warning === "media-cleanup" && <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The archive records were deleted, but one or more private media files could not be cleaned up automatically. They are no longer visible in Chronolog.</p>}
        {errorCode === "delete-failed" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">We could not delete that family archive.</p>}

        {error ? (
          <p className="mt-8 rounded border border-red-200 bg-red-50 p-4 text-red-700">We could not load your families. Please refresh and try again.</p>
        ) : families && families.length > 0 ? (
          <ul className="mt-8 grid gap-4" aria-label="Your family archives">
            {families.map((family) => (
              <li key={family.id}>
                <FamilyCard
                  id={family.id}
                  name={family.name}
                  peopleCount={family.people[0]?.count ?? 0}
                  memberCount={family.family_memberships[0]?.count ?? 0}
                />
              </li>
            ))}
          </ul>
        ) : (
          <Card className="mt-8 border-dashed p-8 text-center">
            <h2 className="text-xl font-semibold">Create your first family archive</h2>
            <p className="mt-2 text-muted">Start by naming your family. You can add people, stories, events, and media next.</p>
            <ButtonLink href="/families/new" className="mt-5">Create family</ButtonLink>
          </Card>
        )}

        <footer className="mt-auto pt-10">
          <div className="border-t border-border pt-6">
            <p className="break-words text-sm text-muted">Signed in as {user.email}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <LogoutButton />
              <ButtonLink href="/families/deleted" variant="ghost" className="text-right">Recently Deleted</ButtonLink>
            </div>
          </div>
        </footer>
      </PageContainer>
    </main>
  );
}
