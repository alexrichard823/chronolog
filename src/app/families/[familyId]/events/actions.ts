"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type DatePrecision = "exact" | "approximate" | "range" | "unknown";

function parseDate(formData: FormData) {
  const precision = String(formData.get("datePrecision") ?? "unknown") as DatePrecision;
  if (!["exact", "approximate", "range", "unknown"].includes(precision)) return null;
  if (precision === "unknown") return { precision, start: null, end: null, display: null, uncertain: false };

  if (precision === "exact") {
    const value = String(formData.get("exactDate") ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return null;
    return {
      precision,
      start: value,
      end: value,
      display: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date),
      uncertain: false,
    };
  }

  if (precision === "approximate") {
    const year = Number(String(formData.get("approximateYear") ?? "").trim());
    if (!Number.isInteger(year) || year < 1 || year > 9999) return null;
    return { precision, start: `${String(year).padStart(4, "0")}-01-01`, end: null, display: `Around ${year}`, uncertain: true };
  }

  const start = String(formData.get("rangeStart") ?? "").trim();
  const end = String(formData.get("rangeEnd") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) return null;
  return { precision, start, end, display: `${start} to ${end}`, uncertain: false };
}

export async function createEvent(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "custom").trim() || "custom";
  const description = String(formData.get("description") ?? "").trim() || null;
  const placeName = String(formData.get("placeName") ?? "").trim() || null;
  const personIds = formData.getAll("personIds").map(String).filter(Boolean);
  const parsedDate = parseDate(formData);

  if (!familyId || !title) redirect(`/families/${familyId}/events/new?error=missing-title`);
  if (!parsedDate) redirect(`/families/${familyId}/events/new?error=invalid-date`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin", "editor"].includes(membership.role)) redirect(`/families/${familyId}?error=no-edit-access`);

  const { data: event, error } = await supabase.from("events").insert({
    family_id: familyId,
    title,
    event_type: eventType,
    description,
    place_name: placeName,
    date_precision: parsedDate.precision,
    date_start: parsedDate.start,
    date_end: parsedDate.end,
    date_display: parsedDate.display,
    date_is_uncertain: parsedDate.uncertain,
    created_by: user.id,
    updated_by: user.id,
  }).select("id").single();

  if (error || !event) redirect(`/families/${familyId}/events/new?error=create-failed`);

  if (personIds.length > 0) {
    const { error: linkError } = await supabase.from("event_people").insert(personIds.map((personId) => ({ family_id: familyId, event_id: event.id, person_id: personId })));
    if (linkError) {
      await supabase.from("events").delete().eq("id", event.id).eq("family_id", familyId);
      redirect(`/families/${familyId}/events/new?error=create-failed`);
    }
  }

  redirect(`/families/${familyId}/events/${event.id}?created=1`);
}
