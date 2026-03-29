const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LineItem { label: string; quantity: number; unit_price: number; total: number; item_type: string; }

function formatDKK(øre: number): string {
  return (øre / 100).toLocaleString("da-DK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json();
  const { to, guest_name, house_name, start_date, end_date, guests, total_price, booking_id, line_items, check_in_time, check_out_time, address } = body;

  if (!to || !guest_name || !house_name) {
    return new Response(JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[EMAIL] RESEND_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const items: LineItem[] = line_items || [];
  const lineItemsHtml = items.map((item: LineItem) => `
    <tr>
      <td style="color:#6b7c6e;padding:6px 0;font-size:13px;">${item.label}</td>
      <td style="color:#1a3a2a;text-align:right;padding:6px 0;font-size:13px;">${formatDKK(item.total)} kr.</td>
    </tr>
  `).join("");

  const shortId = booking_id ? booking_id.slice(0, 8).toUpperCase() : "—";
  const totalFormatted = total_price ? formatDKK(total_price) : "—";
  const siteUrl = "https://sommerdroem.lovable.app";

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Georgia','Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;background:#ffffff;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:32px;margin-bottom:4px;">☀️</div>
      <h1 style="color:#1a3a2a;font-size:20px;margin:0;font-weight:600;letter-spacing:0.5px;">SOMMERVIBES</h1>
      <p style="color:#6b7c6e;font-size:11px;margin:4px 0 0;letter-spacing:1px;">SOMMERHUSUDLEJNING</p>
    </div>

    <div style="background:#f8f6f2;border-radius:16px;overflow:hidden;border:1px solid #e8e4dc;">
      <div style="background:#1a3a2a;padding:24px;text-align:center;">
        <div style="font-size:24px;margin-bottom:8px;">✓</div>
        <h2 style="color:#e8dcc8;font-size:22px;margin:0 0 4px;font-weight:600;">Booking bekræftet</h2>
        <p style="color:#8a9e8f;margin:0;font-size:13px;">Tak, ${guest_name}! Din booking er bekræftet og betalt.</p>
      </div>

      <div style="padding:24px;">
        <div style="background:#ffffff;border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;border:1px solid #e8e4dc;">
          <p style="color:#6b7c6e;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Booking reference</p>
          <p style="color:#c4943a;font-size:20px;font-weight:700;margin:0;font-family:monospace;letter-spacing:2px;">${shortId}</p>
        </div>

        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#6b7c6e;padding:10px 0;border-bottom:1px solid #e8e4dc;">Sommerhus</td><td style="color:#1a3a2a;text-align:right;padding:10px 0;font-weight:600;border-bottom:1px solid #e8e4dc;">${house_name}</td></tr>
          <tr><td style="color:#6b7c6e;padding:10px 0;border-bottom:1px solid #e8e4dc;">Ankomst</td><td style="color:#1a3a2a;text-align:right;padding:10px 0;border-bottom:1px solid #e8e4dc;">${formatDate(start_date)}</td></tr>
          <tr><td style="color:#6b7c6e;padding:10px 0;border-bottom:1px solid #e8e4dc;">Afrejse</td><td style="color:#1a3a2a;text-align:right;padding:10px 0;border-bottom:1px solid #e8e4dc;">${formatDate(end_date)}</td></tr>
          <tr><td style="color:#6b7c6e;padding:10px 0;border-bottom:1px solid #e8e4dc;">Gæster</td><td style="color:#1a3a2a;text-align:right;padding:10px 0;border-bottom:1px solid #e8e4dc;">${guests}</td></tr>
        </table>

        ${items.length > 0 ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e8e4dc;">
          <p style="color:#6b7c6e;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Prisoversigt</p>
          <table style="width:100%;border-collapse:collapse;">${lineItemsHtml}</table>
        </div>` : ""}

        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #c4943a;">
          <table style="width:100%;"><tr>
            <td style="color:#c4943a;font-size:16px;font-weight:700;">Total betalt</td>
            <td style="color:#c4943a;text-align:right;font-size:20px;font-weight:700;">${totalFormatted} kr.</td>
          </tr></table>
        </div>
      </div>
    </div>

    <div style="background:#f8f6f2;border-radius:16px;padding:24px;margin-top:16px;border:1px solid #e8e4dc;">
      <h3 style="color:#1a3a2a;font-size:15px;margin:0 0 16px;font-weight:600;">📋 Praktisk information</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="color:#6b7c6e;padding:6px 0;width:100px;">Check-in</td><td style="color:#1a3a2a;padding:6px 0;font-weight:600;">Kl. ${check_in_time || "15:00"}</td></tr>
        <tr><td style="color:#6b7c6e;padding:6px 0;">Check-out</td><td style="color:#1a3a2a;padding:6px 0;font-weight:600;">Kl. ${check_out_time || "10:00"}</td></tr>
        <tr><td style="color:#6b7c6e;padding:6px 0;">Adresse</td><td style="color:#1a3a2a;padding:6px 0;font-weight:600;">${address || "Se booking-detaljer"}</td></tr>
        <tr><td style="color:#6b7c6e;padding:6px 0;">Kontakt</td><td style="color:#1a3a2a;padding:6px 0;font-weight:600;">kontakt@sommervibes.dk</td></tr>
      </table>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <a href="${siteUrl}" style="display:inline-block;background:#1a3a2a;color:#e8dcc8;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;">
        Se mere på SommerVibes →
      </a>
    </div>

    <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e8e4dc;">
      <p style="color:#8a9e8f;font-size:11px;margin:0;">© SommerVibes · København, Danmark</p>
      <p style="color:#b0b8b3;font-size:10px;margin:8px 0 0;">Har du spørgsmål? Skriv til kontakt@sommervibes.dk</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "SommerVibes <onboarding@resend.dev>",
        to: [to],
        subject: `Booking bekræftet — ${house_name} · Ref. ${shortId} ☀️`,
        html: emailHtml,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[EMAIL] Resend error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: data.message || "Email sending failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.log(`[EMAIL] Sent to ${to}, id: ${data.id}`);
    return new Response(JSON.stringify({ success: true, email_id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
