import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-automation-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseServiceClient = SupabaseClient<any, "public", any>;

type AutomationRule = {
  id: string;
  name: string;
  trigger_event: string;
  action_type: string;
  action_config: JsonRecord | null;
  delay_minutes: number | null;
  is_active: boolean;
};

type AutomationExecution = {
  id: string;
  automation_rule_id: string;
  trigger_event: string;
  payload: JsonRecord;
};

type BookingAutomationRecord = {
  id: string;
  owner_id: string;
  property_id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  guests_count: number | null;
  nights: number | null;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
};

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function isAuthorized(req: Request) {
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const automationSecret = Deno.env.get("AUTOMATION_RUN_SECRET") || "";
  const providedSecret = req.headers.get("x-automation-secret") || "";

  if ((serviceRoleKey && bearer === serviceRoleKey) || (automationSecret && providedSecret === automationSecret)) {
    return true;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = req.headers.get("authorization") || "";
  if (!supabaseUrl || !anonKey || !authorization) return false;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return false;

  const { data: roles } = await userClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"]);

  return (roles || []).length > 0;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function renderTemplate(template: unknown, payload: JsonRecord) {
  const source = asString(template);
  return source.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const value = key.split(".").reduce<unknown>((current, part) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as JsonRecord)[part];
    }, payload);
    return value === undefined || value === null ? "" : String(value);
  });
}

function dateAfterDays(days: unknown) {
  const parsed = Math.max(0, Math.round(Number(days || 0)));
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + parsed);
  return date.toISOString().split("T")[0];
}

function getRecipientEmail(config: JsonRecord, payload: JsonRecord) {
  return asString(config.to)
    || asString(payload.recipient_email)
    || asString(payload.guest_email)
    || asString(payload.owner_email)
    || asString(payload.email);
}

function getRecipientUserId(config: JsonRecord, payload: JsonRecord) {
  return asString(config.user_id)
    || asString(payload.recipient_user_id)
    || asString(payload.owner_id)
    || asString(payload.user_id);
}

async function enqueueEvent(
  supabase: SupabaseServiceClient,
  event: string,
  eventId: string | null,
  payload: JsonRecord,
) {
  const { data: rules, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("is_active", true)
    .eq("trigger_event", event);

  if (error) throw error;

  let queued = 0;
  for (const rule of (rules || []) as AutomationRule[]) {
    if (eventId) {
      const { data: existing } = await supabase
        .from("automation_executions")
        .select("id")
        .eq("automation_rule_id", rule.id)
        .eq("event_id", eventId)
        .maybeSingle();
      if (existing) continue;
    }

    const scheduledFor = new Date(Date.now() + Math.max(0, rule.delay_minutes || 0) * 60_000).toISOString();
    const { error: insertError } = await supabase.from("automation_executions").insert({
      automation_rule_id: rule.id,
      trigger_event: event,
      event_id: eventId,
      payload,
      scheduled_for: scheduledFor,
      status: "pending",
    });

    if (!insertError) queued += 1;
  }

  return queued;
}

function dateInTimeZone(daysFromNow: number, timeZone = "Europe/Copenhagen") {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function buildBookingPayload(booking: BookingAutomationRecord, event: string, eventDate: string) {
  return {
    linked_type: "booking",
    linked_id: booking.id,
    booking_id: booking.id,
    listing_id: booking.property_id,
    property_id: booking.property_id,
    owner_id: booking.owner_id,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone,
    check_in: booking.check_in,
    check_out: booking.check_out,
    start_date: booking.check_in,
    end_date: booking.check_out,
    guests: booking.guests_count || 1,
    nights: booking.nights || null,
    total_amount: booking.total_amount || 0,
    payment_status: booking.payment_status,
    status: booking.status,
    trigger_event: event,
    trigger_date: eventDate,
    link: `/admin/sager/${booking.property_id}`,
  };
}

async function enqueueScheduledBookingEvents(supabase: SupabaseServiceClient) {
  const tomorrow = dateInTimeZone(1);
  const scheduledEvents = [
    { event: "checkin_tomorrow", column: "check_in" },
    { event: "checkout_tomorrow", column: "check_out" },
  ];

  let queued = 0;
  for (const scheduledEvent of scheduledEvents) {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, owner_id, property_id, guest_name, guest_email, guest_phone, check_in, check_out, guests_count, nights, total_amount, payment_status, status")
      .in("status", ["confirmed", "checked_in"])
      .eq(scheduledEvent.column, tomorrow);

    if (error) throw error;

    for (const booking of (bookings || []) as BookingAutomationRecord[]) {
      queued += await enqueueEvent(
        supabase,
        scheduledEvent.event,
        `${scheduledEvent.event}:${booking.id}:${tomorrow}`,
        buildBookingPayload(booking, scheduledEvent.event, tomorrow),
      );
    }
  }

  return queued;
}

async function executeEmail(rule: AutomationRule, payload: JsonRecord) {
  const config = rule.action_config || {};
  const to = getRecipientEmail(config, payload);
  if (!to) return { status: "skipped", reason: "No recipient email" };

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not configured");

  const subject = renderTemplate(config.subject || rule.name, payload) || rule.name;
  const body = renderTemplate(config.body || "", payload);
  const html = body.replace(/\n/g, "<br />");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html: html || subject,
    }),
  });

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(asString((responseBody as JsonRecord).message) || "Email sending failed");

  return { status: "completed", email_id: (responseBody as JsonRecord).id || null };
}

async function executeNotification(
  supabase: SupabaseServiceClient,
  rule: AutomationRule,
  payload: JsonRecord,
) {
  const config = rule.action_config || {};
  const userId = getRecipientUserId(config, payload);
  if (!userId) return { status: "skipped", reason: "No recipient user id" };

  const title = renderTemplate(config.title || config.subject || rule.name, payload) || rule.name;
  const body = renderTemplate(config.body || "", payload) || null;

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    category: "automation",
    channel: "in_app",
    title,
    body,
    link: asString(config.link) || asString(payload.link) || null,
    sent_at: new Date().toISOString(),
  });
  if (error) throw error;

  return { status: "completed" };
}

async function executeTask(
  supabase: SupabaseServiceClient,
  rule: AutomationRule,
  payload: JsonRecord,
) {
  const config = rule.action_config || {};
  const title = renderTemplate(config.title || config.subject || rule.name, payload) || rule.name;
  const description = renderTemplate(config.body || config.description || "", payload) || null;
  const linkedType = asString(config.linked_type) || asString(payload.linked_type) || null;
  const allowedLinkedTypes = new Set(["lead", "owner", "guest", "listing", "document", "meeting", "booking"]);
  const normalizedLinkedType = linkedType && allowedLinkedTypes.has(linkedType) ? linkedType : null;

  const { error } = await supabase.from("system_tasks").insert({
    title,
    description,
    linked_type: normalizedLinkedType,
    linked_id: asString(config.linked_id) || asString(payload.linked_id) || asString(payload.booking_id) || asString(payload.listing_id) || null,
    linked_name: asString(config.linked_name) || asString(payload.linked_name) || asString(payload.guest_name) || null,
    assigned_to: asString(config.assigned_to) || null,
    assigned_name: asString(config.assigned_name) || null,
    due_date: dateAfterDays(config.due_in_days),
    priority: asString(config.priority) || "normal",
    source: "system",
    category: "automation",
    notes: `Automation: ${rule.name}`,
  });
  if (error) throw error;

  return { status: "completed" };
}

async function executeAction(
  supabase: SupabaseServiceClient,
  rule: AutomationRule,
  payload: JsonRecord,
) {
  if (rule.action_type === "email") return executeEmail(rule, payload);
  if (rule.action_type === "notification") return executeNotification(supabase, rule, payload);
  if (rule.action_type === "task") return executeTask(supabase, rule, payload);
  return { status: "skipped", reason: `Unsupported action type: ${rule.action_type}` };
}

async function processDueExecutions(supabase: SupabaseServiceClient, limit: number) {
  const { data: executions, error } = await supabase
    .from("automation_executions")
    .select("id, automation_rule_id, trigger_event, payload")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const results: JsonRecord[] = [];
  for (const execution of (executions || []) as AutomationExecution[]) {
    const { data: claimed, error: claimError } = await supabase
      .from("automation_executions")
      .update({ status: "running" })
      .eq("id", execution.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimError) throw claimError;
    if (!claimed) continue;

    try {
      const { data: rule, error: ruleError } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("id", execution.automation_rule_id)
        .single();
      if (ruleError || !rule || !rule.is_active) {
        await supabase.from("automation_executions").update({
          status: "skipped",
          executed_at: new Date().toISOString(),
          error: ruleError?.message || "Rule inactive or missing",
        }).eq("id", execution.id);
        continue;
      }

      const actionResult = await executeAction(supabase, rule as AutomationRule, execution.payload || {});
      const status = actionResult.status === "skipped" ? "skipped" : "completed";
      await supabase.from("automation_executions").update({
        status,
        executed_at: new Date().toISOString(),
        result: actionResult,
      }).eq("id", execution.id);

      if (status === "completed") {
        await supabase.rpc("increment_automation_rule_trigger", { p_rule_id: rule.id });
      }
      results.push({ execution_id: execution.id, status });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabase.from("automation_executions").update({
        status: "failed",
        executed_at: new Date().toISOString(),
        error: message,
      }).eq("id", execution.id);
      results.push({ execution_id: execution.id, status: "failed", error: message });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  if (!(await isAuthorized(req))) return json({ error: "Not authorized" }, 401);

  try {
    const body = await req.json().catch(() => ({})) as JsonRecord;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase service role is not configured" }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const event = asString(body.event) || asString(body.trigger_event);
    const eventId = asString(body.eventId) || asString(body.event_id) || null;
    const payload = (body.payload && typeof body.payload === "object" && !Array.isArray(body.payload))
      ? body.payload as JsonRecord
      : {};
    const limit = Math.min(100, Math.max(1, Math.round(Number(body.limit || 25))));
    const runScheduledTriggers = body.runScheduledTriggers === true || (!event && body.runScheduledTriggers !== false);

    let queued = 0;
    if (event) queued = await enqueueEvent(supabase, event, eventId, payload);
    const scheduledQueued = runScheduledTriggers ? await enqueueScheduledBookingEvents(supabase) : 0;

    const processed = await processDueExecutions(supabase, limit);
    return json({ success: true, queued, scheduledQueued, processed, processedCount: processed.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
