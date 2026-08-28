import { createClient } from "npm:@supabase/supabase-js@2.112.3";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function allowedOrigin(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) return url.origin;
    if (url.protocol !== "https:") return null;
    if (
      url.hostname === "getchronolog.com" ||
      url.hostname === "www.getchronolog.com" ||
      url.hostname === "chronolog-amber.vercel.app" ||
      url.hostname.endsWith("-chronolog1.vercel.app")
    ) return url.origin;
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Function configuration is incomplete" }, 500);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const jwt = authHeader.slice("Bearer ".length);
  const { data: { user }, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !user) return json({ error: "Authentication required" }, 401);

  let payload: { invitationId?: string; rawToken?: string; origin?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const invitationId = payload.invitationId?.trim();
  const rawToken = payload.rawToken?.trim();
  const origin = payload.origin ? allowedOrigin(payload.origin) : null;
  if (!invitationId || !rawToken || rawToken.length < 20 || !origin) return json({ error: "Invalid invitation request" }, 400);

  const { data: invitation, error: invitationError } = await adminClient
    .from("invitations")
    .select("id, family_id, normalized_email, token_hash, status, expires_at, invited_by")
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError || !invitation) return json({ error: "Invitation not found" }, 404);
  if (invitation.invited_by !== user.id || invitation.status !== "pending" || new Date(invitation.expires_at).getTime() <= Date.now()) {
    return json({ error: "Invitation is no longer sendable" }, 403);
  }

  const expectedHash = await sha256Hex(rawToken);
  if (expectedHash !== invitation.token_hash) return json({ error: "Invitation token mismatch" }, 403);

  const { data: membership } = await userClient
    .from("family_memberships")
    .select("role")
    .eq("family_id", invitation.family_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) return json({ error: "Member management access required" }, 403);

  const encodedToken = encodeURIComponent(rawToken);
  const newUserRedirect = `${origin}/invitations/auth?token=${encodedToken}&new=1`;
  const existingUserRedirect = `${origin}/invitations/auth?token=${encodedToken}`;

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(invitation.normalized_email, {
    redirectTo: newUserRedirect,
  });

  if (!inviteError) return json({ delivered: true, account: "new" });

  const alreadyExists = inviteError.code === "email_exists" || inviteError.code === "user_already_exists";
  if (!alreadyExists) return json({ error: "Supabase invitation email failed" }, 502);

  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: magicLinkError } = await publicClient.auth.signInWithOtp({
    email: invitation.normalized_email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: existingUserRedirect,
    },
  });

  if (magicLinkError) return json({ error: "Existing-user invitation email failed" }, 502);
  return json({ delivered: true, account: "existing" });
});
