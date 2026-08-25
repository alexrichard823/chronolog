"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createRelationshipAction(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const focalPersonId = String(formData.get("focalPersonId") ?? "").trim();
  const relationshipToFocal = String(formData.get("relationshipToFocal") ?? "").trim();
  const relativeMode = String(formData.get("relativeMode") ?? "existing").trim();
  const existingRelativeId = String(formData.get("existingRelativeId") ?? "").trim();
  const newRelativeName = String(formData.get("newRelativeName") ?? "").trim();
  const parentChildSubtype = String(formData.get("parentChildSubtype") ?? "unspecified").trim();
  const partnerStatus = String(formData.get("partnerStatus") ?? "partner").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const basePath = `/families/${familyId}/people/${focalPersonId}/relationships/new`;

  if (!familyId || !focalPersonId || !["parent", "child", "spouse_partner"].includes(relationshipToFocal)) {
    redirect(`${basePath}?error=missing-fields`);
  }

  if (relativeMode === "existing" && !existingRelativeId) {
    redirect(`${basePath}?error=missing-relative`);
  }

  if (relativeMode === "new" && !newRelativeName) {
    redirect(`${basePath}?error=missing-relative`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("create_relationship", {
    target_family_id: familyId,
    focal_person_id: focalPersonId,
    relationship_to_focal: relationshipToFocal,
    existing_relative_id: relativeMode === "existing" ? existingRelativeId : null,
    new_relative_name: relativeMode === "new" ? newRelativeName : null,
    parent_child_subtype_value: parentChildSubtype || "unspecified",
    partner_status_value: partnerStatus || "partner",
    relationship_notes: notes || null,
  });

  if (error) {
    if (error.message.includes("already exists in this family")) {
      redirect(`${basePath}?error=existing-person`);
    }

    if (error.message.includes("ancestry cycle")) {
      redirect(`${basePath}?error=cycle`);
    }

    if (error.code === "23505") {
      redirect(`${basePath}?error=duplicate`);
    }

    if (error.code === "23514") {
      redirect(`${basePath}?error=invalid-link`);
    }

    redirect(`${basePath}?error=create-failed`);
  }

  redirect(`/families/${familyId}/people/${focalPersonId}?relationshipCreated=1`);
}
