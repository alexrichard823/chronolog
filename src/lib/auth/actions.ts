"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, safeRedirectPath } from "@/lib/auth/redirects";

const MINIMUM_PASSWORD_LENGTH = 12;

function value(formData: FormData, field: string) {
  const entry = formData.get(field);
  return typeof entry === "string" ? entry : "";
}

function withMessage(path: string, type: "error" | "message", message: string) {
  const params = new URLSearchParams({ [type]: message });
  return `${path}?${params.toString()}`;
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string, confirmation?: string) {
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }
  if (confirmation !== undefined && password !== confirmation) {
    return "Passwords do not match.";
  }
}

export async function register(formData: FormData) {
  const email = value(formData, "email").trim().toLowerCase();
  const password = value(formData, "password");
  const passwordConfirmation = value(formData, "passwordConfirmation");

  if (!validEmail(email)) {
    redirect(withMessage("/register", "error", "Enter a valid email address."));
  }

  const passwordError = validatePassword(password, passwordConfirmation);
  if (passwordError) {
    redirect(withMessage("/register", "error", passwordError));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/families`,
    },
  });

  if (error) {
    redirect(
      withMessage(
        "/register",
        "error",
        "We could not create your account. Please try again.",
      ),
    );
  }

  redirect(
    withMessage(
      "/login",
      "message",
      "Check your email and confirm your account before signing in.",
    ),
  );
}

export async function login(formData: FormData) {
  const email = value(formData, "email").trim().toLowerCase();
  const password = value(formData, "password");
  const next = safeRedirectPath(value(formData, "next"));

  if (!validEmail(email) || !password) {
    redirect(withMessage("/login", "error", "Enter your email and password."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      withMessage("/login", "error", "The email or password is incorrect."),
    );
  }

  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, "email").trim().toLowerCase();

  if (!validEmail(email)) {
    redirect(
      withMessage("/forgot-password", "error", "Enter a valid email address."),
    );
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/update-password`,
  });

  redirect(
    withMessage(
      "/forgot-password",
      "message",
      "If an account exists for that email, password reset instructions are on the way.",
    ),
  );
}

export async function updatePassword(formData: FormData) {
  const password = value(formData, "password");
  const passwordConfirmation = value(formData, "passwordConfirmation");
  const passwordError = validatePassword(password, passwordConfirmation);

  if (passwordError) {
    redirect(withMessage("/update-password", "error", passwordError));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      withMessage(
        "/forgot-password",
        "error",
        "Your reset link is invalid or expired. Request a new one.",
      ),
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(
      withMessage(
        "/update-password",
        "error",
        "We could not update your password. Request a new reset link and try again.",
      ),
    );
  }

  redirect(
    withMessage("/families", "message", "Your password has been updated."),
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
