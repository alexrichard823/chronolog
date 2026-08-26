import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptInvitation } from "./actions";

type Props = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

type PreviewRow = { family_name: string; role: string; email_matches: boolean };

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default async function InvitationAcceptancePage({ searchParams }: Props) {
  const { token = "", error: errorCode } = await searchParams;
  const invitePath = `/invitations/accept?token=${encodeURIComponent(token)}`;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!token) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="w-full max-w-lg rounded-xl border p-8"><h1 className="text-3xl font-semibold">Invitation unavailable</h1><p className="mt-3 text-gray-600">This invitation link is incomplete or no longer valid.</p><Link href="/families" className="mt-6 inline-block rounded border px-4 py-2">Go to your families</Link></section></main>;
  }

  if (!user) {
    const next = encodeURIComponent(invitePath);
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-xl border p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Chronolog invitation</p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in to continue</h1>
          <p className="mt-3 text-gray-600">Use the email address that received this invitation. After you sign in or confirm a new account, Chronolog will bring you back here.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/login?next=${next}`} className="rounded bg-black px-4 py-2 text-white">Log in</Link>
            <Link href={`/register?next=${next}`} className="rounded border px-4 py-2">Create account</Link>
          </div>
        </section>
      </main>
    );
  }

  const { data, error } = await supabase.rpc("preview_family_invitation", { raw_token: token });
  const preview = ((data ?? []) as PreviewRow[])[0];
  const invalid = Boolean(error || !preview);
  const explicitError = errorCode === "wrong-email" ? "This invitation belongs to a different email address." : errorCode === "already-member" ? "This account already belongs to the family." : errorCode === "invalid" ? "This invitation is invalid, expired, revoked, or already used." : null;

  if (invalid) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="w-full max-w-lg rounded-xl border p-8"><h1 className="text-3xl font-semibold">Invitation unavailable</h1><p className="mt-3 text-gray-600">{explicitError ?? "This invitation is invalid, expired, revoked, or already used."}</p><Link href="/families" className="mt-6 inline-block rounded border px-4 py-2">Go to your families</Link></section></main>;
  }

  if (!preview.email_matches || errorCode === "wrong-email") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-xl border p-8">
          <h1 className="text-3xl font-semibold">Wrong signed-in account</h1>
          <p className="mt-3 text-gray-600">This invitation was sent to a different email address. Sign out, then reopen the invitation using the account that received it.</p>
          <p className="mt-4 text-sm text-gray-500">You are currently signed in as {user.email}.</p>
          <Link href="/families" className="mt-6 inline-block rounded border px-4 py-2">Go to account</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-xl border p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Chronolog invitation</p>
        <h1 className="mt-2 text-3xl font-semibold">Join {preview.family_name}</h1>
        <p className="mt-3 text-gray-600">You have been invited as an <strong>{roleLabel(preview.role)}</strong>.</p>
        {explicitError && <p className="mt-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{explicitError}</p>}
        <form action={acceptInvitation} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="rounded bg-black px-5 py-3 font-medium text-white">Accept invitation</button>
        </form>
        <p className="mt-4 text-xs text-gray-500">Invitations expire after 7 days and can only be used once by the invited email address.</p>
      </section>
    </main>
  );
}
