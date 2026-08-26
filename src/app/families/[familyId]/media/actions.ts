"use server";

import { redirect } from "next/navigation";
import { MEDIA_BUCKET } from "@/lib/media-config";
import { createClient } from "@/lib/supabase/server";

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

export async function updateMedia(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const mediaId = String(formData.get("mediaId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const editPath = `/families/${familyId}/media/${mediaId}/edit`;
  if (!familyId || !mediaId || !title) redirect(`${editPath}?error=missing-title`);

  const dateCaptured = String(formData.get("dateCaptured") ?? "").trim() || null;
  if (dateCaptured && !/^\d{4}-\d{2}-\d{2}$/.test(dateCaptured)) redirect(`${editPath}?error=invalid-date`);
  const personIds = selectedIds(formData, "personIds");
  const eventIds = selectedIds(formData, "eventIds");
  const storyIds = selectedIds(formData, "storyIds");
  const { supabase } = await getEditor(familyId);

  const [oldPeopleResult, oldEventsResult, oldStoriesResult] = await Promise.all([
    supabase.from("media_people").select("person_id").eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_events").select("event_id").eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_stories").select("story_id").eq("family_id", familyId).eq("media_id", mediaId),
  ]);
  const oldPeople = (oldPeopleResult.data ?? []).map((row) => row.person_id);
  const oldEvents = (oldEventsResult.data ?? []).map((row) => row.event_id);
  const oldStories = (oldStoriesResult.data ?? []).map((row) => row.story_id);

  const { error } = await supabase.from("media_items").update({
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    date_captured: dateCaptured,
  }).eq("id", mediaId).eq("family_id", familyId);
  if (error) redirect(`${editPath}?error=update-failed`);

  const deletes = await Promise.all([
    supabase.from("media_people").delete().eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_events").delete().eq("family_id", familyId).eq("media_id", mediaId),
    supabase.from("media_stories").delete().eq("family_id", familyId).eq("media_id", mediaId),
  ]);
  if (deletes.some((result) => result.error)) redirect(`${editPath}?error=update-failed`);

  const inserts = await Promise.all([
    personIds.length ? supabase.from("media_people").insert(personIds.map((personId) => ({ family_id: familyId, media_id: mediaId, person_id: personId }))) : Promise.resolve({ error: null }),
    eventIds.length ? supabase.from("media_events").insert(eventIds.map((eventId) => ({ family_id: familyId, media_id: mediaId, event_id: eventId }))) : Promise.resolve({ error: null }),
    storyIds.length ? supabase.from("media_stories").insert(storyIds.map((storyId) => ({ family_id: familyId, media_id: mediaId, story_id: storyId }))) : Promise.resolve({ error: null }),
  ]);

  if (inserts.some((result) => result.error)) {
    await Promise.all([
      supabase.from("media_people").delete().eq("family_id", familyId).eq("media_id", mediaId),
      supabase.from("media_events").delete().eq("family_id", familyId).eq("media_id", mediaId),
      supabase.from("media_stories").delete().eq("family_id", familyId).eq("media_id", mediaId),
    ]);
    await Promise.all([
      oldPeople.length ? supabase.from("media_people").insert(oldPeople.map((personId) => ({ family_id: familyId, media_id: mediaId, person_id: personId }))) : Promise.resolve({ error: null }),
      oldEvents.length ? supabase.from("media_events").insert(oldEvents.map((eventId) => ({ family_id: familyId, media_id: mediaId, event_id: eventId }))) : Promise.resolve({ error: null }),
      oldStories.length ? supabase.from("media_stories").insert(oldStories.map((storyId) => ({ family_id: familyId, media_id: mediaId, story_id: storyId }))) : Promise.resolve({ error: null }),
    ]);
    redirect(`${editPath}?error=update-failed`);
  }

  redirect(`/families/${familyId}/media/${mediaId}?updated=1`);
}

export async function deleteMedia(formData: FormData) {
  const familyId = String(formData.get("familyId") ?? "").trim();
  const mediaId = String(formData.get("mediaId") ?? "").trim();
  if (!familyId || !mediaId) redirect(`/families/${familyId}/media?error=delete-failed`);
  const { supabase } = await getEditor(familyId);

  const { data: media, error: loadError } = await supabase.from("media_items").select("storage_path").eq("id", mediaId).eq("family_id", familyId).maybeSingle();
  if (loadError || !media) redirect(`/families/${familyId}/media/${mediaId}?error=delete-failed`);

  const { error: deleteError } = await supabase.from("media_items").delete().eq("id", mediaId).eq("family_id", familyId);
  if (deleteError) redirect(`/families/${familyId}/media/${mediaId}?error=delete-failed`);

  const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([media.storage_path]);
  if (storageError) redirect(`/families/${familyId}/media?mediaDeleted=1&warning=storage-cleanup`);
  redirect(`/families/${familyId}/media?mediaDeleted=1`);
}
