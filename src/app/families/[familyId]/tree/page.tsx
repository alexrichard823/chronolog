import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ButtonLink, Card, PageContainer } from "@/components/ui";
import { createSignedMediaMap } from "@/lib/media";
import type { TreePersonRecord, TreeRelationshipRecord } from "@/lib/family-tree";
import { createClient } from "@/lib/supabase/server";
import { TreeView } from "./tree-view";

type Props = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ person?: string }>;
};

export default async function FamilyTreePage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const { person: requestedPersonId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, peopleResult, relationshipsResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("people")
      .select("id, display_name, birth_date_display, death_date_display, profile_photo_path, created_at")
      .eq("family_id", familyId).order("created_at", { ascending: true }),
    supabase.from("relationships")
      .select("id, relationship_type, person_a_id, person_b_id, parent_child_subtype, partner_status")
      .eq("family_id", familyId),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (familyResult.error || !familyResult.data || membershipResult.error || !membershipResult.data) notFound();
  const canEdit = ["owner", "admin", "editor"].includes(membershipResult.data.role);

  if (peopleResult.error || relationshipsResult.error) {
    return <main className="py-6 sm:py-8"><PageContainer width="wide">
      <Link href={`/families/${familyId}`} className="text-sm underline">Back to family</Link>
      <Card className="mt-6 p-6" role="alert"><h1 className="text-xl font-semibold">We couldn’t load the family tree</h1>
        <p className="mt-2 text-muted">Please refresh the page and try again.</p>
      </Card>
    </PageContainer></main>;
  }

  const records = peopleResult.data ?? [];
  if (!records.length) {
    return <main className="py-6 sm:py-8"><PageContainer width="wide">
      <h1 className="text-3xl font-semibold">Family tree</h1>
      <Card className="mt-6 p-8 text-center">
        <h2 className="text-xl font-semibold">Every family story starts with someone</h2>
        <p className="mt-3 text-muted">{canEdit ? "Add your first person, then connect their relatives to grow your tree." : "Your family’s tree will appear here when an editor adds the first person."}</p>
        {canEdit && <ButtonLink href={`/families/${familyId}/people/new`} className="mt-5">Add the first person</ButtonLink>}
      </Card>
    </PageContainer></main>;
  }

  // Only request private images from this family, using the member's RLS-bound client.
  const photoPaths = records.map((person) => person.profile_photo_path)
    .filter((path): path is string => Boolean(path && path.startsWith(`${familyId}/`)));
  const signedPhotos = await createSignedMediaMap(photoPaths);
  const people: TreePersonRecord[] = records.map((person) => ({
    id: person.id, display_name: person.display_name,
    birth_date_display: person.birth_date_display, death_date_display: person.death_date_display,
    photoUrl: person.profile_photo_path ? signedPhotos.get(person.profile_photo_path) ?? null : null,
  }));
  const relationships = (relationshipsResult.data ?? []) as TreeRelationshipRecord[];
  const subjectId = people.some((person) => person.id === requestedPersonId) ? requestedPersonId! : people[0].id;

  return <main className="py-6 sm:py-8"><PageContainer width="wide">
    <TreeView familyId={familyId} familyName={familyResult.data.name} people={people} relationships={relationships} subjectId={subjectId} canEdit={canEdit} />
  </PageContainer></main>;
}
