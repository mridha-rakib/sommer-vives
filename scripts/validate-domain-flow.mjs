import { lookup } from "node:dns/promises";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const PRODUCTION_SITE_URL = "https://sommervibes.dk";
const ROOT_DOMAIN = "sommervibes.dk";
const WWW_DOMAIN = "www.sommervibes.dk";
const OLD_DOMAIN = "sommerdroem.lovable.app";

const files = {
  envExample: ".env.example",
  index: "index.html",
  seoLib: "src/lib/seo.ts",
  seoGenerator: "scripts/generate-seo.mjs",
  robots: "public/robots.txt",
  sitemap: "public/sitemap.xml",
  createBooking: "supabase/functions/create-booking/index.ts",
  createBookingPayment: "supabase/functions/create-booking-payment/index.ts",
  createAddonCheckout: "supabase/functions/create-addon-checkout/index.ts",
  createConnectAccount: "supabase/functions/create-connect-account/index.ts",
};

const runtimeScanRoots = [
  "index.html",
  "src",
  "supabase/functions",
  "public",
  "scripts/generate-seo.mjs",
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

function walkFiles(target, out = []) {
  const absolute = resolve(target);
  if (!existsSync(absolute)) return out;
  const stat = statSync(absolute);
  if (stat.isFile()) {
    if (stat.size < 2_000_000) out.push(target.replaceAll("\\", "/"));
    return out;
  }

  for (const entry of readdirSync(absolute)) {
    if ([".git", "node_modules", "dist"].includes(entry)) continue;
    walkFiles(join(target, entry), out);
  }
  return out;
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

async function checkLiveDomain(domain) {
  try {
    const addresses = await lookup(domain, { all: true });
    if (addresses.length === 0) warnings.push(`${domain} did not resolve to any DNS records.`);
  } catch (error) {
    warnings.push(`${domain} DNS lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  try {
    const response = await fetch(`https://${domain}`, { method: "HEAD", redirect: "manual" });
    if (response.status >= 400) {
      warnings.push(`https://${domain} returned HTTP ${response.status}.`);
    }
  } catch (error) {
    warnings.push(`https://${domain} HTTPS check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

check("required domain files exist", () => {
  for (const path of Object.values(files)) {
    if (!existsSync(resolve(path))) throw new Error(`Missing required domain file: ${path}`);
  }
});

check("frontend env uses the production domain", () => {
  const env = parseEnvFile(".env");
  const example = parseEnvFile(files.envExample);
  if (example.VITE_SITE_URL !== PRODUCTION_SITE_URL) {
    throw new Error(`.env.example must set VITE_SITE_URL=${PRODUCTION_SITE_URL}`);
  }
  if (env.VITE_SITE_URL && env.VITE_SITE_URL.replace(/\/+$/, "") !== PRODUCTION_SITE_URL) {
    throw new Error(`.env VITE_SITE_URL must be ${PRODUCTION_SITE_URL}`);
  }
});

check("base HTML social metadata uses the production domain", () => {
  const index = read(files.index);
  assertContains(index, `property="og:url" content="${PRODUCTION_SITE_URL}"`, "index.html og:url must use production domain");
  assertContains(index, `property="og:image" content="${PRODUCTION_SITE_URL}/og-image.png"`, "index.html og:image must use production domain");
  assertContains(index, `name="twitter:image" content="${PRODUCTION_SITE_URL}/og-image.png"`, "index.html twitter image must use production domain");
});

check("SEO defaults use the production domain", () => {
  assertContains(read(files.seoGenerator), `const DEFAULT_SITE_URL = '${PRODUCTION_SITE_URL}'`, "generate-seo default site URL must use production domain");
  assertContains(read(files.seoLib), `https://sommervibes.dk`, "src/lib/seo.ts fallback site URL must use production domain");
});

check("Stripe and Connect fallback return URLs use production domain config", () => {
  for (const path of [files.createBooking, files.createBookingPayment, files.createAddonCheckout, files.createConnectAccount]) {
    const content = read(path);
    assertContains(content, "Deno.env.get(\"SITE_URL\")", `${path} must support SITE_URL fallback`);
    assertContains(content, PRODUCTION_SITE_URL, `${path} must default to production domain`);
  }
});

check("robots and sitemap use the production domain", () => {
  const robots = read(files.robots);
  const sitemap = read(files.sitemap);
  assertContains(robots, `Sitemap: ${PRODUCTION_SITE_URL}/sitemap.xml`, "robots.txt must point to production sitemap");
  assertContains(sitemap, `<loc>${PRODUCTION_SITE_URL}/</loc>`, "sitemap.xml must include production homepage");
  if (sitemap.includes(OLD_DOMAIN) || sitemap.includes("localhost")) {
    throw new Error("sitemap.xml must not include old Lovable or localhost URLs");
  }
});

check("runtime files do not reference the old Lovable domain", () => {
  const findings = [];
  for (const root of runtimeScanRoots) {
    for (const path of walkFiles(root)) {
      if (path.endsWith(".map")) continue;
      const content = read(path);
      if (content.includes(OLD_DOMAIN)) findings.push(path);
    }
  }
  if (findings.length > 0) {
    throw new Error(`Old Lovable domain found in runtime files: ${Array.from(new Set(findings)).join(", ")}`);
  }
});

const live = process.argv.includes("--live") || process.env.VALIDATE_LIVE_DOMAIN === "true";
if (live) {
  await checkLiveDomain(ROOT_DOMAIN);
  await checkLiveDomain(WWW_DOMAIN);
} else {
  warnings.push("Live DNS/HTTPS checks were skipped. Run `npm run validate:domain -- --live` after DNS is configured.");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  console.error(`\nDomain validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nDomain validation passed.");
