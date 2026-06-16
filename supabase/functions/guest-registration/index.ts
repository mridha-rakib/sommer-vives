import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 6;
}

function generateCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashCode(userId: string, email: string, code: string) {
  const pepper = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return sha256(`${pepper}:${userId}:${email}:${code}`);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Backend auth is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sendVerificationCodeEmail(to: string, code: string) {
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
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:32px;margin-bottom:4px;">☀️</div>
      <h1 style="color:#1a3a2a;font-size:20px;margin:0;font-weight:700;letter-spacing:0.5px;">SOMMERVIBES</h1>
      <p style="color:#6b7c6e;font-size:11px;margin:4px 0 0;letter-spacing:1px;">GUEST PORTAL</p>
    </div>
    <div style="background:#f8f6f2;border:1px solid #e8e4dc;border-radius:16px;padding:28px;text-align:center;">
      <h2 style="color:#1a3a2a;font-size:22px;margin:0 0 10px;">Verify your email</h2>
      <p style="color:#6b7c6e;font-size:14px;line-height:1.5;margin:0 0 24px;">Enter this code in SommerVibes to activate your guest account. The code expires in ${CODE_TTL_MINUTES} minutes.</p>
      <div style="display:inline-block;background:#ffffff;border:1px solid #d8d2c6;border-radius:12px;padding:16px 24px;color:#c4943a;font-size:30px;font-weight:700;letter-spacing:8px;font-family:monospace;">${safeCode}</div>
    </div>
    <p style="color:#8a9e8f;font-size:12px;line-height:1.5;text-align:center;margin:24px 0 0;">If you did not create a SommerVibes guest account, you can ignore this email.<br>${siteUrl}</p>
  </div>
</body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: `Your SommerVibes verification code: ${code}`,
      html,
      text: [
        "SommerVibes guest account verification",
        `Your verification code is: ${code}`,
        `The code expires in ${CODE_TTL_MINUTES} minutes.`,
        "If you did not create a SommerVibes guest account, you can ignore this email.",
      ].join("\n"),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[GUEST-REGISTRATION] Resend error:", JSON.stringify(data));
    throw new Error(data.message || "Unable to send verification code");
  }
}

async function findProfileByEmail(supabase: ReturnType<typeof getAdminClient>, email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; email: string; full_name: string | null } | null;
}

async function ensureGuestRecords(supabase: ReturnType<typeof getAdminClient>, userId: string, email: string, fullName?: string) {
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (profileError) throw profileError;

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "guest" }, { onConflict: "user_id,role" });
  if (roleError) throw roleError;
}

async function createAndSendCode(supabase: ReturnType<typeof getAdminClient>, userId: string, email: string) {
  const code = generateCode();
  const codeHash = await hashCode(userId, email, code);

  await supabase
    .from("guest_email_verification_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null);

  const { error: insertError } = await supabase.from("guest_email_verification_codes").insert({
    user_id: userId,
    email,
    code_hash: codeHash,
    expires_at: addMinutes(CODE_TTL_MINUTES),
  });
  if (insertError) throw insertError;

  await sendVerificationCodeEmail(email, code);
}

async function requestSignup(body: JsonRecord) {
  if (!isEmail(body.email)) return json({ error: "Enter a valid email address" }, 400);
  if (!isPassword(body.password)) return json({ error: "Password must be at least 6 characters" }, 400);

  const email = normalizeEmail(body.email);
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const supabase = getAdminClient();
  const existingProfile = await findProfileByEmail(supabase, email);

  let userId = existingProfile?.id;

  if (userId) {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    if (data.user?.email_confirmed_at || data.user?.confirmed_at) {
      return json({ error: "An account with this email already exists. Please log in." }, 409);
    }
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: body.password,
      user_metadata: { full_name: fullName, account_type: "guest" },
    });
    if (updateError) throw updateError;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: false,
      user_metadata: { full_name: fullName, account_type: "guest" },
    });
    if (error) throw error;
    userId = data.user?.id;
  }

  if (!userId) throw new Error("Unable to create guest account");
  await ensureGuestRecords(supabase, userId, email, fullName);
  await createAndSendCode(supabase, userId, email);
  return json({ success: true });
}

async function resendCode(body: JsonRecord) {
  if (!isEmail(body.email)) return json({ error: "Enter a valid email address" }, 400);

  const email = normalizeEmail(body.email);
  const supabase = getAdminClient();
  const profile = await findProfileByEmail(supabase, email);

  if (profile?.id) {
    const { data, error } = await supabase.auth.admin.getUserById(profile.id);
    if (error) throw error;
    if (!data.user?.email_confirmed_at && !data.user?.confirmed_at) {
      await ensureGuestRecords(supabase, profile.id, email, profile.full_name || undefined);
      await createAndSendCode(supabase, profile.id, email);
    }
  }

  return json({ success: true });
}

async function verifyCode(body: JsonRecord) {
  if (!isEmail(body.email)) return json({ error: "Enter a valid email address" }, 400);
  if (typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) {
    return json({ error: "Enter the 6-digit code from your email" }, 400);
  }

  const email = normalizeEmail(body.email);
  const supabase = getAdminClient();
  const profile = await findProfileByEmail(supabase, email);
  if (!profile?.id) return json({ error: "Invalid or expired code" }, 400);

  const { data: record, error: recordError } = await supabase
    .from("guest_email_verification_codes")
    .select("id, user_id, code_hash, attempts")
    .eq("user_id", profile.id)
    .eq("email", email)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recordError) throw recordError;
  if (!record) return json({ error: "Invalid or expired code" }, 400);
  if ((record.attempts ?? 0) >= MAX_ATTEMPTS) return json({ error: "Too many attempts. Request a new code." }, 429);

  const submittedHash = await hashCode(profile.id, email, body.code);
  if (submittedHash !== record.code_hash) {
    await supabase
      .from("guest_email_verification_codes")
      .update({ attempts: (record.attempts ?? 0) + 1 })
      .eq("id", record.id);
    return json({ error: "Invalid or expired code" }, 400);
  }

  await supabase
    .from("guest_email_verification_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", record.id);

  const { error: confirmError } = await supabase.auth.admin.updateUserById(profile.id, { email_confirm: true });
  if (confirmError) throw confirmError;

  await ensureGuestRecords(supabase, profile.id, email, profile.full_name || undefined);
  return json({ success: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "request_signup") return await requestSignup(body);
    if (body.action === "resend") return await resendCode(body);
    if (body.action === "verify") return await verifyCode(body);
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    console.error("[GUEST-REGISTRATION]", message);
    return json({ error: message }, 500);
  }
});