import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MediaUploadForm } from "./media-upload-form";

type Props = {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ personId?: string; eventId?: string; storyId?: string }>;
};

export default async function NewMediaPage({ params, searchParams }: Props) {
  const { familyId } = await params;
  const { personId, eventId, storyId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [familyResult, membershipResult, peopleResult, eventsResult, storiesResult] = await Promise.all([
    supabase.from("families").select("id, name").eq("id", familyId).maybeSingle(),
    supabase.from("family_memberships").select("role").eq("family_id", familyId).eq("user_id", user.id).maybeSingle(),
    supabase.from("people").select("id, display_name").eq("family_id", familyId).order("display_name"),
    supabase.from("events").select("id, title, date_display").eq("family_id", familyId).order("date_start", { nullsFirst: false }),
    supabase.from("stories").select("id, title, date_display").eq("family_id", familyId).order("date_start", { nullsFirst: false }),
  ]);

  if (familyResult.error || !familyResult.data) notFound();
  if (!membershipResult.data || !["owner", "admin", "editor"].includes(membershipResult.data.role)) {
    redirect(`/families/${familyId}?error=no-edit-access`);
  }

  const people = (peopleResult.data ?? []).map((person) => ({ id: person.id, label: person.display_name }));
  const events = (eventsResult.data ?? []).map((item) => ({ id: item.id, label: `${item.title}${item.date_display ? ` — ${item.date_display}` : ""}` }));
  const stories = (storiesResult.data ?? []).map((item) => ({ id: item.id, label: `${item.title}${item.date_display ? ` — ${item.date_display}` : ""}` }));

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <Link href={`/families/${familyId}/media`} className="text-sm underline">Back to {familyResult.data.name} media</Link>
      <h1 className="mt-6 text-3xl font-semibold">Add Media</h1>
      <p className="mt-2 text-gray-600">Upload a private photo, recording, video, or PDF and connect it to the people, events, and stories it belongs to.</p>
      <MediaUploadForm
        familyId={familyId}
        people={people}
        events={events}
        stories={stories}
        defaultPersonId={personId}
        defaultEventId={eventId}
        defaultStoryId={storyId}
      />
    </main>
  );
}
