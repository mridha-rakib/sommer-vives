import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bootstrap-secret",
};

type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function randomPassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 24);
  return `SommerVibes-${token}!`;
}

async function findUserByEmail(supabase: ReturnType<typeof createClient>, email: string) {
  const target = email.toLowerCase();

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === target);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  throw new Error("Too many auth users to scan safely");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const expectedSecret = Deno.env.get("ADMIN_BOOTSTRAP_SECRET") || Deno.env.get("AUTOMATION_RUN_SECRET");
    const suppliedSecret = req.headers.get("x-bootstrap-secret") || String(body.bootstrapSecret || "");

    if (!expectedSecret) return json({ error: "Admin bootstrap secret is not configured" }, 500);
    if (!suppliedSecret || suppliedSecret !== expectedSecret) return json({ error: "Forbidden" }, 403);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase service role is not configured" }, 500);
    }

    const email = isEmail(body.email) ? body.email.trim().toLowerCase() : "admin@sommervibes.dk";
    const password = typeof body.password === "string" && body.password.length >= 12
      ? body.password
      : randomPassword();
    const fullName = typeof body.full_name === "string" && body.full_name.trim()
      ? body.full_name.trim()
      : "SommerVibes Super Admin";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const existingUser = await findUserByEmail(supabase, email);
    const userPayload = {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    };

    const { data: authData, error: authError } = existingUser
      ? await supabase.auth.admin.updateUserById(existingUser.id, userPayload)
      : await supabase.auth.admin.createUser(userPayload);

    if (authError) throw authError;

    const userId = authData.user?.id || existingUser?.id;
    if (!userId) throw new Error("Supabase did not return a user id");

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    const { error: roleError } = await supabase.from("user_roles").upsert(
      {
        user_id: userId,
        role: "super_admin",
      },
      { onConflict: "user_id,role" },
    );
    if (roleError) throw roleError;

    const { error: cleanupError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .not("role", "in", "(admin,super_admin)");
    if (cleanupError) throw cleanupError;

    return json({
      success: true,
      user_id: userId,
      email,
      password,
      role: "super_admin",
      login_url: "https://sommervibes.dk/admin/auth",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[SEED-SUPER-ADMIN]", message);
    return json({ error: message }, 500);
  }
});
