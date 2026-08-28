/* eslint-disable @next/next/no-img-element */

import type { MediaType } from "@/lib/media";

type MediaPreviewProps = {
  mediaType: MediaType;
  signedUrl: string | null;
  title: string;
  compact?: boolean;
};

export function MediaPreview({ mediaType, signedUrl, title, compact = false }: MediaPreviewProps) {
  if (!signedUrl) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-gray-50 text-sm text-gray-500 ${compact ? "h-36" : "min-h-64"}`}>
        Preview unavailable
      </div>
    );
  }

  if (mediaType === "image") {
    return (
      <img
        src={signedUrl}
        alt={title}
        className={`w-full rounded-lg border object-contain ${compact ? "h-36 bg-gray-50" : "max-h-[70vh] bg-gray-50"}`}
      />
    );
  }

  if (mediaType === "audio") {
    return (
      <div className="rounded-lg border bg-gray-50 p-4">
        <audio controls preload="metadata" className="w-full" src={signedUrl}>
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <video controls preload="metadata" className={`w-full rounded-lg border bg-black ${compact ? "max-h-56" : "max-h-[70vh]"}`} src={signedUrl}>
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <div className="space-y-3">
      <iframe
        title={`${title} PDF preview`}
        src={signedUrl}
        className={`w-full rounded-lg border bg-white ${compact ? "h-56" : "h-[70vh]"}`}
      />
      <a href={signedUrl} target="_blank" rel="noreferrer" className="inline-block text-sm underline">
        Open PDF in a new tab
      </a>
    </div>
  );
}
