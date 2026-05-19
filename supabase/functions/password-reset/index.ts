import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CODE_TTL_MINUTES = 10;
const RESET_TOKEN_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const ALLOWED_ROLES = new Set(["owner", "admin", "super_admin"]);

type JsonRecord = Record<string, unknown>;

interface ResettableUser {
  id: string;
  email: string;
}

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function generateCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashSecret(value: string) {
  const pepper = Deno.env.get("PASSWORD_RESET_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return sha256(`${pepper}:${value}`);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findResettableUser(supabase: ReturnType<typeof getSupabaseAdmin>, email: string): Promise<ResettableUser | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.id || !profile.email) return null;

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", profile.id);

  if (rolesError) throw rolesError;
  if (!roles?.some((entry: { role: string }) => ALLOWED_ROLES.has(entry.role))) return null;

  return { id: profile.id, email: profile.email };
}

async function sendResetCodeEmail(to: string, code: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");

  if (!resendKey || !fromEmail) {
    throw new Error("Email service is not configured");
  }

  const safeCode = escapeHtml(code);
  const siteUrl = (Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "https://sommervibes.dk").replace(/\/+$/, "");
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;background:#ffffff;">
    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="color:#1a3a2a;font-size:22px;margin:0;font-weight:700;">SommerVibes</h1>
    </div>
    <div style="background:#f8f6f2;border:1px solid #e8e4dc;border-radius:16px;padding:28px;text-align:center;">
      <h2 style="color:#1a3a2a;font-size:22px;margin:0 0 10px;">Password reset code</h2>
      <p style="color:#6b7c6e;font-size:14px;line-height:1.5;margin:0 0 24px;">Enter this code in SommerVibes to choose a new password. The code expires in ${CODE_TTL_MINUTES} minutes.</p>
      <div style="display:inline-block;background:#ffffff;border:1px solid #d8d2c6;border-radius:12px;padding:16px 24px;color:#c4943a;font-size:30px;font-weight:700;letter-spacing:8px;font-family:monospace;">${safeCode}</div>
    </div>
    <p style="color:#8a9e8f;font-size:12px;line-height:1.5;text-align:center;margin:24px 0 0;">If you did not request this code, you can ignore this email.<br>${siteUrl}</p>
  </div>
</body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: `Your SommerVibes password reset code: ${code}`,
      html,
      text: [
        "SommerVibes password reset",
        `Your verification code is: ${code}`,
        `The code expires in ${CODE_TTL_MINUTES} minutes.`,
        "If you did not request this code, you can ignore this email.",
      ].join("\n"),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[PASSWORD-RESET] Resend error:", JSON.stringify(data));
    throw new Error(data.message || "Unable to send reset code");
  }
}

async function requestCode(body: JsonRecord) {
  if (!isEmail(body.email)) return json({ error: "Invalid email" }, 400);

  const email = normalizeEmail(body.email);
  const supabase = getSupabaseAdmin();
  const user = await findResettableUser(supabase, email);

  if (user) {
    const code = generateCode();
    const codeHash = await hashSecret(`${user.id}:${email}:${code}`);

    await supabase
      .from("password_reset_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("used_at", null);

    const { error: insertError } = await supabase.from("password_reset_codes").insert({
      user_id: user.id,
      email,
      code_hash: codeHash,
      expires_at: addMinutes(CODE_TTL_MINUTES),
    });

    if (insertError) throw insertError;
    await sendResetCodeEmail(user.email, code);
  }

  return json({ success: true });
}

async function verifyCode(body: JsonRecord) {
  if (!isEmail(body.email) || typeof body.code !== "string") {
    return json({ error: "Invalid reset code" }, 400);
  }

  const email = normalizeEmail(body.email);
  const code = body.code.trim();
  const supabase = getSupabaseAdmin();
  const user = await findResettableUser(supabase, email);

  if (!user) return json({ error: "Invalid or expired reset code" }, 400);

  const { data: reset, error: resetError } = await supabase
    .from("password_reset_codes")
    .select("id, code_hash, attempts")
    .eq("user_id", user.id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resetError) throw resetError;
  if (!reset || reset.attempts >= MAX_ATTEMPTS) {
    return json({ error: "Invalid or expired reset code" }, 400);
  }

  const candidateHash = await hashSecret(`${user.id}:${email}:${code}`);
  if (candidateHash !== reset.code_hash) {
    const attempts = Number(reset.attempts || 0) + 1;
    await supabase
      .from("password_reset_codes")
      .update({ attempts, used_at: attempts >= MAX_ATTEMPTS ? new Date().toISOString() : null })
      .eq("id", reset.id);

    return json({ error: "Invalid or expired reset code" }, 400);
  }

  const resetToken = generateToken();
  const resetTokenHash = await hashSecret(`${user.id}:${email}:${resetToken}`);
  const { error: updateError } = await supabase
    .from("password_reset_codes")
    .update({
      verified_at: new Date().toISOString(),
      reset_token_hash: resetTokenHash,
      reset_token_expires_at: addMinutes(RESET_TOKEN_TTL_MINUTES),
    })
    .eq("id", reset.id);

  if (updateError) throw updateError;
  return json({ success: true, resetToken });
}

async function completeReset(body: JsonRecord) {
  if (!isEmail(body.email) || typeof body.resetToken !== "string" || typeof body.newPassword !== "string") {
    return json({ error: "Invalid reset request" }, 400);
  }

  if (body.newPassword.length < 6) {
    return json({ error: "Password must be at least 6 characters" }, 400);
  }

  const email = normalizeEmail(body.email);
  const supabase = getSupabaseAdmin();
  const user = await findResettableUser(supabase, email);

  if (!user) return json({ error: "Invalid or expired reset request" }, 400);

  const resetTokenHash = await hashSecret(`${user.id}:${email}:${body.resetToken}`);
  const { data: reset, error: resetError } = await supabase
    .from("password_reset_codes")
    .select("id")
    .eq("user_id", user.id)
    .eq("reset_token_hash", resetTokenHash)
    .is("used_at", null)
    .not("verified_at", "is", null)
    .gt("reset_token_expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resetError) throw resetError;
  if (!reset) return json({ error: "Invalid or expired reset request" }, 400);

  const { error: updateUserError } = await supabase.auth.admin.updateUserById(user.id, {
    password: body.newPassword,
  });

  if (updateUserError) throw updateUserError;

  const { error: markUsedError } = await supabase
    .from("password_reset_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", reset.id);

  if (markUsedError) throw markUsedError;
  return json({ success: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "request") return await requestCode(body);
    if (action === "verify") return await verifyCode(body);
    if (action === "complete") return await completeReset(body);

    return json({ error: "Unknown password reset action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[PASSWORD-RESET]", message);
    return json({ error: message }, 500);
  }
});
