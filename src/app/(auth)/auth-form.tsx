import type { ReactNode } from "react";

export type AuthSearchParams = Promise<{
  error?: string;
  message?: string;
  next?: string;
}>;

export function AuthForm({
  action,
  children,
  error,
  message,
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  error?: string;
  message?: string;
}) {
  return (
    <form action={action} className="mt-6 space-y-5">
      {message ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {error}
        </p>
      ) : null}
      {children}
    </form>
  );
}

export const inputClassName =
  "mt-2 block w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-950 shadow-sm outline-none focus:border-stone-700 focus:ring-2 focus:ring-stone-200";

export const buttonClassName =
  "flex w-full items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 font-medium text-white transition hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2";
