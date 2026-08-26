"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const MANAGED_ROLES = new Set(["admin", "editor", "viewer"]);

function membersPath(familyId: string, params = "") {
  return `/families/${familyId}/members${params ? `?${params}` : ""}`;
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  if (!host) throw new Error("Unable to determine application origin");
  return `${protocol}://${host}`;
}

function invitationErrorCode(message: string) {
  const text = message.toLowerCase();
  if (text.includes("already a member")) return "already-member";
  if (text.includes("pending invitation")) return "already-invited";
  if (text.includes("rate limit")) return "rate-limited";
  if (text.includes("owner or an admin") || text.includes("access denied")) return "no-manage-access";
  if (text.includes("valid email")) return "invalid-email";
  return "invite-failed";
}

export async function inviteFamilyMember(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim();
  if (!familyId) redirect("/families");
  if (!email || !email.includes("@")) redirect(membersPath(familyId, "error=invalid-email"));
  if (!MANAGED_ROLES.has(role)) redirect(membersPath(familyId, "error=invalid-role"));

  const { supabase } = await requireUser();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const { data: invitationId, error: createError } = await supabase.rpc("create_family_invitation", {
    target_family_id: familyId,
    target_email: email,
    target_role: role,
    supplied_token_hash: tokenHash,
  });

  if (createError || !invitationId) {
    redirect(membersPath(familyId, `error=${invitationErrorCode(createError?.message ?? "")}`));
  }

  const origin = await requestOrigin();
  const nextPath = `/invitations/accept?token=${encodeURIComponent(rawToken)}`;
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const mailClient = createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );

  const { error: emailError } = await mailClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl, shouldCreateUser: true },
  });

  if (emailError) {
    console.error("Failed to send family invitation email", emailError);
    await supabase.rpc("revoke_family_invitation", { target_invitation_id: invitationId });
    redirect(membersPath(familyId, "error=email-send-failed"));
  }

  revalidatePath(membersPath(familyId));
  redirect(membersPath(familyId, "invited=1"));
}

export async function revokeInvitation(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!familyId || !invitationId) redirect("/families");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("revoke_family_invitation", { target_invitation_id: invitationId });
  if (error) redirect(membersPath(familyId, "error=revoke-failed"));
  revalidatePath(membersPath(familyId));
  redirect(membersPath(familyId, "revoked=1"));
}

export async function updateMemberRole(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!familyId || !userId) redirect("/families");
  if (!MANAGED_ROLES.has(role)) redirect(membersPath(familyId, "error=invalid-role"));
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("update_family_member_role", {
    target_family_id: familyId,
    target_user_id: userId,
    target_role: role,
  });
  if (error) redirect(membersPath(familyId, "error=role-update-failed"));
  revalidatePath(membersPath(familyId));
  revalidatePath(`/families/${familyId}`);
  redirect(membersPath(familyId, "roleUpdated=1"));
}

export async function removeMember(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!familyId || !userId) redirect("/families");
  const { supabase, user } = await requireUser();
  const removingSelf = user.id === userId;
  const { error } = await supabase.rpc("remove_family_member", {
    target_family_id: familyId,
    target_user_id: userId,
  });
  if (error) redirect(membersPath(familyId, "error=remove-failed"));
  revalidatePath("/families");
  revalidatePath(`/families/${familyId}`);
  if (removingSelf) redirect("/families?leftFamily=1");
  redirect(membersPath(familyId, "removed=1"));
}
