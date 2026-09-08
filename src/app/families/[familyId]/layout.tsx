import { notFound, redirect } from "next/navigation";
import { FamilyNavigation } from "@/components/family-navigation";
import { createClient } from "@/lib/supabase/server";

type FamilyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ familyId: string }>;
};

export default async function FamilyLayout({ children, params }: FamilyLayoutProps) {
  const { familyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/families/${familyId}`)}`);
  }

  const [familyResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase
      .from("family_memberships")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (familyResult.error || !familyResult.data || membershipResult.error || !membershipResult.data) {
    notFound();
  }

  return (
    <div className="family-app-shell">
      <FamilyNavigation
        familyId={familyId}
        familyName={familyResult.data.name}
        role={membershipResult.data.role}
        userEmail={user.email ?? "Signed-in member"}
      />
      <div className="family-shell-content">{children}</div>
    </div>
  );
}
