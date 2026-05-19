import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ID = "jasgxsziqjfrewaautcl";
const PRODUCTION_SITE_URL = "https://sommervibes.dk";

const frontendRequired = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
  "VITE_SITE_URL",
  "VITE_ENABLE_COMING_SOON_GATE",
  "VITE_VAPID_PUBLIC_KEY",
  "VITE_STRIPE_PUBLISHABLE_KEY",
];

const backendRequired = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "LOVABLE_API_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "AUTOMATION_RUN_SECRET",
];

const optionalBackend = [
  "BEDS24_PUBLISH_URL",
  "BEDS24_API_TOKEN",
  "BEDS24_REFRESH_TOKEN",
  "BEDS24_API_BASE_URL",
  "BEDS24_INTEGRATION_MODE",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function parseArgs(argv) {
  const args = {
    frontend: false,
    backend: false,
    envFile: ".env",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--frontend") args.frontend = true;
    else if (arg === "--backend") args.backend = true;
    else if (arg === "--all") {
      args.frontend = true;
      args.backend = true;
    } else if (arg === "--env-file") {
      args.envFile = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.frontend && !args.backend) args.frontend = true;
  return args;
}

function parseEnvFile(filePath) {
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath)) {
    return { values: {}, found: false, path: absolutePath };
  }

  const values = {};
  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return { values, found: true, path: absolutePath };
}

function hasValue(values, key) {
  return typeof values[key] === "string" && values[key].trim().length > 0;
}

function validateFrontend(values) {
  const errors = [];
  const warnings = [];

  for (const key of frontendRequired) {
    if (!hasValue(values, key)) errors.push(`${key} is missing or empty`);
  }

  if (hasValue(values, "VITE_SUPABASE_PROJECT_ID") && values.VITE_SUPABASE_PROJECT_ID !== PROJECT_ID) {
    errors.push(`VITE_SUPABASE_PROJECT_ID must be ${PROJECT_ID}`);
  }

  if (hasValue(values, "VITE_SUPABASE_URL") && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(values.VITE_SUPABASE_URL)) {
    warnings.push("VITE_SUPABASE_URL does not look like a Supabase project URL");
  }

  if (hasValue(values, "VITE_SITE_URL") && values.VITE_SITE_URL.replace(/\/+$/, "") !== PRODUCTION_SITE_URL) {
    warnings.push(`VITE_SITE_URL is not ${PRODUCTION_SITE_URL}`);
  }

  if (hasValue(values, "VITE_ENABLE_COMING_SOON_GATE") && values.VITE_ENABLE_COMING_SOON_GATE !== "false") {
    errors.push("VITE_ENABLE_COMING_SOON_GATE must be false for production");
  }

  if (hasValue(values, "VITE_STRIPE_PUBLISHABLE_KEY") && !/^pk_(test|live)_/.test(values.VITE_STRIPE_PUBLISHABLE_KEY)) {
    errors.push("VITE_STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_");
  }

  return { errors, warnings };
}

function validateBackend(values) {
  const errors = [];
  const warnings = [];

  for (const key of backendRequired) {
    if (!hasValue(values, key)) errors.push(`${key} is missing or empty`);
  }

  for (const key of optionalBackend) {
    if (!hasValue(values, key)) warnings.push(`${key} is not set; this may be OK if Lovable/Supabase manages it or the feature is not enabled`);
  }

  if (hasValue(values, "STRIPE_SECRET_KEY") && !/^(sk|rk)_(test|live)_/.test(values.STRIPE_SECRET_KEY)) {
    errors.push("STRIPE_SECRET_KEY must start with sk_test_, sk_live_, rk_test_, or rk_live_");
  }

  if (hasValue(values, "STRIPE_WEBHOOK_SECRET") && !values.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
    errors.push("STRIPE_WEBHOOK_SECRET must start with whsec_");
  }

  if (hasValue(values, "RESEND_API_KEY") && !values.RESEND_API_KEY.startsWith("re_")) {
    warnings.push("RESEND_API_KEY usually starts with re_");
  }

  if (hasValue(values, "VAPID_SUBJECT") && !/^(mailto:|https:\/\/)/.test(values.VAPID_SUBJECT)) {
    warnings.push("VAPID_SUBJECT should start with mailto: or https://");
  }

  return { errors, warnings };
}

function printResult(title, result) {
  console.log(`\n${title}`);
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log("OK");
    return;
  }

  for (const error of result.errors) console.error(`ERROR: ${error}`);
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const envFile = parseEnvFile(args.envFile);
  let failed = false;

  if (args.frontend) {
    if (!envFile.found) {
      console.error(`ERROR: Env file not found: ${envFile.path}`);
      failed = true;
    } else {
      const result = validateFrontend(envFile.values);
      printResult(`Frontend env (${envFile.path})`, result);
      failed = failed || result.errors.length > 0;
    }
  }

  if (args.backend) {
    const result = validateBackend(process.env);
    printResult("Backend secrets (current process environment)", result);
    failed = failed || result.errors.length > 0;
  }

  if (failed) process.exit(1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
