import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = {
  sendBookingEmail: "supabase/functions/send-booking-email/index.ts",
  stripeWebhook: "supabase/functions/stripe-webhook/index.ts",
  verifyPayment: "supabase/functions/verify-payment/index.ts",
  handlePaymentWebhook: "supabase/functions/handle-payment-webhook/index.ts",
  executeAutomations: "supabase/functions/execute-automations/index.ts",
  migration: "supabase/migrations/20260512031000_add_booking_confirmation_email_tracking.sql",
};

function read(path) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) throw new Error(`Missing file: ${path}`);
  return readFileSync(absolute, "utf8");
}

function assertContains(content, pattern, message) {
  const ok = typeof pattern === "string" ? content.includes(pattern) : pattern.test(content);
  if (!ok) throw new Error(message);
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

const errors = [];
const warnings = [];

function check(name, fn) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    console.error(`ERROR: ${name}`);
  }
}

const sendBookingEmail = read(files.sendBookingEmail);
const stripeWebhook = read(files.stripeWebhook);
const verifyPayment = read(files.verifyPayment);
const handlePaymentWebhook = read(files.handlePaymentWebhook);
const executeAutomations = read(files.executeAutomations);
const migration = read(files.migration);

check("send-booking-email requires POST", () => {
  assertContains(sendBookingEmail, 'req.method !== "POST"', "send-booking-email must reject non-POST requests");
});

check("send-booking-email validates required fields", () => {
  assertContains(sendBookingEmail, "isEmail(to)", "send-booking-email must validate recipient email");
  assertContains(sendBookingEmail, "Missing or invalid required fields", "send-booking-email must return a validation error");
});

check("send-booking-email requires Resend configuration", () => {
  assertContains(sendBookingEmail, "RESEND_API_KEY", "send-booking-email must read RESEND_API_KEY");
  assertContains(sendBookingEmail, "RESEND_FROM_EMAIL", "send-booking-email must read RESEND_FROM_EMAIL");
  if (sendBookingEmail.includes("onboarding@resend.dev")) {
    throw new Error("send-booking-email must not fall back to onboarding@resend.dev");
  }
});

check("send-booking-email uses production site URL config", () => {
  assertContains(sendBookingEmail, "SITE_URL", "send-booking-email must read SITE_URL or VITE_SITE_URL");
  assertContains(sendBookingEmail, "https://sommervibes.dk", "send-booking-email must default to production domain");
  if (sendBookingEmail.includes("https://sommerdroem.lovable.app")) {
    throw new Error("send-booking-email still links to the old Lovable app URL");
  }
});

check("send-booking-email escapes dynamic HTML", () => {
  assertContains(sendBookingEmail, "function escapeHtml", "send-booking-email must define escapeHtml");
  assertContains(sendBookingEmail, "safeGuestName", "send-booking-email must escape guest name");
  assertContains(sendBookingEmail, "safeHouseName", "send-booking-email must escape house name");
  assertContains(sendBookingEmail, "safeAddress", "send-booking-email must escape address");
  assertContains(sendBookingEmail, "escapeHtml(item.label)", "send-booking-email must escape line item labels");
});

check("send-booking-email sends HTML and text versions through Resend", () => {
  assertContains(sendBookingEmail, "https://api.resend.com/emails", "send-booking-email must call Resend emails API");
  assertContains(sendBookingEmail, "html: emailHtml", "send-booking-email must send HTML body");
  assertContains(sendBookingEmail, "text:", "send-booking-email must send text fallback body");
  assertContains(sendBookingEmail, "email_id", "send-booking-email must return Resend email id");
});

check("payment processors call send-booking-email after final payment", () => {
  for (const [name, content] of [
    ["stripe-webhook", stripeWebhook],
    ["verify-payment", verifyPayment],
    ["handle-payment-webhook", handlePaymentWebhook],
  ]) {
    assertContains(content, "sendBookingConfirmationEmail", `${name} must define/call sendBookingConfirmationEmail`);
    assertContains(content, "/functions/v1/send-booking-email", `${name} must invoke send-booking-email`);
    assertContains(content, "confirmation_email_sent_at", `${name} must update confirmation_email_sent_at`);
    assertContains(content, "line_items", `${name} must include booking line items`);
  }
});

check("booking confirmation tracking migration exists", () => {
  assertContains(migration, "confirmation_email_sent_at", "migration must add confirmation_email_sent_at");
});

check("automation emails require configured sender", () => {
  assertContains(executeAutomations, "RESEND_API_KEY", "execute-automations must read RESEND_API_KEY");
  assertContains(executeAutomations, "RESEND_FROM_EMAIL", "execute-automations must require RESEND_FROM_EMAIL");
  if (executeAutomations.includes("onboarding@resend.dev")) {
    throw new Error("execute-automations must not fall back to onboarding@resend.dev");
  }
});

const env = parseEnvFile(".env");
if (env.VITE_SITE_URL && env.VITE_SITE_URL.replace(/\/+$/, "") !== "https://sommervibes.dk") {
  errors.push("VITE_SITE_URL must be https://sommervibes.dk for production email links");
}

if (!process.env.RESEND_API_KEY) {
  warnings.push("RESEND_API_KEY was not available in this shell; live Resend delivery must be checked in Lovable.");
} else if (!process.env.RESEND_API_KEY.startsWith("re_")) {
  errors.push("RESEND_API_KEY should start with re_");
}

if (!process.env.RESEND_FROM_EMAIL) {
  warnings.push("RESEND_FROM_EMAIL was not available in this shell; verified sender must be checked in Lovable.");
} else if (!/@sommervibes\.dk[> ]?$/.test(process.env.RESEND_FROM_EMAIL)) {
  warnings.push("RESEND_FROM_EMAIL does not appear to use the sommervibes.dk domain.");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  console.error(`\nEmail flow validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nEmail flow validation passed.");
