import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv(path = ".env") {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function generatedPassword() {
  return `SommerVibes-${randomBytes(12).toString("base64url")}!`;
}

async function findUserByEmail(supabase, email) {
  const target = email.toLowerCase();

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === target);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  throw new Error("Stopped after scanning 100,000 auth users without finding a match");
}

async function main() {
  loadDotEnv();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is required");

  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@sommervibes.dk";
  const password = process.env.SUPER_ADMIN_PASSWORD || generatedPassword();
  const fullName = process.env.SUPER_ADMIN_FULL_NAME || "SommerVibes Super Admin";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const existingUser = await findUserByEmail(supabase, email);
  const userPayload = {
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  };

  const { data: authData, error: authError } = existingUser
    ? await supabase.auth.admin.updateUserById(existingUser.id, userPayload)
    : await supabase.auth.admin.createUser(userPayload);

  if (authError) throw authError;

  const userId = authData.user?.id || existingUser?.id;
  if (!userId) throw new Error("Supabase did not return a user id");

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  if (profileError) throw profileError;

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: userId,
        role: "super_admin",
      },
      { onConflict: "user_id,role" },
    );
  if (roleError) throw roleError;

  const { error: cleanupRoleError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .not("role", "in", "(admin,super_admin)");
  if (cleanupRoleError) throw cleanupRoleError;

  const siteUrl = process.env.VITE_SITE_URL || "https://sommervibes.dk";

  console.log("Super admin account is ready.");
  console.log(`Login URL: ${new URL("/admin/auth", siteUrl).toString()}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    console.log("This password was generated now. Store it somewhere safe.");
  }
}

main().catch((error) => {
  console.error(`Failed to seed super admin: ${error.message}`);
  process.exit(1);
});
