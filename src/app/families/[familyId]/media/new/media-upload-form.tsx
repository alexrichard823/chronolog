"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET, type MediaType } from "@/lib/media";

type Option = { id: string; label: string };

type MediaUploadFormProps = {
  familyId: string;
  people: Option[];
  events: Option[];
  stories: Option[];
  defaultPersonId?: string;
  defaultEventId?: string;
  defaultStoryId?: string;
};

type FileConfig = {
  mediaType: MediaType;
  extension: string;
  mimeType: string;
  maxBytes: number;
};

const MB = 1024 * 1024;
const MIME_CONFIG: Record<string, Omit<FileConfig, "mimeType">> = {
  "image/jpeg": { mediaType: "image", extension: "jpg", maxBytes: 10 * MB },
  "image/png": { mediaType: "image", extension: "png", maxBytes: 10 * MB },
  "image/webp": { mediaType: "image", extension: "webp", maxBytes: 10 * MB },
  "audio/mpeg": { mediaType: "audio", extension: "mp3", maxBytes: 25 * MB },
  "audio/mp4": { mediaType: "audio", extension: "m4a", maxBytes: 25 * MB },
  "audio/x-m4a": { mediaType: "audio", extension: "m4a", maxBytes: 25 * MB },
  "audio/wav": { mediaType: "audio", extension: "wav", maxBytes: 25 * MB },
  "audio/x-wav": { mediaType: "audio", extension: "wav", maxBytes: 25 * MB },
  "video/mp4": { mediaType: "video", extension: "mp4", maxBytes: 25 * MB },
  "video/quicktime": { mediaType: "video", extension: "mov", maxBytes: 25 * MB },
  "video/webm": { mediaType: "video", extension: "webm", maxBytes: 25 * MB },
  "application/pdf": { mediaType: "pdf", extension: "pdf", maxBytes: 10 * MB },
};

const EXTENSION_FALLBACK: Record<string, { mimeType: string; mediaType: MediaType; maxBytes: number }> = {
  jpg: { mimeType: "image/jpeg", mediaType: "image", maxBytes: 10 * MB },
  jpeg: { mimeType: "image/jpeg", mediaType: "image", maxBytes: 10 * MB },
  png: { mimeType: "image/png", mediaType: "image", maxBytes: 10 * MB },
  webp: { mimeType: "image/webp", mediaType: "image", maxBytes: 10 * MB },
  mp3: { mimeType: "audio/mpeg", mediaType: "audio", maxBytes: 25 * MB },
  m4a: { mimeType: "audio/mp4", mediaType: "audio", maxBytes: 25 * MB },
  wav: { mimeType: "audio/wav", mediaType: "audio", maxBytes: 25 * MB },
  mp4: { mimeType: "video/mp4", mediaType: "video", maxBytes: 25 * MB },
  mov: { mimeType: "video/quicktime", mediaType: "video", maxBytes: 25 * MB },
  webm: { mimeType: "video/webm", mediaType: "video", maxBytes: 25 * MB },
  pdf: { mimeType: "application/pdf", mediaType: "pdf", maxBytes: 10 * MB },
};

function resolveFileConfig(file: File): FileConfig | null {
  const direct = MIME_CONFIG[file.type];
  if (direct) return { ...direct, mimeType: file.type };

  if (file.type && file.type !== "application/octet-stream") return null;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fallback = EXTENSION_FALLBACK[extension];
  if (!fallback) return null;
  return { ...fallback, extension };
}

function selectedIds(formData: FormData, name: string) {
  return formData.getAll(name).map(String).filter(Boolean);
}

export function MediaUploadForm({
  familyId,
  people,
  events,
  stories,
  defaultPersonId,
  defaultEventId,
  defaultStoryId,
}: MediaUploadFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fileValue = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const dateCaptured = String(formData.get("dateCaptured") ?? "").trim() || null;

    setError(null);
    setStatus(null);

    if (!(fileValue instanceof File) || fileValue.size === 0) {
      setError("Choose a file to upload.");
      return;
    }
    if (!title) {
      setError("Enter a title for this media item.");
      return;
    }
    if (fileValue.name.length > 255) {
      setError("The file name is too long. Rename the file and try again.");
      return;
    }

    const config = resolveFileConfig(fileValue);
    if (!config) {
      setError("Unsupported file type. Use JPG, PNG, WebP, MP3, M4A, WAV, MP4, MOV, WebM, or PDF.");
      return;
    }
    if (fileValue.size > config.maxBytes) {
      const maxMb = config.maxBytes / MB;
      setError(`${config.mediaType === "pdf" ? "PDF" : config.mediaType[0].toUpperCase() + config.mediaType.slice(1)} files must be ${maxMb} MB or smaller.`);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const mediaId = crypto.randomUUID();
    const storagePath = `${familyId}/${mediaId}/media.${config.extension}`;

    try {
      setStatus("Uploading file...");
      const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, fileValue, {
        cacheControl: "3600",
        contentType: config.mimeType,
        upsert: false,
      });
      if (uploadError) throw new Error("upload");

      setStatus("Saving media details...");
      const { error: mediaError } = await supabase.from("media_items").insert({
        id: mediaId,
        family_id: familyId,
        title,
        description,
        media_type: config.mediaType,
        storage_path: storagePath,
        original_filename: fileValue.name,
        mime_type: config.mimeType,
        file_size_bytes: fileValue.size,
        date_captured: dateCaptured,
      });

      if (mediaError) {
        await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
        throw new Error("metadata");
      }

      const personIds = selectedIds(formData, "personIds");
      const eventIds = selectedIds(formData, "eventIds");
      const storyIds = selectedIds(formData, "storyIds");

      const linkResults = await Promise.all([
        personIds.length
          ? supabase.from("media_people").insert(personIds.map((personId) => ({ family_id: familyId, media_id: mediaId, person_id: personId })))
          : Promise.resolve({ error: null }),
        eventIds.length
          ? supabase.from("media_events").insert(eventIds.map((eventId) => ({ family_id: familyId, media_id: mediaId, event_id: eventId })))
          : Promise.resolve({ error: null }),
        storyIds.length
          ? supabase.from("media_stories").insert(storyIds.map((storyId) => ({ family_id: familyId, media_id: mediaId, story_id: storyId })))
          : Promise.resolve({ error: null }),
      ]);

      if (linkResults.some((result) => result.error)) {
        await supabase.from("media_items").delete().eq("id", mediaId).eq("family_id", familyId);
        await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
        throw new Error("links");
      }

      setStatus("Upload complete.");
      router.push(`/families/${familyId}/media/${mediaId}?created=1`);
      router.refresh();
    } catch {
      setError("We could not save this media item. Check your connection and try again.");
      setStatus(null);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {status && <p className="rounded border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">{status}</p>}

      <div>
        <label htmlFor="file" className="block text-sm font-medium">File</label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".jpg,.jpeg,.png,.webp,.mp3,.m4a,.wav,.mp4,.mov,.webm,.pdf"
          className="mt-2 block w-full rounded border px-3 py-2 text-sm"
        />
        <p className="mt-2 text-xs text-gray-500">Images and PDFs: up to 10 MB. Audio and video: up to 25 MB.</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium">Title</label>
        <input id="title" name="title" required maxLength={200} className="mt-2 w-full rounded border px-3 py-2" placeholder="e.g. Grandparents on their wedding day" />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea id="description" name="description" rows={4} className="mt-2 w-full rounded border px-3 py-2" placeholder="Add context, names, or why this file matters." />
      </div>

      <div>
        <label htmlFor="dateCaptured" className="block text-sm font-medium">Date captured or created</label>
        <input id="dateCaptured" name="dateCaptured" type="date" className="mt-2 w-full rounded border px-3 py-2" />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">People shown or heard</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {people.map((person) => (
            <label key={person.id} className="flex items-center gap-2 rounded border p-3 text-sm">
              <input type="checkbox" name="personIds" value={person.id} defaultChecked={person.id === defaultPersonId} />
              {person.label}
            </label>
          ))}
        </div>
        {people.length === 0 && <p className="mt-2 text-sm text-gray-500">No people have been added yet.</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Related events</legend>
        <div className="mt-3 space-y-2">
          {events.map((item) => (
            <label key={item.id} className="flex items-center gap-2 rounded border p-3 text-sm">
              <input type="checkbox" name="eventIds" value={item.id} defaultChecked={item.id === defaultEventId} />
              {item.label}
            </label>
          ))}
        </div>
        {events.length === 0 && <p className="mt-2 text-sm text-gray-500">No events have been added yet.</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Related stories</legend>
        <div className="mt-3 space-y-2">
          {stories.map((item) => (
            <label key={item.id} className="flex items-center gap-2 rounded border p-3 text-sm">
              <input type="checkbox" name="storyIds" value={item.id} defaultChecked={item.id === defaultStoryId} />
              {item.label}
            </label>
          ))}
        </div>
        {stories.length === 0 && <p className="mt-2 text-sm text-gray-500">No stories have been added yet.</p>}
      </fieldset>

      <button type="submit" disabled={submitting} className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? "Uploading..." : "Upload media"}
      </button>
    </form>
  );
}
