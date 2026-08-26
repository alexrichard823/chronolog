"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = { token: string };

export function InvitationPasswordForm({ token }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 12) {
      setMessage("Use at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace(`/invitations/accept?token=${encodeURIComponent(token)}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Create password</label>
        <input id="password" type="password" minLength={12} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm password</label>
        <input id="confirmPassword" type="password" minLength={12} required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded border px-3 py-2" />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded bg-black px-4 py-3 font-medium text-white disabled:opacity-50">{loading ? "Saving password…" : "Save password and continue"}</button>
      {message && <p className="text-sm text-red-700">{message}</p>}
    </form>
  );
}
