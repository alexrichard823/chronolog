"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) redirect("/invitations/accept?error=invalid");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invitations/accept?token=${encodeURIComponent(token)}`)}`);

  const { data: familyId, error } = await supabase.rpc("accept_family_invitation", { raw_token: token });
  if (error || !familyId) {
    const message = error?.message.toLowerCase() ?? "";
    const code = message.includes("email address") ? "wrong-email" : message.includes("already a member") ? "already-member" : "invalid";
    redirect(`/invitations/accept?token=${encodeURIComponent(token)}&error=${code}`);
  }

  revalidatePath("/families");
  revalidatePath(`/families/${familyId}`);
  redirect(`/families/${familyId}?joined=1`);
}
