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
    return { precision, start: value, end: value, display: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date), uncertain: false };
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

function selectedIds(formData: FormData, name: string) {
  return Array.from(new Set(formData.getAll(name).map(String).filter(Boolean)));
}

async function getEditor(familyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: membership } = await supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin", "editor"].includes(membership.role)) redirect(`/families/${familyId}?error=no-edit-access`);
  return { supabase, user };
}

export async function createStory(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const placeName = String(formData.get("placeName") ?? "").trim() || null;
  const personIds = selectedIds(formData, "personIds");
  const eventIds = selectedIds(formData, "eventIds");
  const parsedDate = parseDate(formData);
  if (!familyId || !title || !content) redirect(`/families/${familyId}/stories/new?error=missing-content`);
  if (!parsedDate) redirect(`/families/${familyId}/stories/new?error=invalid-date`);

  const { supabase, user } = await getEditor(familyId);
  const { data: story, error } = await supabase.from("stories").insert({ family_id: familyId, title, content, place_name: placeName, date_precision: parsedDate.precision, date_start: parsedDate.start, date_end: parsedDate.end, date_display: parsedDate.display, date_is_uncertain: parsedDate.uncertain, created_by: user.id, updated_by: user.id }).select("id").single();
  if (error || !story) redirect(`/families/${familyId}/stories/new?error=create-failed`);

  const linkResults = await Promise.all([
    personIds.length ? supabase.from("story_people").insert(personIds.map((personId) => ({ family_id: familyId, story_id: story.id, person_id: personId }))) : Promise.resolve({ error: null }),
    eventIds.length ? supabase.from("story_events").insert(eventIds.map((eventId) => ({ family_id: familyId, story_id: story.id, event_id: eventId }))) : Promise.resolve({ error: null }),
  ]);
  if (linkResults.some((result) => result.error)) {
    await supabase.from("stories").delete().eq("id", story.id).eq("family_id", familyId);
    redirect(`/families/${familyId}/stories/new?error=create-failed`);
  }
  redirect(`/families/${familyId}/stories/${story.id}?created=1`);
}

export async function updateStory(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const storyId = String(formData.get("storyId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const editPath = `/families/${familyId}/stories/${storyId}/edit`;
  if (!familyId || !storyId || !title || !content) redirect(`${editPath}?error=missing-content`);
  const parsedDate = parseDate(formData);
  if (!parsedDate) redirect(`${editPath}?error=invalid-date`);

  const personIds = selectedIds(formData, "personIds");
  const eventIds = selectedIds(formData, "eventIds");
  const { supabase, user } = await getEditor(familyId);
  const [oldPeopleResult, oldEventsResult] = await Promise.all([
    supabase.from("story_people").select("person_id").eq("family_id", familyId).eq("story_id", storyId),
    supabase.from("story_events").select("event_id").eq("family_id", familyId).eq("story_id", storyId),
  ]);
  const oldPeople = (oldPeopleResult.data ?? []).map((row) => row.person_id);
  const oldEvents = (oldEventsResult.data ?? []).map((row) => row.event_id);

  const { error } = await supabase.from("stories").update({
    title,
    content,
    place_name: String(formData.get("placeName") ?? "").trim() || null,
    date_precision: parsedDate.precision,
    date_start: parsedDate.start,
    date_end: parsedDate.end,
    date_display: parsedDate.display,
    date_is_uncertain: parsedDate.uncertain,
    updated_by: user.id,
  }).eq("id", storyId).eq("family_id", familyId);
  if (error) redirect(`${editPath}?error=update-failed`);

  const deleteResults = await Promise.all([
    supabase.from("story_people").delete().eq("family_id", familyId).eq("story_id", storyId),
    supabase.from("story_events").delete().eq("family_id", familyId).eq("story_id", storyId),
  ]);
  if (deleteResults.some((result) => result.error)) redirect(`${editPath}?error=update-failed`);

  const linkResults = await Promise.all([
    personIds.length ? supabase.from("story_people").insert(personIds.map((personId) => ({ family_id: familyId, story_id: storyId, person_id: personId }))) : Promise.resolve({ error: null }),
    eventIds.length ? supabase.from("story_events").insert(eventIds.map((eventId) => ({ family_id: familyId, story_id: storyId, event_id: eventId }))) : Promise.resolve({ error: null }),
  ]);
  if (linkResults.some((result) => result.error)) {
    await Promise.all([
      supabase.from("story_people").delete().eq("family_id", familyId).eq("story_id", storyId),
      supabase.from("story_events").delete().eq("family_id", familyId).eq("story_id", storyId),
    ]);
    await Promise.all([
      oldPeople.length ? supabase.from("story_people").insert(oldPeople.map((personId) => ({ family_id: familyId, story_id: storyId, person_id: personId }))) : Promise.resolve({ error: null }),
      oldEvents.length ? supabase.from("story_events").insert(oldEvents.map((eventId) => ({ family_id: familyId, story_id: storyId, event_id: eventId }))) : Promise.resolve({ error: null }),
    ]);
    redirect(`${editPath}?error=update-failed`);
  }

  redirect(`/families/${familyId}/stories/${storyId}?updated=1`);
}

export async function deleteStory(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const storyId = String(formData.get("storyId") ?? "").trim();
  if (!familyId || !storyId) redirect(`/families/${familyId}?error=delete-failed`);
  const { supabase } = await getEditor(familyId);
  const { error } = await supabase.from("stories").delete().eq("id", storyId).eq("family_id", familyId);
  if (error) redirect(`/families/${familyId}/stories/${storyId}?error=delete-failed`);
  redirect(`/families/${familyId}?storyDeleted=1`);
}
