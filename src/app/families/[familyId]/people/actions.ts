"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type DatePrefix = "birth" | "death";
type DatePrecision = "unknown" | "exact" | "year" | "approximate";

type ParsedPersonDate = {
  precision: DatePrecision;
  start: string | null;
  end: string | null;
  display: string | null;
  uncertain: boolean;
};

function parsePersonDate(formData: FormData, prefix: DatePrefix): ParsedPersonDate | null {
  const rawPrecision = String(formData.get(`${prefix}Precision`) ?? "unknown");
  const allowed: DatePrecision[] = ["unknown", "exact", "year", "approximate"];

  if (!allowed.includes(rawPrecision as DatePrecision)) return null;
  const precision = rawPrecision as DatePrecision;

  if (precision === "unknown") {
    return { precision, start: null, end: null, display: null, uncertain: false };
  }

  if (precision === "exact") {
    const exactDate = String(formData.get(`${prefix}ExactDate`) ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exactDate)) return null;
    const parsed = new Date(`${exactDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return null;
    const display = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed);
    return { precision, start: exactDate, end: exactDate, display, uncertain: false };
  }

  const rawYear = String(formData.get(`${prefix}Year`) ?? "").trim();
  const year = Number(rawYear);
  if (!Number.isInteger(year) || year < 1 || year > 9999) return null;
  const sortableDate = `${String(year).padStart(4, "0")}-01-01`;

  if (precision === "year") {
    return { precision, start: sortableDate, end: null, display: String(year), uncertain: false };
  }

  return { precision, start: sortableDate, end: null, display: `Around ${year}`, uncertain: true };
}

function optionalText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim() || null;
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createPerson(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!familyId || !displayName) redirect(`/families/${familyId}/people/new?error=missing-name`);

  const birthDate = parsePersonDate(formData, "birth");
  const deathDate = parsePersonDate(formData, "death");
  if (!birthDate || !deathDate) redirect(`/families/${familyId}/people/new?error=invalid-date`);

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase.from("people").insert({
    family_id: familyId,
    display_name: displayName,
    birth_date_precision: birthDate.precision,
    birth_date_start: birthDate.start,
    birth_date_end: birthDate.end,
    birth_date_display: birthDate.display,
    birth_date_is_uncertain: birthDate.uncertain,
    death_date_precision: deathDate.precision,
    death_date_start: deathDate.start,
    death_date_end: deathDate.end,
    death_date_display: deathDate.display,
    death_date_is_uncertain: deathDate.uncertain,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) redirect(`/families/${familyId}/people/new?error=create-failed`);
  redirect(`/families/${familyId}/people?personCreated=1`);
}

export async function updatePerson(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const personId = String(formData.get("personId") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const editPath = `/families/${familyId}/people/${personId}/edit`;
  if (!familyId || !personId || !displayName) redirect(`${editPath}?error=missing-name`);

  const birthDate = parsePersonDate(formData, "birth");
  const deathDate = parsePersonDate(formData, "death");
  if (!birthDate || !deathDate) redirect(`${editPath}?error=invalid-date`);

  const lifeStatus = String(formData.get("lifeStatus") ?? "unknown");
  if (!["living", "deceased", "unknown"].includes(lifeStatus)) redirect(`${editPath}?error=invalid-person`);

  const { supabase, user } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("people")
    .update({
      display_name: displayName,
      first_name: optionalText(formData, "firstName"),
      middle_name: optionalText(formData, "middleName"),
      last_name: optionalText(formData, "lastName"),
      maiden_name: optionalText(formData, "maidenName"),
      nickname: optionalText(formData, "nickname"),
      life_status: lifeStatus,
      biography: optionalText(formData, "biography"),
      notes: optionalText(formData, "notes"),
      birth_date_precision: birthDate.precision,
      birth_date_start: birthDate.start,
      birth_date_end: birthDate.end,
      birth_date_display: birthDate.display,
      birth_date_is_uncertain: birthDate.uncertain,
      death_date_precision: deathDate.precision,
      death_date_start: deathDate.start,
      death_date_end: deathDate.end,
      death_date_display: deathDate.display,
      death_date_is_uncertain: deathDate.uncertain,
      updated_by: user.id,
    })
    .eq("id", personId)
    .eq("family_id", familyId);

  if (error) redirect(`${editPath}?error=update-failed`);
  redirect(`/families/${familyId}/people/${personId}?updated=1`);
}

export async function deletePerson(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const personId = String(formData.get("personId") ?? "").trim();
  if (!familyId || !personId) redirect(`/families/${familyId}/people?error=delete-failed`);

  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("people").delete().eq("id", personId).eq("family_id", familyId);
  if (error) redirect(`/families/${familyId}/people/${personId}?error=delete-failed`);

  redirect(`/families/${familyId}/people?personDeleted=1`);
}
