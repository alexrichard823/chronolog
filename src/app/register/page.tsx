"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { safeInternalPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setExistingAccount(false);

    const supabase = createClient();
    const nextPath = safeInternalPath(new URLSearchParams(window.location.search).get("next"));

    // If these exact credentials already belong to an existing account, give the
    // user a clear sign-in path instead of presenting the attempt as a new signup.
    // Checking the password avoids exposing account existence to someone who only
    // knows an email address.
    const { data: existingSession, error: existingAccountError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!existingAccountError && existingSession.user) {
      await supabase.auth.signOut();
      setExistingAccount(true);
      setMessage("An account already exists with these credentials. Log in instead.");
      setLoading(false);
      return;
    }

    const callbackUrl = `${window.location.origin}/auth/callback${nextPath === "/families" ? "" : `?next=${encodeURIComponent(nextPath)}`}`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm your account.");
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-semibold">Create your account</h1>
        <p className="mb-6 text-gray-600">
          Already have an account? <Link href="/login" className="font-medium underline">Log in</Link>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} className="w-full rounded border px-3 py-2" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        {message && (
          <div className="mt-4 space-y-2">
            <p>{message}</p>
            {existingAccount && (
              <Link href="/login" className="inline-block font-medium underline">Go to login</Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
