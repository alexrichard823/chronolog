import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/actions";
import {
  AuthForm,
  type AuthSearchParams,
  buttonClassName,
  inputClassName,
} from "../auth-form";

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password"> & { searchParams: AuthSearchParams }) {
  const { error, message } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold text-stone-950">Reset your password</h1>
      <p className="mt-2 text-sm text-stone-600">
        Enter your email and we&apos;ll send instructions if an account exists.
      </p>
      <AuthForm action={requestPasswordReset} error={error} message={message}>
        <label className="block text-sm font-medium text-stone-800">
          Email address
          <input
            className={inputClassName}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <button className={buttonClassName} type="submit">
          Send reset instructions
        </button>
      </AuthForm>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-stone-950 underline">
          Return to sign in
        </Link>
      </p>
    </>
  );
}
