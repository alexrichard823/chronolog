import { NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeInternalPath(requestUrl.searchParams.get("next"));
  const failurePath = nextPath === "/update-password"
    ? "/forgot-password?error=invalid-link"
    : `/login?next=${encodeURIComponent(nextPath)}`;

  if (!code) {
    return NextResponse.redirect(new URL(failurePath, requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(failurePath, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
