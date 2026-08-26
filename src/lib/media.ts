import { createClient } from "@/lib/supabase/server";

export const MEDIA_BUCKET = "family-media";
export const MEDIA_SIGNED_URL_SECONDS = 300;

export type MediaType = "image" | "audio" | "video" | "pdf";

export type MediaRecord = {
  id: string;
  title: string;
  description: string | null;
  media_type: MediaType;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  date_captured: string | null;
  created_at: string;
};

export async function createSignedMediaMap(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  const signedByPath = new Map<string, string>();
  if (uniquePaths.length === 0) return signedByPath;

  const supabase = await createClient();
  const results = await Promise.all(
    uniquePaths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(path, MEDIA_SIGNED_URL_SECONDS);
      return { path, url: error ? null : data?.signedUrl ?? null };
    })
  );

  for (const result of results) {
    if (result.url) signedByPath.set(result.path, result.url);
  }

  return signedByPath;
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
