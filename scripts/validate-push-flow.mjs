import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const files = {
  webPush: "src/lib/webPush.ts",
  chatNotifications: "src/lib/chatNotifications.ts",
  chatAttachments: "src/lib/chatAttachments.ts",
  sendChatPush: "supabase/functions/send-chat-push/index.ts",
  serviceWorker: "public/sw.js",
  migration: "supabase/migrations/20260511040000_complete_chat_messaging_feature.sql",
  guestLayout: "src/components/layout/GuestLayout.tsx",
  ownerLayout: "src/components/layout/OwnerLayout.tsx",
  adminLayout: "src/components/layout/AdminLayout.tsx",
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

const webPush = read(files.webPush);
const chatNotifications = read(files.chatNotifications);
const chatAttachments = read(files.chatAttachments);
const sendChatPush = read(files.sendChatPush);
const serviceWorker = read(files.serviceWorker);
const migration = read(files.migration);
const guestLayout = read(files.guestLayout);
const ownerLayout = read(files.ownerLayout);
const adminLayout = read(files.adminLayout);

check("frontend reads VITE_VAPID_PUBLIC_KEY", () => {
  assertContains(webPush, "VITE_VAPID_PUBLIC_KEY", "webPush must read VITE_VAPID_PUBLIC_KEY");
  assertContains(webPush, "urlBase64ToUint8Array", "webPush must convert VAPID key for PushManager");
});

check("frontend registers service worker and push subscription", () => {
  assertContains(webPush, "navigator.serviceWorker.register('/sw.js')", "webPush must register /sw.js");
  assertContains(webPush, "registration.pushManager.subscribe", "webPush must subscribe via PushManager");
  assertContains(webPush, "userVisibleOnly: true", "Push subscriptions must use userVisibleOnly");
  assertContains(webPush, "applicationServerKey", "Push subscriptions must pass VAPID public key");
});

check("frontend stores subscriptions in Supabase", () => {
  assertContains(webPush, "push_subscriptions", "webPush must write push_subscriptions");
  assertContains(webPush, "onConflict: 'endpoint'", "webPush must upsert by endpoint");
  assertContains(webPush, "disabled_at: null", "webPush must reactivate known subscriptions");
  assertContains(webPush, "select('id').single()", "webPush must surface upsert errors");
});

check("notification permission and layout hooks are wired", () => {
  assertContains(chatNotifications, "Notification.requestPermission", "chatNotifications must request notification permission");
  assertContains(chatNotifications, "useWebPushRegistration(userId)", "chatNotifications must call useWebPushRegistration");
  assertContains(guestLayout, "useChatNotifications(user?.id)", "GuestLayout must register push notifications");
  assertContains(ownerLayout, "useChatNotifications(user?.id)", "OwnerLayout must register push notifications");
  assertContains(adminLayout, "useChatNotifications(user?.id)", "AdminLayout must register push notifications");
});

check("chat send path invokes push edge function", () => {
  assertContains(chatAttachments, "send-chat-push", "chatAttachments must invoke send-chat-push after message send");
  assertContains(chatAttachments, "messageId", "send-chat-push must receive messageId");
});

check("service worker handles push and notification click", () => {
  assertContains(serviceWorker, "self.addEventListener('push'", "service worker must handle push events");
  assertContains(serviceWorker, "showNotification", "service worker must show notifications");
  assertContains(serviceWorker, "self.addEventListener('notificationclick'", "service worker must handle notification clicks");
  assertContains(serviceWorker, "clients.openWindow", "service worker must open app URL on click");
});

check("send-chat-push requires POST and push secrets", () => {
  assertContains(sendChatPush, 'req.method !== "POST"', "send-chat-push must reject non-POST requests");
  assertContains(sendChatPush, "VAPID_PUBLIC_KEY", "send-chat-push must read VAPID_PUBLIC_KEY");
  assertContains(sendChatPush, "VAPID_PRIVATE_KEY", "send-chat-push must read VAPID_PRIVATE_KEY");
  assertContains(sendChatPush, "VAPID_SUBJECT", "send-chat-push must read VAPID_SUBJECT");
  assertContains(sendChatPush, "webpush.setVapidDetails", "send-chat-push must configure VAPID details");
});

check("send-chat-push resolves recipients and preferences", () => {
  assertContains(sendChatPush, "recipient_id", "send-chat-push must support direct recipients");
  assertContains(sendChatPush, "user_roles", "send-chat-push must resolve admin recipients");
  assertContains(sendChatPush, "notification_preferences", "send-chat-push must respect notification preferences");
  assertContains(sendChatPush, "push_enabled", "send-chat-push must check push_enabled");
});

check("send-chat-push disables stale subscriptions and reports stats", () => {
  assertContains(sendChatPush, "statusCode === 404", "send-chat-push must detect missing subscriptions");
  assertContains(sendChatPush, "statusCode === 410", "send-chat-push must detect expired subscriptions");
  assertContains(sendChatPush, "disabled_at", "send-chat-push must disable stale subscriptions");
  assertContains(sendChatPush, "subscriptions", "send-chat-push must return subscription stats");
});

check("push_subscriptions migration and RLS exist", () => {
  assertContains(migration, "CREATE TABLE IF NOT EXISTS public.push_subscriptions", "migration must create push_subscriptions");
  assertContains(migration, "endpoint text NOT NULL UNIQUE", "push_subscriptions.endpoint must be unique");
  assertContains(migration, "ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY", "push_subscriptions must have RLS enabled");
  assertContains(migration, "Users manage own push subscriptions", "users must manage own subscriptions");
  assertContains(migration, "idx_push_subscriptions_user_active", "active subscription index must exist");
});

const env = parseEnvFile(".env");
if (!env.VITE_VAPID_PUBLIC_KEY) {
  errors.push("VITE_VAPID_PUBLIC_KEY is missing in .env");
}

if (!process.env.VAPID_PUBLIC_KEY) {
  warnings.push("VAPID_PUBLIC_KEY was not available in this shell; verify Lovable secret before live testing.");
}
if (!process.env.VAPID_PRIVATE_KEY) {
  warnings.push("VAPID_PRIVATE_KEY was not available in this shell; verify Lovable secret before live testing.");
}
if (!process.env.VAPID_SUBJECT) {
  warnings.push("VAPID_SUBJECT was not available in this shell; verify Lovable secret before live testing.");
} else if (!/^(mailto:|https:\/\/)/.test(process.env.VAPID_SUBJECT)) {
  errors.push("VAPID_SUBJECT should start with mailto: or https://");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  console.error(`\nPush flow validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nPush flow validation passed.");
