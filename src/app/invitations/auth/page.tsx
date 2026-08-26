"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default function InvitationAuthBridgePage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing your secure sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const isNewAccount = params.get("new") === "1";
      if (!token) {
        router.replace("/invitations/accept?error=invalid");
        return;
      }

      const implicitClient = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          auth: {
            flowType: "implicit",
            detectSessionInUrl: true,
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

      const { data: { session }, error } = await implicitClient.auth.getSession();
      if (cancelled) return;

      if (error || !session) {
        setMessage("We could not complete the email sign-in. Open the invitation again or sign in manually.");
        return;
      }

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

      const cookieClient = createBrowserClient();
      const { error: cookieError } = await cookieClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (cancelled) return;
      if (cookieError) {
        setMessage("We could not finish setting up your Chronolog session. Please sign in manually.");
        return;
      }

      const destination = isNewAccount
        ? `/invitations/setup?token=${encodeURIComponent(token)}`
        : `/invitations/accept?token=${encodeURIComponent(token)}`;
      router.replace(destination);
      router.refresh();
    }

    void finishSignIn();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-xl border p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Chronolog invitation</p>
        <h1 className="mt-2 text-2xl font-semibold">Secure sign-in</h1>
        <p className="mt-4 text-gray-600">{message}</p>
      </section>
    </main>
  );
}
