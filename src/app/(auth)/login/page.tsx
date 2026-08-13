import Link from "next/link";
import { login } from "@/lib/auth/actions";
import {
  AuthForm,
  type AuthSearchParams,
  buttonClassName,
  inputClassName,
} from "../auth-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login"> & { searchParams: AuthSearchParams }) {
  const { error, message, next } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold text-stone-950">Welcome back</h1>
      <p className="mt-2 text-sm text-stone-600">
        Sign in to continue to your private family archive.
      </p>
      <AuthForm action={login} error={error} message={message}>
        <input type="hidden" name="next" value={next ?? "/families"} />
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
        <label className="block text-sm font-medium text-stone-800">
          Password
          <input
            className={inputClassName}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm underline">
            Forgot your password?
          </Link>
        </div>
        <button className={buttonClassName} type="submit">
          Sign in
        </button>
      </AuthForm>
      <p className="mt-6 text-center text-sm text-stone-600">
        New to Chronolog?{" "}
        <Link href="/register" className="font-medium text-stone-950 underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
