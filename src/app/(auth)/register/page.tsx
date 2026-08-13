import Link from "next/link";
import { register } from "@/lib/auth/actions";
import {
  AuthForm,
  type AuthSearchParams,
  buttonClassName,
  inputClassName,
} from "../auth-form";

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register"> & { searchParams: AuthSearchParams }) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold text-stone-950">Create your account</h1>
      <p className="mt-2 text-sm text-stone-600">
        Start a private place for your family&apos;s history.
      </p>
      <AuthForm action={register} error={error}>
        <label className="block text-sm font-medium text-stone-800">
          Email address
          <input className={inputClassName} name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Password
          <input className={inputClassName} name="password" type="password" autoComplete="new-password" minLength={12} required />
          <span className="mt-1 block text-xs font-normal text-stone-500">Use at least 12 characters.</span>
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Confirm password
          <input className={inputClassName} name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} required />
        </label>
        <button className={buttonClassName} type="submit">Create account</button>
      </AuthForm>
      <p className="mt-6 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-stone-950 underline">Sign in</Link>
      </p>
    </>
  );
}
