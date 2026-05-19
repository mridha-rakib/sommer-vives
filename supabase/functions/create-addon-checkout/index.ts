import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CheckoutItem = {
  itemType?: string;
  referenceId?: string | null;
  quantity?: number;
};

type BookingLookup = {
  id: string;
  guest_email: string | null;
  guest_id: string | null;
  property_id: string;
};

const FALLBACK_ADDONS: Record<string, { name: string; description: string; price: number }> = {
  early: { name: "Tidlig check-in", description: "Ankom allerede fra kl. 12:00", price: 35000 },
  late: { name: "Sen check-out", description: "Forlæng til kl. 14:00", price: 35000 },
  linen: { name: "Sengelinned & håndklæder", description: "Komplet sæt klar ved ankomst", price: 15000 },
  crib: { name: "Barneseng", description: "Rejseseng med madras", price: 20000 },
  premium: { name: "Velkomstpakke", description: "Lokal vin, blomster og specialiteter", price: 49500 },
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function positiveQuantity(value: unknown) {
  const quantity = Math.round(Number(value || 1));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) return 1;
  return quantity;
}

function withCheckoutParams(url: string, params: Record<string, string>) {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, value);
  }
  return parsed.toString().replaceAll("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
}

async function getActor(req: Request, supabaseUrl: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { userId: null as string | null, userEmail: null as string | null };

  const token = authHeader.replace("Bearer ", "");
  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data } = await anonClient.auth.getUser(token);

  return {
    userId: data.user?.id || null,
    userEmail: data.user?.email || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);

    const body = await req.json();
    const {
      items,
      bookingId,
      userType = "guest",
      propertyId,
      successUrl,
      cancelUrl,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return json({ error: "No items provided" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { userId, userEmail: authenticatedEmail } = await getActor(req, supabaseUrl);

    let userEmail = authenticatedEmail;
    let guestId: string | null = null;
    let orderPropertyId: string | null = null;
    let booking: BookingLookup | null = null;

    if (bookingId) {
      const { data } = await supabase
        .from("bookings")
        .select("id, guest_email, guest_id, property_id")
        .eq("id", bookingId)
        .single();
      if (!data) return json({ error: "Booking not found" }, 404);
      booking = data as BookingLookup;
      userEmail = userEmail || data.guest_email;
      guestId = data.guest_id;
      orderPropertyId = data.property_id;
    }

    if (userType === "owner" && !userId) {
      return json({ error: "Authentication required" }, 401);
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems: Array<Record<string, unknown>> = [];
    let subtotal = 0;
    let packagePurchaseInput: { packageId: string; amount: number; propertyId: string | null } | null = null;

    for (const rawItem of items as CheckoutItem[]) {
      const itemType = rawItem.itemType || "addon";
      const quantity = positiveQuantity(rawItem.quantity);
      const referenceId = rawItem.referenceId;

      if (!referenceId) return json({ error: "Item referenceId required" }, 400);

      if (itemType === "addon") {
        const { data: addOn } = await supabase
          .from("add_ons")
          .select("id, name, description, price, listing_id")
          .eq("id", referenceId)
          .eq("is_active", true)
          .single();

        const fallbackAddOn = FALLBACK_ADDONS[referenceId];
        if (!addOn && (!fallbackAddOn || !booking)) return json({ error: "Add-on not found" }, 404);
        if (addOn && booking && addOn.listing_id !== booking.property_id) {
          return json({ error: "Add-on does not belong to this booking" }, 400);
        }

        const resolvedAddOn = addOn || {
          id: null,
          name: fallbackAddOn.name,
          description: fallbackAddOn.description,
          price: fallbackAddOn.price,
        };
        const unitAmount = Math.round(Number(resolvedAddOn.price || 0));
        const itemTotal = unitAmount * quantity;
        subtotal += itemTotal;

        lineItems.push({
          price_data: {
            currency: "dkk",
            unit_amount: unitAmount,
            product_data: {
              name: resolvedAddOn.name,
              description: resolvedAddOn.description || undefined,
            },
          },
          quantity,
        });

        orderItems.push({
          item_type: "addon",
          reference_id: resolvedAddOn.id,
          label: resolvedAddOn.name,
          description: resolvedAddOn.description || null,
          quantity,
          unit_price: unitAmount,
          total: itemTotal,
        });
        continue;
      }

      if (itemType === "service_package") {
        if (userType !== "owner" || !userId) {
          return json({ error: "Owner authentication required for service packages" }, 401);
        }

        const { data: servicePackage } = await supabase
          .from("service_packages")
          .select("id, name, description, price")
          .eq("id", referenceId)
          .eq("is_active", true)
          .single();

        if (!servicePackage) return json({ error: "Service package not found" }, 404);

        const normalizedPropertyId = propertyId && propertyId !== "all" ? propertyId : null;
        if (normalizedPropertyId) {
          const { data: property } = await supabase
            .from("properties")
            .select("id")
            .eq("id", normalizedPropertyId)
            .eq("owner_id", userId)
            .single();
          if (!property) return json({ error: "Property not found" }, 404);
        }

        const unitAmount = Math.round(Number(servicePackage.price || 0) * 100);
        const itemTotal = unitAmount * quantity;
        subtotal += itemTotal;
        packagePurchaseInput = {
          packageId: servicePackage.id,
          amount: Number(servicePackage.price || 0),
          propertyId: normalizedPropertyId,
        };
        orderPropertyId = normalizedPropertyId;

        lineItems.push({
          price_data: {
            currency: "dkk",
            unit_amount: unitAmount,
            product_data: {
              name: servicePackage.name,
              description: servicePackage.description || undefined,
            },
          },
          quantity,
        });

        orderItems.push({
          item_type: "service_package",
          reference_id: servicePackage.id,
          label: servicePackage.name,
          description: servicePackage.description || null,
          quantity,
          unit_price: unitAmount,
          total: itemTotal,
        });
        continue;
      }

      return json({ error: `Unsupported item type: ${itemType}` }, 400);
    }

    if (subtotal <= 0) return json({ error: "Checkout total must be greater than zero" }, 400);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_type: userType,
        user_id: userId,
        guest_id: guestId,
        booking_id: bookingId || null,
        property_id: orderPropertyId,
        subtotal,
        total: subtotal,
        currency: "DKK",
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return json({ error: "Failed to create order" }, 500);
    }

    let packagePurchaseId = "";
    if (packagePurchaseInput && userId) {
      const { data: purchase, error: purchaseError } = await supabase
        .from("package_purchases")
        .insert({
          owner_id: userId,
          property_id: packagePurchaseInput.propertyId,
          package_id: packagePurchaseInput.packageId,
          amount: packagePurchaseInput.amount,
          status: "pending",
          payment_status: "pending",
          notes: `Order ${order.id}`,
        })
        .select("id")
        .single();

      if (purchaseError || !purchase) {
        console.error("Package purchase creation error:", purchaseError);
        return json({ error: "Failed to create package purchase" }, 500);
      }
      packagePurchaseId = purchase.id;
    }

    await supabase.from("order_items").insert(orderItems.map(item => ({ ...item, order_id: order.id })));

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "https://sommervibes.dk";
    const baseSuccessUrl = successUrl || `${origin}/guest?payment=success`;
    const baseCancelUrl = cancelUrl || `${origin}/guest?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: withCheckoutParams(baseSuccessUrl, {
        order_id: order.id,
        session_id: "{CHECKOUT_SESSION_ID}",
      }),
      cancel_url: withCheckoutParams(baseCancelUrl, { order_id: order.id }),
      customer_email: userEmail || undefined,
      metadata: {
        order_id: order.id,
        booking_id: bookingId || "",
        user_type: userType,
        package_purchase_id: packagePurchaseId,
      },
      line_items: lineItems,
    });

    await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        payment_status: "pending",
      })
      .eq("id", order.id);

    return json({ url: session.url, sessionId: session.id, orderId: order.id });
  } catch (err) {
    console.error("Addon checkout error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
