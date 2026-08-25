"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createFamily(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
