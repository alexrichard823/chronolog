import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvitationPasswordForm } from "./password-form";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

type PreviewRow = { family_name: string; role: string; email_matches: boolean };

export default async function InvitationSetupPage({ searchParams }: Props) {
  const { token = "" } = await searchParams;
  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-xl border p-8">
          <h1 className="text-3xl font-semibold">Invitation unavailable</h1>
          <p className="mt-3 text-gray-600">This invitation link is incomplete or no longer valid.</p>
          <Link href="/login" className="mt-6 inline-block rounded border px-4 py-2">Go to login</Link>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invitations/setup?token=${encodeURIComponent(token)}`)}`);

  const { data, error } = await supabase.rpc("preview_family_invitation", { raw_token: token });
  const preview = ((data ?? []) as PreviewRow[])[0];
  if (error || !preview || !preview.email_matches) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-xl border p-8">
          <h1 className="text-3xl font-semibold">Invitation unavailable</h1>
          <p className="mt-3 text-gray-600">This invitation is invalid, expired, revoked, already used, or belongs to another email address.</p>
          <Link href="/families" className="mt-6 inline-block rounded border px-4 py-2">Go to your families</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-xl border p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Chronolog invitation</p>
        <h1 className="mt-2 text-3xl font-semibold">Finish creating your account</h1>
        <p className="mt-3 text-gray-600">Your email is confirmed. Create a password so you can sign in to Chronolog normally after joining <strong>{preview.family_name}</strong>.</p>
        <p className="mt-3 text-sm text-gray-500">Signed in as {user.email}</p>
        <InvitationPasswordForm token={token} />
      </section>
    </main>
  );
}
