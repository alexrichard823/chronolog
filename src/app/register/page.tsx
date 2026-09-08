"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { safeInternalPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui";

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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-950">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm sm:p-10">
        <div className="family-brand mb-6 w-full justify-center">
          <span className="family-brand-mark" aria-hidden="true">C</span>
          <span>Chronolog</span>
        </div>
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mb-8 text-center leading-6 text-gray-600">
          Already have an account? <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary-hover">Log in</Link>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field htmlFor="email" label="Email">
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field htmlFor="password" label="Password">
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} />
          </Field>
          <Button type="submit" disabled={loading} size="lg" className="ui-button-feedback w-full">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        {message && (
          <div className="mt-4 space-y-2 break-words text-sm leading-6 text-gray-600">
            <p>{message}</p>
            {existingAccount && (
              <Link href="/login" className="inline-block font-medium text-primary underline underline-offset-4 hover:text-primary-hover">Go to login</Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
