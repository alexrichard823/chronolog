import { redirect } from "next/navigation";
import { updatePassword } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import {
  AuthForm,
  type AuthSearchParams,
  buttonClassName,
  inputClassName,
} from "../auth-form";

export default async function UpdatePasswordPage({
  searchParams,
}: PageProps<"/update-password"> & { searchParams: AuthSearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?error=Your+reset+link+is+invalid+or+expired.+Request+a+new+one.");
  }

  const { error } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold text-stone-950">Choose a new password</h1>
      <p className="mt-2 text-sm text-stone-600">
        Use a unique password with at least 12 characters.
      </p>
      <AuthForm action={updatePassword} error={error}>
        <label className="block text-sm font-medium text-stone-800">
          New password
          <input className={inputClassName} name="password" type="password" autoComplete="new-password" minLength={12} required />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Confirm new password
          <input className={inputClassName} name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} required />
        </label>
        <button className={buttonClassName} type="submit">Update password</button>
      </AuthForm>
    </>
  );
}
