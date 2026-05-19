import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const PROJECT_ID = "jasgxsziqjfrewaautcl";
const PRODUCTION_SITE_URL = "https://sommervibes.dk";

const requiredFiles = [
  "package.json",
  "package-lock.json",
  ".gitignore",
  ".env.example",
  "vite.config.ts",
  "supabase/config.toml",
  "public/robots.txt",
  "public/sitemap.xml",
  "public/sw.js",
  "scripts/generate-seo.mjs",
  "scripts/validate-env.mjs",
  "scripts/validate-stripe-flow.mjs",
  "scripts/validate-email-flow.mjs",
  "scripts/validate-push-flow.mjs",
  "scripts/validate-beds24-flow.mjs",
  "scripts/validate-domain-flow.mjs",
  "scripts/validate-smoke-flow.mjs",
  "docs/lovable-deployment-handoff.md",
];

const requiredPackageScripts = {
  build: "vite build",
  prebuild: "node scripts/generate-seo.mjs public",
  postbuild: "node scripts/generate-seo.mjs dist --prerender",
  "validate:env": "node scripts/validate-env.mjs --frontend",
  "validate:stripe": "node scripts/validate-stripe-flow.mjs",
  "validate:email": "node scripts/validate-email-flow.mjs",
  "validate:push": "node scripts/validate-push-flow.mjs",
  "validate:beds24": "node scripts/validate-beds24-flow.mjs",
  "validate:domain": "node scripts/validate-domain-flow.mjs",
  "validate:smoke": "node scripts/validate-smoke-flow.mjs",
  "validate:deployment": "node scripts/validate-deployment-sync.mjs",
};

const publicEdgeFunctionConfig = [
  "stripe-webhook",
  "handle-payment-webhook",
  "ical-export",
  "verify-payment",
  "execute-automations",
];

const requiredAuthRedirectUrls = [
  "https://sommervibes.dk/auth?mode=updatePassword",
  "https://www.sommervibes.dk/auth?mode=updatePassword",
  "http://localhost:8080/auth?mode=updatePassword",
  "http://127.0.0.1:8080/auth?mode=updatePassword",
];

const requiredEdgeFunctions = [
  "beds24-publish",
  "create-booking",
  "create-booking-payment",
  "create-checkout",
  "create-addon-checkout",
  "execute-automations",
  "send-booking-email",
  "send-chat-push",
  "stripe-webhook",
  "verify-payment",
];

const ignoredDirs = new Set([".git", "node_modules", "dist", "dist-ssr"]);
const ignoredFiles = new Set([".env", ".env.local", ".env.production", ".env.development"]);
const secretPatterns = [
  { name: "Stripe secret key", pattern: /\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{12,}\b/ },
  { name: "Stripe webhook secret", pattern: /\bwhsec_[A-Za-z0-9]{12,}\b/ },
  { name: "Resend API key", pattern: /\bre_[A-Za-z0-9_-]{16,}\b/ },
  { name: "Supabase service role assignment", pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[^'"\s#]+/ },
  { name: "Beds24 token assignment", pattern: /BEDS24_(?:API_TOKEN|REFRESH_TOKEN|TOKEN)\s*=\s*['"]?[^'"\s#]+/ },
];

const errors = [];
const warnings = [];

function read(path) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) throw new Error(`Missing file: ${path}`);
  return readFileSync(absolute, "utf8");
}

function runGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch (_) {
    return "";
  }
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

function warn(name, fn) {
  try {
    const message = fn();
    if (message) warnings.push(message);
    else console.log(`OK: ${name}`);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : String(error));
  }
}

function walkFiles(root, out = []) {
  for (const entry of readdirSync(root)) {
    if (ignoredDirs.has(entry)) continue;
    const fullPath = join(root, entry);
    const relativePath = fullPath.replace(resolve(".") + "\\", "").replaceAll("\\", "/");
    if (ignoredFiles.has(entry) || relativePath.startsWith(".env.")) continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) walkFiles(fullPath, out);
    else if (stat.isFile() && stat.size < 2_000_000) out.push(relativePath);
  }
  return out;
}

check("required deployment files exist", () => {
  for (const path of requiredFiles) {
    if (!existsSync(resolve(path))) throw new Error(`Missing required deployment file: ${path}`);
  }
});

check("package scripts include deployment gates", () => {
  const pkg = JSON.parse(read("package.json"));
  for (const [name, command] of Object.entries(requiredPackageScripts)) {
    if (pkg.scripts?.[name] !== command) {
      throw new Error(`package.json script ${name} must be "${command}"`);
    }
  }
});

check("frontend production env template is present", () => {
  const envExample = read(".env.example");
  for (const key of [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
    "VITE_SITE_URL",
    "VITE_ENABLE_COMING_SOON_GATE",
    "VITE_VAPID_PUBLIC_KEY",
    "VITE_STRIPE_PUBLISHABLE_KEY",
  ]) {
    if (!envExample.includes(`${key}=`)) throw new Error(`.env.example is missing ${key}`);
  }
  if (!envExample.includes(`VITE_SITE_URL=${PRODUCTION_SITE_URL}`)) {
    throw new Error(`.env.example must set VITE_SITE_URL=${PRODUCTION_SITE_URL}`);
  }
  if (!envExample.includes("VITE_ENABLE_COMING_SOON_GATE=false")) {
    throw new Error(".env.example must disable the coming-soon gate for production");
  }
});

check(".env files are protected from git", () => {
  const gitignore = read(".gitignore");
  if (!/^\s*\.env\s*$/m.test(gitignore)) throw new Error(".gitignore must ignore .env");
  if (!gitignore.includes("!.env.example")) throw new Error(".gitignore must allow .env.example");

  const trackedEnvFiles = runGit(["ls-files"]).split(/\r?\n/).filter((path) => {
    if (!path) return false;
    if (path === ".env.example") return false;
    return path === ".env" || path.endsWith(".env") || path.includes("/.env");
  });
  if (trackedEnvFiles.length > 0) {
    throw new Error(`Tracked env files must be removed before deployment: ${trackedEnvFiles.join(", ")}`);
  }
});

check("Supabase project and public function config are deployment-ready", () => {
  const config = read("supabase/config.toml");
  if (!config.includes(`project_id = "${PROJECT_ID}"`)) {
    throw new Error(`supabase/config.toml must target project_id ${PROJECT_ID}`);
  }
  if (!config.includes(`[auth]`) || !config.includes(`site_url = "${PRODUCTION_SITE_URL}"`)) {
    throw new Error(`supabase/config.toml must set [auth].site_url to ${PRODUCTION_SITE_URL}`);
  }
  for (const url of requiredAuthRedirectUrls) {
    if (!config.includes(`"${url}"`)) {
      throw new Error(`supabase/config.toml auth additional_redirect_urls must include ${url}`);
    }
  }
  for (const fn of publicEdgeFunctionConfig) {
    const pattern = new RegExp(`\\[functions\\.${fn}\\]\\s+verify_jwt\\s*=\\s*false`, "s");
    if (!pattern.test(config)) throw new Error(`supabase/config.toml must set verify_jwt=false for ${fn}`);
  }
  for (const fn of requiredEdgeFunctions) {
    if (!existsSync(resolve("supabase/functions", fn, "index.ts"))) {
      throw new Error(`Missing edge function: ${fn}`);
    }
  }
});

check("SEO assets target the production domain", () => {
  const robots = read("public/robots.txt");
  const sitemap = read("public/sitemap.xml");
  if (!robots.includes(`Sitemap: ${PRODUCTION_SITE_URL}/sitemap.xml`)) {
    throw new Error("public/robots.txt must point to the production sitemap");
  }
  if (!sitemap.includes(`<loc>${PRODUCTION_SITE_URL}/</loc>`)) {
    throw new Error("public/sitemap.xml must include the production homepage");
  }
  if (sitemap.includes("localhost") || sitemap.includes("lovable.app")) {
    throw new Error("public/sitemap.xml must not include localhost or old Lovable URLs");
  }
});

check("generated public assets are available for Lovable build", () => {
  const ogDir = resolve("public/og");
  if (!existsSync(ogDir)) throw new Error("public/og is missing");
  const ogFiles = walkFiles(ogDir).filter((path) => path.endsWith(".png"));
  if (ogFiles.length === 0) throw new Error("public/og must include generated listing images");
});

check("source tree does not contain obvious backend secrets", () => {
  const findings = [];
  for (const path of walkFiles(resolve("."))) {
    if (path === "package-lock.json") continue;
    const content = read(path);
    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(content)) findings.push(`${name} in ${path}`);
    }
  }
  if (findings.length > 0) {
    throw new Error(`Potential secret values found: ${findings.join("; ")}`);
  }
});

warn("git remote exists for Lovable/GitHub sync", () => {
  const remotes = runGit(["remote", "-v"]);
  if (!remotes) return "No git remote is configured; Lovable GitHub sync needs a target repository.";
  if (!remotes.includes("github.com")) return "A git remote exists, but it does not look like GitHub; confirm Lovable is connected to the correct repo.";
  return "";
});

warn("worktree state is explicit before deployment", () => {
  const status = runGit(["status", "--short"]);
  if (!status) return "";
  return "Working tree has uncommitted changes. This is OK locally, but deploy only after pushing the intended changes to the Lovable-connected repo.";
});

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  console.error(`\nDeployment sync validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nDeployment sync validation passed.");
