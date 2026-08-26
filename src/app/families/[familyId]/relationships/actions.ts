"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PARENT_SUBTYPES = ["biological", "adoptive", "step", "foster", "guardian", "unspecified"];
const PARTNER_STATUSES = ["partner", "married", "separated", "divorced", "widowed", "ended"];

async function getEditor(familyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin", "editor"].includes(membership.role)) redirect(`/families/${familyId}?error=no-edit-access`);
  return { supabase, user };
}

function errorRedirect(familyId: string, relationshipId: string, error: { code?: string; message?: string }) {
  const base = `/families/${familyId}/relationships/${relationshipId}/edit`;
  if (error.message?.includes("ancestry cycle")) redirect(`${base}?error=cycle`);
  if (error.code === "23505") redirect(`${base}?error=duplicate`);
  if (error.code === "23514") redirect(`${base}?error=invalid-link`);
  redirect(`${base}?error=update-failed`);
}

export async function updateRelationship(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const relationshipId = String(formData.get("relationshipId") ?? "").trim();
  const relationshipType = String(formData.get("relationshipType") ?? "").trim();
  let personAId = String(formData.get("personAId") ?? "").trim();
  let personBId = String(formData.get("personBId") ?? "").trim();
  const returnPersonId = String(formData.get("returnPersonId") ?? "").trim();
  const base = `/families/${familyId}/relationships/${relationshipId}/edit`;

  if (!familyId || !relationshipId || !personAId || !personBId || !["parent_child", "spouse_partner"].includes(relationshipType)) redirect(`${base}?error=missing-fields`);
  if (personAId === personBId) redirect(`${base}?error=invalid-link`);

  const parentChildSubtype = String(formData.get("parentChildSubtype") ?? "unspecified");
  const partnerStatus = String(formData.get("partnerStatus") ?? "partner");
  if (relationshipType === "parent_child" && !PARENT_SUBTYPES.includes(parentChildSubtype)) redirect(`${base}?error=invalid-link`);
  if (relationshipType === "spouse_partner" && !PARTNER_STATUSES.includes(partnerStatus)) redirect(`${base}?error=invalid-link`);

  if (relationshipType === "spouse_partner" && personAId > personBId) [personAId, personBId] = [personBId, personAId];

  const { supabase, user } = await getEditor(familyId);
  const { error } = await supabase
    .from("relationships")
    .update({
      relationship_type: relationshipType,
      person_a_id: personAId,
      person_b_id: personBId,
      parent_child_subtype: relationshipType === "parent_child" ? parentChildSubtype : null,
      partner_status: relationshipType === "spouse_partner" ? partnerStatus : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_by: user.id,
    })
    .eq("id", relationshipId)
    .eq("family_id", familyId);

  if (error) errorRedirect(familyId, relationshipId, error);
  const destinationPersonId = returnPersonId || personAId;
  redirect(`/families/${familyId}/people/${destinationPersonId}?relationshipUpdated=1`);
}

export async function deleteRelationship(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const relationshipId = String(formData.get("relationshipId") ?? "").trim();
  const returnPersonId = String(formData.get("returnPersonId") ?? "").trim();
  if (!familyId || !relationshipId || !returnPersonId) redirect(`/families/${familyId}?error=delete-failed`);

  const { supabase } = await getEditor(familyId);
  const { error } = await supabase.from("relationships").delete().eq("id", relationshipId).eq("family_id", familyId);
  if (error) redirect(`/families/${familyId}/people/${returnPersonId}?error=relationship-delete-failed`);
  redirect(`/families/${familyId}/people/${returnPersonId}?relationshipDeleted=1`);
}
