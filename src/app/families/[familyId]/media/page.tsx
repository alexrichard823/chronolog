import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaPreview } from "@/components/media-preview";
import { createSignedMediaMap, formatFileSize, type MediaRecord } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ mediaDeleted?: string; warning?: string; error?: string }>;
};

export default async function MediaLibraryPage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const { mediaDeleted, warning, error: errorCode } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, mediaResult, membershipResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("media_items").select("id, title, description, media_type, storage_path, original_filename, mime_type, file_size_bytes, date_captured, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(60),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (familyResult.error || !familyResult.data) notFound();
  const media = (mediaResult.data ?? []) as MediaRecord[];
  const imagePaths = media.filter((item) => item.media_type === "image").map((item) => item.storage_path);
  const signedByPath = await createSignedMediaMap(imagePaths);
  const canEdit = Boolean(membershipResult.data && ["owner", "admin", "editor"].includes(membershipResult.data.role));

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <Link href={`/families/${familyId}`} className="text-sm underline">Back to {familyResult.data.name}</Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium uppercase tracking-wide text-gray-500">Private family archive</p><h1 className="mt-1 text-3xl font-semibold">Media</h1><p className="mt-2 text-gray-600">Photos, recordings, videos, and documents connected to your family history.</p></div>
        {canEdit && <Link href={`/families/${familyId}/media/new`} className="rounded bg-black px-4 py-2 text-center text-white">Add Media</Link>}
      </div>

      {mediaDeleted === "1" && <p className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Media deleted successfully.</p>}
      {warning === "storage-cleanup" && <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The media record was deleted, but the private file could not be cleaned up from storage automatically. The file is no longer visible in Chronolog.</p>}
      {errorCode === "delete-failed" && <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">We could not delete that media item.</p>}
      {mediaResult.error && <p className="mt-8 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">We could not load the media library.</p>}

      {media.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border">
              {item.media_type === "image" ? <div className="p-3 pb-0"><MediaPreview mediaType="image" signedUrl={signedByPath.get(item.storage_path) ?? null} title={item.title} compact /></div> : <div className="flex h-36 items-center justify-center bg-gray-50 text-sm font-medium uppercase tracking-wide text-gray-500">{item.media_type}</div>}
              <div className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.media_type} · {formatFileSize(item.file_size_bytes)}</p><h2 className="mt-1 text-lg font-semibold"><Link className="underline" href={`/families/${familyId}/media/${item.id}`}>{item.title}</Link></h2>{item.date_captured && <p className="mt-1 text-sm text-gray-500">{item.date_captured}</p>}{item.description && <p className="mt-2 line-clamp-3 text-sm text-gray-700">{item.description}</p>}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border p-8 text-center"><h2 className="text-lg font-semibold">No media yet</h2><p className="mt-2 text-gray-600">Start with a meaningful photograph, family interview, home video, or document.</p>{canEdit && <Link href={`/families/${familyId}/media/new`} className="mt-5 inline-block rounded bg-black px-4 py-2 text-white">Upload the first item</Link>}</div>
      )}
    </main>
  );
}
