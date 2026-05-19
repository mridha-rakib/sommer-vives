import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = {
  publishFunction: "supabase/functions/beds24-publish/index.ts",
  publishDialog: "src/components/admin/Beds24PublishDialog.tsx",
  publishFlowModal: "src/components/admin/PublishFlowModal.tsx",
  integration: "src/components/admin/Beds24Integration.tsx",
  docs: "docs/remaining-tasks.md",
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

const publishFunction = read(files.publishFunction);
const publishDialog = read(files.publishDialog);
const publishFlowModal = read(files.publishFlowModal);
const integration = read(files.integration);
const docs = read(files.docs);

check("beds24-publish requires POST and admin authorization", () => {
  assertContains(publishFunction, 'req.method !== "POST"', "beds24-publish must reject non-POST requests");
  assertContains(publishFunction, "getActor", "beds24-publish must resolve the authenticated actor");
  assertContains(publishFunction, 'roles.includes("admin")', "beds24-publish must require admin role");
  assertContains(publishFunction, 'roles.includes("super_admin")', "beds24-publish must allow super_admin role");
});

check("native Beds24 API V2 path is implemented", () => {
  assertContains(publishFunction, "https://beds24.com/api/v2", "native Beds24 API base URL must default to API V2");
  assertContains(publishFunction, '"/properties"', "native publish must call POST /properties");
  assertContains(publishFunction, '"/inventory/rooms/calendar"', "native publish must call POST /inventory/rooms/calendar");
  assertContains(publishFunction, "token,", "native calls must send the Beds24 token header");
});

check("refresh token and middleware fallback are supported", () => {
  assertContains(publishFunction, "BEDS24_REFRESH_TOKEN", "beds24-publish must support refresh-token based API V2 auth");
  assertContains(publishFunction, "/authentication/token", "beds24-publish must exchange refresh tokens for API tokens");
  assertContains(publishFunction, "BEDS24_PUBLISH_URL", "beds24-publish must preserve middleware compatibility");
  assertContains(publishFunction, "BEDS24_INTEGRATION_MODE", "beds24-publish must allow explicit native/middleware mode");
});

check("publish payload maps listing, room, and calendar data", () => {
  assertContains(publishFunction, "buildBeds24PropertyPayload", "beds24-publish must build native property payload");
  assertContains(publishFunction, "roomTypes", "Beds24 property payload must include roomTypes");
  assertContains(publishFunction, "groupCalendarSegments", "beds24-publish must generate grouped calendar ranges");
  assertContains(publishFunction, "season_rules", "calendar sync must include season rules");
  assertContains(publishFunction, "daily_price_overrides", "calendar sync must include daily overrides");
});

check("status tracking and rollback are durable", () => {
  assertContains(publishFunction, "beds24_publish_initiated", "beds24-publish must audit publish initiation");
  assertContains(publishFunction, "beds24_status_synced", "beds24-publish must audit successful sync");
  assertContains(publishFunction, "beds24_status_error", "beds24-publish must audit failed sync");
  assertContains(publishFunction, "rolled_back: true", "beds24-publish must report rollback on failure");
  assertContains(publishFunction, "beds24_last_publish_payload", "beds24-publish must store last payload");
  assertContains(publishFunction, "beds24_last_response", "beds24-publish must store Beds24 response");
});

check("admin publish UI invokes beds24-publish", () => {
  assertContains(publishDialog, "supabase.functions.invoke('beds24-publish'", "Beds24PublishDialog must invoke beds24-publish");
  assertContains(publishFlowModal, "supabase.functions.invoke('beds24-publish'", "PublishFlowModal must invoke beds24-publish");
  assertContains(integration, "Beds24 Room ID", "Beds24Integration must expose Beds24 room mapping");
});

check("remaining tasks mention native API credentials", () => {
  assertContains(docs, "BEDS24_API_TOKEN", "remaining tasks must mention Beds24 API token");
});

if (!process.env.BEDS24_API_TOKEN && !process.env.BEDS24_REFRESH_TOKEN && !process.env.BEDS24_PUBLISH_URL) {
  warnings.push("No Beds24 credentials were available in this shell; live publish must be verified in Lovable/Supabase.");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  console.error(`\nBeds24 flow validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nBeds24 flow validation passed.");
