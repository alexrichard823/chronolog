"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MEDIA_BUCKET } from "@/lib/media-config";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createFamily(formData: FormData) {
  const { supabase } = await getAuthenticatedClient();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 1 || name.length > 120) {
    redirect("/families/new?error=Family%20name%20must%20be%20between%201%20and%20120%20characters.");
  }

  const { error } = await supabase.rpc("create_family", {
    family_name: name,
    family_description: description || null,
  });

  if (error) {
    console.error("Failed to create family", error);
    redirect("/families/new?error=Unable%20to%20create%20family.%20Please%20try%20again.");
  }

  revalidatePath("/families");
  redirect("/families");
}

export async function updateFamily(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const editPath = `/families/${familyId}/edit`;
  if (!familyId || name.length < 1 || name.length > 120) redirect(`${editPath}?error=invalid-name`);

  const { supabase, user } = await getAuthenticatedClient();
  const { data: membership } = await supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) redirect(`/families/${familyId}?error=no-manage-access`);

  const { error } = await supabase.from("families").update({ name, description, updated_at: new Date().toISOString() }).eq("id", familyId);
  if (error) redirect(`${editPath}?error=update-failed`);

  revalidatePath("/families");
  revalidatePath(`/families/${familyId}`);
  redirect(`/families/${familyId}?familyUpdated=1`);
}

export async function deleteFamily(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  if (!familyId) redirect("/families?error=delete-failed");

  const { supabase, user } = await getAuthenticatedClient();
  const { data: membership } = await supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle();
  if (!membership || membership.role !== "owner") redirect(`/families/${familyId}?error=owner-only-delete`);

  const { data, error } = await supabase.rpc("delete_family_archive", { target_family_id: familyId });
  if (error) redirect(`/families/${familyId}/edit?error=delete-failed`);

  const storagePaths = Array.isArray(data) ? data.filter((value): value is string => typeof value === "string" && value.length > 0) : [];
  let cleanupFailed = false;

  for (let index = 0; index < storagePaths.length; index += 100) {
    const chunk = storagePaths.slice(index, index + 100);
    let result = await supabase.storage.from(MEDIA_BUCKET).remove(chunk);
    if (result.error) result = await supabase.storage.from(MEDIA_BUCKET).remove(chunk);
    if (result.error) cleanupFailed = true;
  }

  if (!cleanupFailed) {
    const { error: completionError } = await supabase.rpc("complete_family_media_cleanup", { target_family_id: familyId });
    cleanupFailed = Boolean(completionError);
  }

  revalidatePath("/families");
  redirect(`/families?familyDeleted=1${cleanupFailed ? "&warning=media-cleanup" : ""}`);
}
