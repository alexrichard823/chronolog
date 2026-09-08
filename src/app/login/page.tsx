"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { safeInternalPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const nextPath = safeInternalPath(new URLSearchParams(window.location.search).get("next"));
    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-950">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-surface p-6 shadow-sm sm:p-10">
        <div className="family-brand mb-6 w-full justify-center">
          <span className="family-brand-mark" aria-hidden="true">C</span>
          <span>Chronolog</span>
        </div>
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight">Log in</h1>
        <p className="mb-8 text-center leading-6 text-gray-600">
          New to Chronolog? <Link href="/register" className="font-medium text-primary underline underline-offset-4 hover:text-primary-hover">Create an account</Link>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field htmlFor="email" label="Email">
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field htmlFor="password" label="Password">
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          <div className="text-right">
            <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 hover:text-primary-hover">Forgot password?</Link>
          </div>
          <Button type="submit" disabled={loading} size="lg" className="ui-button-feedback w-full">
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>
        {message && <p className="mt-4 break-words text-sm leading-6 text-gray-600">{message}</p>}
      </div>
    </main>
  );
}
