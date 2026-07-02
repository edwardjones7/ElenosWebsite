import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import { notifyDiscord } from "@/lib/discord";
import { sendCoursePurchaseEmail } from "@/lib/email";

export const runtime = "nodejs";

const TOLERANCE_SECONDS = 300;

/** Verify Stripe's webhook signature header (t=...,v1=...) against the raw
 *  body. Done by hand with node:crypto so we don't need the stripe SDK for
 *  a single event type. https://docs.stripe.com/webhooks?verify=verify-manually */
function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = new Map(header.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET unset — webhook rejected");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  let event: Record<string, any> = {};
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  // Only checkout completions matter; acknowledge everything else so Stripe
  // stops retrying.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object || {};
  const email = String(session.customer_details?.email || session.customer_email || "").toLowerCase();
  const name = session.customer_details?.name ? String(session.customer_details.name).slice(0, 120) : null;
  const sessionId = String(session.id || "");

  if (!email || !sessionId) {
    console.error("checkout.session.completed missing email or id", sessionId);
    return NextResponse.json({ received: true });
  }

  const { data, error } = await getSupabase()
    .from("purchases")
    .upsert(
      {
        name,
        email,
        product: "first-ai-client",
        stripe_session_id: sessionId,
        stripe_payment_intent: session.payment_intent ? String(session.payment_intent) : null,
        amount_cents: typeof session.amount_total === "number" ? session.amount_total : null,
        currency: session.currency ? String(session.currency) : null,
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: false },
    )
    .select("id, delivered_at");

  if (error) {
    // Non-200 makes Stripe retry, which is what we want on a db hiccup.
    console.error("purchase upsert failed", error.message);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  const purchase = data && data[0];

  // Stripe retries and can send the same event twice — don't re-deliver.
  if (purchase?.delivered_at) {
    return NextResponse.json({ received: true });
  }

  const { sent } = await sendCoursePurchaseEmail({ name, email });

  if (purchase) {
    await getSupabase()
      .from("purchases")
      .update(
        sent
          ? { status: "delivered", delivered_at: new Date().toISOString() }
          : { status: "delivery_failed" },
      )
      .eq("id", purchase.id);
  }

  await notifyDiscord("sales", {
    title: sent
      ? "💸 Course sale — first-ai-client"
      : "💸 Course sale — delivery FAILED, send PDFs manually",
    fields: [
      { name: "Name", value: name ?? "", inline: true },
      { name: "Email", value: email, inline: true },
      {
        name: "Amount",
        value:
          typeof session.amount_total === "number"
            ? `$${(session.amount_total / 100).toFixed(2)} ${String(session.currency || "usd").toUpperCase()}`
            : "",
        inline: true,
      },
    ],
  });

  return NextResponse.json({ received: true });
}
