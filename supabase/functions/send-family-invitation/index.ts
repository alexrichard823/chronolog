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

type DeliveryContext = {
  normalized_email: string;
  invitation_status: string;
  expires_at: string;
  token_matches: boolean;
  inviter_is_owner: boolean;
  target_account_exists: boolean;
  target_has_password: boolean;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // The gateway verifies the JWT. We intentionally do not duplicate family-role
  // authorization from that JWT here. The database already authorizes invitation
  // creation, and the unguessable raw invitation token is verified below.
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Function configuration is incomplete" }, 500);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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

  const suppliedTokenHash = await sha256Hex(rawToken);
  const { data: contextRows, error: contextError } = await adminClient.rpc("get_invitation_delivery_context", {
    target_invitation_id: invitationId,
    supplied_token_hash: suppliedTokenHash,
  });
  const context = ((contextRows ?? []) as DeliveryContext[])[0];

  if (contextError) {
    console.error("Invitation delivery context lookup failed", { code: contextError.code, message: contextError.message });
    return json({ error: "Invitation delivery context unavailable" }, 500);
  }
  if (!context) return json({ error: "Invitation not found" }, 404);
  if (!context.token_matches) return json({ error: "Invitation token mismatch" }, 403);
  if (context.invitation_status !== "pending" || new Date(context.expires_at).getTime() <= Date.now()) {
    return json({ error: "Invitation is no longer sendable" }, 403);
  }
  if (!context.inviter_is_owner) return json({ error: "The invitation is no longer authorized by the family Owner" }, 403);

  const encodedToken = encodeURIComponent(rawToken);
  const setupRequired = !context.target_has_password;
  const redirect = `${origin}/invitations/auth?token=${encodedToken}${setupRequired ? "&new=1" : ""}`;

  if (context.target_account_exists) {
    // Existing Auth users receive a secure OTP/magic-link sign-in. Accounts that
    // exist without a password still route through invitation setup afterward.
    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error: magicLinkError } = await publicClient.auth.signInWithOtp({
      email: context.normalized_email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirect,
      },
    });

    if (magicLinkError) {
      console.error("Existing-user invitation email failed", { code: magicLinkError.code, status: magicLinkError.status, message: magicLinkError.message });
      return json({ error: "Existing-user invitation email failed" }, 502);
    }
    return json({ delivered: true, account: "existing" });
  }

  // Brand-new recipients use Supabase's invite flow so their email is confirmed
  // and they are routed into Chronolog password setup before accepting the family.
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(context.normalized_email, {
    redirectTo: `${origin}/invitations/auth?token=${encodedToken}&new=1`,
  });

  if (inviteError) {
    console.error("New-user invitation email failed", { code: inviteError.code, status: inviteError.status, message: inviteError.message });
    return json({ error: "New-user invitation email failed" }, 502);
  }

  return json({ delivered: true, account: "new" });
});
