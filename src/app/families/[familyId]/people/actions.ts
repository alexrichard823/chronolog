"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPerson(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!familyId || !displayName) {
    redirect(`/families/${familyId}/people/new?error=missing-name`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("people").insert({
    family_id: familyId,
    display_name: displayName,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) {
    redirect(`/families/${familyId}/people/new?error=create-failed`);
  }

  redirect(`/families/${familyId}?personCreated=1`);
}
