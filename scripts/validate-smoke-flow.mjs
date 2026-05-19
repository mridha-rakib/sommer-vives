import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const files = {
  app: "src/App.tsx",
  authProvider: "src/lib/auth.tsx",
  devBypass: "src/lib/devBypass.ts",
  ownerAuth: "src/pages/Auth.tsx",
  adminAuth: "src/pages/admin/AdminAuth.tsx",
  guestAuth: "src/pages/guest/GuestAuth.tsx",
  envExample: ".env.example",
  roleMigration: "supabase/migrations/20260512030000_fix_auth_role_assignment.sql",
  roleEnumMigration: "supabase/migrations/20260330204827_b56aab18-2777-4c1a-9844-baa3e78be8cd.sql",
};

const routeChecks = [
  { portal: "admin", path: "/admin", guard: "ProtectedRoute requireAdmin" },
  { portal: "admin", path: "/admin/sager", guard: "ProtectedRoute requireAdmin" },
  { portal: "admin", path: "/admin/kalender", guard: "ProtectedRoute requireAdmin" },
  { portal: "admin", path: "/admin/oekonomi", guard: "ProtectedRoute requireAdmin" },
  { portal: "admin", path: "/admin/beskeder", guard: "ProtectedRoute requireAdmin" },
  { portal: "admin", path: "/admin/indstillinger", guard: "ProtectedRoute requireAdmin" },
  { portal: "admin", path: "/admin/settings", guard: "ProtectedRoute requireAdmin" },
  { portal: "owner", path: "/owner", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/listings", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/bookings", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/calendar", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/messages", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/documents", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/agreement", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/payouts", guard: "ProtectedRoute requireOwner" },
  { portal: "owner", path: "/owner/account", guard: "ProtectedRoute requireOwner" },
  { portal: "guest", path: "/guest", guard: "GuestProtectedRoute" },
  { portal: "guest", path: "/guest/reservation", guard: "GuestProtectedRoute" },
  { portal: "guest", path: "/guest/property", guard: "GuestProtectedRoute" },
  { portal: "guest", path: "/guest/addons", guard: "GuestProtectedRoute" },
  { portal: "guest", path: "/guest/payment", guard: "GuestProtectedRoute" },
  { portal: "guest", path: "/guest/messages", guard: "GuestProtectedRoute" },
];

const smokeAccounts = [
  {
    label: "admin",
    prefix: "SMOKE_ADMIN",
    acceptedRoles: ["admin", "super_admin"],
    rpcRole: "admin",
    disallowedRoles: ["owner", "guest"],
  },
  {
    label: "owner",
    prefix: "SMOKE_OWNER",
    acceptedRoles: ["owner"],
    rpcRole: "owner",
    disallowedRoles: ["admin", "super_admin", "guest"],
  },
  {
    label: "guest",
    prefix: "SMOKE_GUEST",
    acceptedRoles: ["guest"],
    rpcRole: "guest",
    disallowedRoles: ["admin", "super_admin", "owner"],
  },
];

const errors = [];
const warnings = [];

function read(path) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) throw new Error(`Missing file: ${path}`);
  return readFileSync(absolute, "utf8");
}

function parseEnvFile(path) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) return {};
  const values = {};
  for (const line of readFileSync(absolute, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

function valueFor(env, key) {
  return process.env[key] || env[key] || "";
}

function assertContains(content, pattern, message) {
  const ok = typeof pattern === "string" ? content.includes(pattern) : pattern.test(content);
  if (!ok) throw new Error(message);
}

function check(name, fn) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    console.error(`ERROR: ${name}`);
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    console.error(`ERROR: ${name}`);
  }
}

function assertRouteProtected(app, { portal, path, guard }) {
  assertContains(
    app,
    `path="${path}" element={<${guard}`,
    `${portal} smoke route ${path} must use ${guard}`,
  );
}

function assertSmokeEnvTemplate(envExample) {
  for (const account of smokeAccounts) {
    for (const suffix of ["EMAIL", "PASSWORD"]) {
      const key = `${account.prefix}_${suffix}`;
      assertContains(envExample, `${key}=`, `.env.example should document optional ${key}`);
      if (key.startsWith("VITE_")) {
        throw new Error(`${key} must not be a VITE_ frontend variable`);
      }
    }
  }
}

async function verifySmokeAccount(env, account) {
  const url = valueFor(env, "VITE_SUPABASE_URL");
  const publishableKey = valueFor(env, "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !publishableKey) {
    throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for live smoke checks");
  }

  const email = valueFor(env, `${account.prefix}_EMAIL`);
  const password = valueFor(env, `${account.prefix}_PASSWORD`);
  if (!email || !password) {
    throw new Error(`${account.prefix}_EMAIL and ${account.prefix}_PASSWORD are required for live smoke checks`);
  }

  const client = createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: authData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) throw new Error(`${account.label} login failed: ${signInError.message}`);
  if (!authData.user) throw new Error(`${account.label} login did not return a user`);

  try {
    const { data: rolesData, error: rolesError } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);

    if (rolesError) throw new Error(`${account.label} role lookup failed: ${rolesError.message}`);

    const roles = Array.from(new Set((rolesData || []).map((row) => row.role)));
    if (!account.acceptedRoles.some((role) => roles.includes(role))) {
      throw new Error(
        `${account.label} account ${email} must have one of: ${account.acceptedRoles.join(", ")}; found: ${roles.join(", ") || "none"}`,
      );
    }

    const conflictingRoles = account.disallowedRoles.filter((role) => roles.includes(role));
    if (conflictingRoles.length > 0) {
      throw new Error(
        `${account.label} account ${email} has extra portal role(s) ${conflictingRoles.join(", ")}; use separate smoke users so unauthorized redirects are meaningful`,
      );
    }

    const { data: hasExpectedRole, error: rpcError } = await client.rpc("has_role", {
      _user_id: authData.user.id,
      _role: account.rpcRole,
    });

    if (rpcError) throw new Error(`${account.label} has_role RPC failed: ${rpcError.message}`);
    if (hasExpectedRole !== true) {
      throw new Error(`${account.label} account ${email} did not pass has_role(..., ${account.rpcRole})`);
    }
  } finally {
    await client.auth.signOut();
  }
}

check("required smoke-test files exist", () => {
  for (const path of Object.values(files)) {
    if (!existsSync(resolve(path))) throw new Error(`Missing required smoke-test file: ${path}`);
  }
});

check("development auth bypass is disabled", () => {
  const devBypass = read(files.devBypass);
  assertContains(devBypass, "export const DEV_BYPASS_AUTH = false", "DEV_BYPASS_AUTH must remain false");
});

check("auth provider loads role assignments from Supabase", () => {
  const authProvider = read(files.authProvider);
  assertContains(authProvider, ".from('user_roles')", "AuthProvider must read user_roles");
  assertContains(authProvider, "roles.includes('super_admin')", "AuthProvider must treat super_admin as admin");
  assertContains(authProvider, "roles.includes('owner')", "AuthProvider must expose owner role");
  assertContains(authProvider, "roles.includes('guest')", "AuthProvider must expose guest role");
});

check("password login pages route users by role", () => {
  const ownerAuth = read(files.ownerAuth);
  const adminAuth = read(files.adminAuth);
  const guestAuth = read(files.guestAuth);

  assertContains(ownerAuth, "signInWithPassword", "Owner auth page must use password login");
  assertContains(ownerAuth, "isAdmin ? '/admin' : isOwner ? '/owner' : isGuest ? '/guest'", "Owner auth page must redirect by role");
  assertContains(adminAuth, 'supabase.rpc("has_role"', "Admin auth must verify admin role after login");
  assertContains(adminAuth, 'await signOut()', "Admin auth must sign out users without admin access");
  assertContains(guestAuth, "signInWithPassword", "Guest auth page must use password login");
  assertContains(guestAuth, "navigate('/guest')", "Guest auth page must navigate to guest portal after login");
});

check("admin, owner, and guest smoke routes are protected", () => {
  const app = read(files.app);
  for (const route of routeChecks) assertRouteProtected(app, route);
});

check("unauthorized portal redirects are explicit", () => {
  const app = read(files.app);
  assertContains(app, 'return <Navigate to={requireAdmin ? "/admin/auth" : "/auth"} replace />;', "ProtectedRoute must redirect unauthenticated users to the correct auth page");
  assertContains(app, 'return <Navigate to="/admin/auth" replace />;', "ProtectedRoute must send non-admins away from admin routes");
  assertContains(app, 'return <Navigate to={isAdmin ? "/admin" : "/auth"} replace />;', "ProtectedRoute must send non-owners away from owner routes");
  assertContains(app, 'return <Navigate to="/guest/auth" replace />;', "GuestProtectedRoute must redirect unauthenticated users to guest auth");
  assertContains(app, 'return <Navigate to={isAdmin ? "/admin" : isOwner ? "/owner" : "/guest/auth"} replace />;', "GuestProtectedRoute must send non-guests to their own portal");
});

check("database role setup supports separate smoke users", () => {
  const roleMigration = read(files.roleMigration);
  const roleEnumMigration = read(files.roleEnumMigration);
  assertContains(roleEnumMigration, "ADD VALUE IF NOT EXISTS 'guest'", "user_role enum must support guest");
  assertContains(roleMigration, "requested_role := 'guest'", "auth role assignment must support guest signups");
  assertContains(roleMigration, "requested_role public.user_role := 'owner'", "auth role assignment must default owner signups to owner");
});

check("smoke credential placeholders are documented outside frontend env", () => {
  assertSmokeEnvTemplate(read(files.envExample));
});

const env = { ...parseEnvFile(".env"), ...process.env };
const liveRequested = process.argv.includes("--live") || process.env.VALIDATE_LIVE_SMOKE === "true";
const credentialKeys = smokeAccounts.flatMap((account) => [
  `${account.prefix}_EMAIL`,
  `${account.prefix}_PASSWORD`,
]);
const missingCredentials = credentialKeys.filter((key) => !valueFor(env, key));
const shouldRunLive = liveRequested || missingCredentials.length === 0;

if (shouldRunLive) {
  if (missingCredentials.length > 0) {
    errors.push(`Missing live smoke credential(s): ${missingCredentials.join(", ")}`);
    console.error("ERROR: live smoke credentials are missing");
  } else {
    for (const account of smokeAccounts) {
      await checkAsync(`${account.label} smoke user can log in and has the expected role`, async () => {
        await verifySmokeAccount(env, account);
      });
    }
  }
} else {
  warnings.push("Live auth smoke checks were skipped. Set SMOKE_ADMIN_*, SMOKE_OWNER_*, and SMOKE_GUEST_* credentials, then run `npm run validate:smoke -- --live`.");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  console.error(`\nSmoke validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nSmoke validation passed.");
