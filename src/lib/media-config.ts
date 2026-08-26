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
