"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function PasswordRecoveryForm({ update = false, invalid = false }: { update?: boolean; invalid?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState(invalid ? "This reset link is invalid or has expired. Request a new link and open it in the same browser." : "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setMessage("");
    if (update && (password.length < 12 || password !== confirmation)) {
      setMessage("Use at least 12 characters and make sure both passwords match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (update) {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) {
          setMessage("Your session has expired. Request a new reset link.");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setMessage(error.message);
          return;
        }
        setPassword("");
        setConfirmation("");
        setComplete(true);
        setMessage("Your password has been updated. You can now log in with your new password.");
        await supabase.auth.signOut({ scope: "local" });
      } else {
        const redirectTo = `${window.location.origin}/auth/callback?next=%2Fupdate-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (error) {
          setMessage("Unable to send a reset link right now. Please try again shortly.");
          return;
        }
        setMessage("If an account exists for that email, you’ll receive a password reset link. Check your inbox and spam folder, and open the link in this browser.");
        setComplete(true);
      }
    } catch {
      setMessage("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const linkClass = "inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 hover:text-primary-hover";
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-10">
        <div className="family-brand mb-6 w-full justify-center">
          <span className="family-brand-mark" aria-hidden="true">C</span>
          <span>Chronolog</span>
        </div>
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight">{update ? "Set a new password" : "Forgot password?"}</h1>
        <p className="mb-8 text-center leading-6 text-muted">{update ? "Choose a new password with at least 12 characters." : "Enter your account email and we’ll send you a reset link."}</p>
        {!complete && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {update ? <>
              <Field htmlFor="password" label="New password">
                <Input id="password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required />
              </Field>
              <Field htmlFor="confirmation" label="Confirm new password">
                <Input id="confirmation" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              </Field>
            </> : <Field htmlFor="email" label="Email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>}
            <Button type="submit" disabled={loading} size="lg" className="ui-button-feedback w-full">{loading ? (update ? "Saving..." : "Sending...") : (update ? "Save new password" : "Send reset link")}</Button>
          </form>
        )}
        <p role="status" className="mt-4 break-words text-sm leading-6 text-muted">{message}</p>
        {complete && !update && <Button variant="ghost" onClick={() => { setComplete(false); setMessage(""); }}>Try again or use another email</Button>}
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <Link href="/login" className={linkClass}>Back to login</Link>
          {update && !complete && <Link href="/forgot-password" className={linkClass}>Request a new link</Link>}
        </div>
      </div>
    </main>
  );
}
