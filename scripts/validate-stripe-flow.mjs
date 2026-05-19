import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = {
  config: "supabase/config.toml",
  createBooking: "supabase/functions/create-booking/index.ts",
  createBookingPayment: "supabase/functions/create-booking-payment/index.ts",
  createCheckout: "supabase/functions/create-checkout/index.ts",
  createAddonCheckout: "supabase/functions/create-addon-checkout/index.ts",
  stripeWebhook: "supabase/functions/stripe-webhook/index.ts",
  verifyPayment: "supabase/functions/verify-payment/index.ts",
  bookingReturn: "src/pages/BookingReturn.tsx",
  guestPayment: "src/pages/guest/GuestPayment.tsx",
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

const config = read(files.config);
const createBooking = read(files.createBooking);
const createBookingPayment = read(files.createBookingPayment);
const createCheckout = read(files.createCheckout);
const createAddonCheckout = read(files.createAddonCheckout);
const stripeWebhook = read(files.stripeWebhook);
const verifyPayment = read(files.verifyPayment);
const bookingReturn = read(files.bookingReturn);
const guestPayment = read(files.guestPayment);

check("stripe-webhook is public for Stripe callbacks", () => {
  assertContains(config, /\[functions\.stripe-webhook\]\s+verify_jwt\s*=\s*false/s, "stripe-webhook must have verify_jwt = false");
});

check("verify-payment is public for return-page verification", () => {
  assertContains(config, /\[functions\.verify-payment\]\s+verify_jwt\s*=\s*false/s, "verify-payment must have verify_jwt = false");
});

check("direct booking checkout returns session and booking identifiers", () => {
  assertContains(createBooking, "booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=", "create-booking success URL must include session_id and booking_id");
  assertContains(createBooking, "booking-cancelled?booking_id=", "create-booking cancel URL must include booking_id");
  assertContains(createBooking, "client_reference_id: booking.id", "create-booking must set Stripe client_reference_id");
  assertContains(createBooking, "booking_id: booking.id", "create-booking must set booking_id metadata");
});

check("guest balance checkout returns session and booking identifiers", () => {
  assertContains(createBookingPayment, "guest/payment?booking_id=", "create-booking-payment success URL must include booking_id");
  assertContains(createBookingPayment, "session_id={CHECKOUT_SESSION_ID}", "create-booking-payment success URL must include session_id");
  assertContains(createBookingPayment, "client_reference_id: booking.id", "create-booking-payment must set Stripe client_reference_id");
  assertContains(createBookingPayment, "booking_id: booking.id", "create-booking-payment must set booking_id metadata");
});

check("legacy checkout uses minor-unit amount without multiplying by 100", () => {
  assertContains(createCheckout, "booking.amount_remaining ?? booking.total_amount", "create-checkout must prefer amount_remaining/total_amount");
  if (createCheckout.includes("Number(booking.total_amount) * 100")) {
    throw new Error("create-checkout still multiplies total_amount by 100");
  }
});

check("add-on checkout appends order and session identifiers", () => {
  assertContains(createAddonCheckout, "withCheckoutParams", "create-addon-checkout must append checkout params");
  assertContains(createAddonCheckout, "order_id: order.id", "create-addon-checkout success URL must include order_id");
  assertContains(createAddonCheckout, 'session_id: "{CHECKOUT_SESSION_ID}"', "create-addon-checkout success URL must include session_id");
  assertContains(createAddonCheckout, "order_id: order.id", "create-addon-checkout metadata must include order_id");
});

check("webhook verifies Stripe signatures", () => {
  assertContains(stripeWebhook, "constructEventAsync", "stripe-webhook must verify Stripe signatures");
  assertContains(stripeWebhook, "STRIPE_WEBHOOK_SECRET", "stripe-webhook must read STRIPE_WEBHOOK_SECRET");
  assertContains(stripeWebhook, "stripe-signature", "stripe-webhook must require stripe-signature");
});

check("webhook handles required checkout events", () => {
  for (const event of [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ]) {
    assertContains(stripeWebhook, event, `stripe-webhook must handle ${event}`);
  }
});

check("webhook updates booking payment state idempotently", () => {
  assertContains(stripeWebhook, "stripe_checkout_session_id", "stripe-webhook must look up payments by Stripe checkout session");
  assertContains(stripeWebhook, 'status: "completed"', "stripe-webhook must complete payment rows");
  assertContains(stripeWebhook, 'payment_status: paymentStatus', "stripe-webhook must update booking payment_status");
  assertContains(stripeWebhook, "ensurePendingOwnerPayout", "stripe-webhook must create owner payout after final payment");
});

check("return pages call verify-payment with session and booking identifiers", () => {
  assertContains(bookingReturn, "supabase.functions.invoke('verify-payment'", "BookingReturn must invoke verify-payment");
  assertContains(bookingReturn, "body: { bookingId, sessionId }", "BookingReturn must send bookingId and sessionId");
  assertContains(guestPayment, "supabase.functions.invoke('verify-payment'", "GuestPayment must invoke verify-payment");
  assertContains(guestPayment, "body: { bookingId, sessionId }", "GuestPayment must send bookingId and sessionId");
});

check("verify-payment protects booking/session mismatch", () => {
  assertContains(verifyPayment, "Session does not belong to this booking", "verify-payment must reject mismatched booking/session");
  assertContains(verifyPayment, "stripe.checkout.sessions.retrieve", "verify-payment must retrieve Stripe Checkout sessions");
  assertContains(verifyPayment, "ensureListingBlock", "verify-payment must create listing block after confirmed payment");
});

const env = parseEnvFile(".env");
if (env.VITE_STRIPE_PUBLISHABLE_KEY && !/^pk_(test|live)_/.test(env.VITE_STRIPE_PUBLISHABLE_KEY)) {
  errors.push("VITE_STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_");
}

const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = env.VITE_STRIPE_PUBLISHABLE_KEY;
if (secretKey && !/^(sk|rk)_(test|live)_/.test(secretKey)) {
  errors.push("STRIPE_SECRET_KEY must start with sk_test_, sk_live_, rk_test_, or rk_live_");
}
if (secretKey && publishableKey) {
  const secretMode = secretKey.includes("_live_") ? "live" : "test";
  const publishableMode = publishableKey.includes("_live_") ? "live" : "test";
  if (secretMode !== publishableMode) {
    errors.push(`Stripe key mode mismatch: frontend is ${publishableMode}, backend is ${secretMode}`);
  }
} else {
  warnings.push("STRIPE_SECRET_KEY was not available in this shell; live key-mode matching must be checked in Lovable.");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  console.error(`\nStripe flow validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nStripe flow validation passed.");
