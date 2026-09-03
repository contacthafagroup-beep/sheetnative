import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPlan, annualMonthly } from "@/lib/billing";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const envOr = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value.trim() : fallback;

const SUPABASE_URL = envOr(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://vbayhnlkcoqgssgapaay.supabase.co"
);
const SUPABASE_ANON_KEY = envOr(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "sb_publishable_jBoN1Vj0SoRRRnPEbPnn4A_1b0pYPWC"
);

function siteUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env;
  const v = process.env.VERCEL_URL;
  if (v) return `https://${v}`;
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret)
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment." },
      { status: 501 }
    );

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user)
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const user = userData.user;

  let body: { plan?: string; interval?: "monthly" | "annual" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const plan = getPlan(body.plan ?? "");
  if (!plan)
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  const annual = body.interval === "annual";
  const unitAmount = (annual ? annualMonthly(plan.monthly) : plan.monthly) * 100;

  const stripe = new Stripe(secret);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          recurring: { interval: annual ? "year" : "month" },
          product_data: {
            name: `SheetNative ${plan.name} (${annual ? "annual" : "monthly"})`,
            description: `${plan.aiCredits} AI credits/mo · ${plan.seats}`,
          },
        },
      },
    ],
    metadata: { plan: plan.id, interval: annual ? "annual" : "monthly", user_id: user.id },
    subscription_data: { metadata: { plan: plan.id, user_id: user.id } },
    success_url: `${siteUrl(req)}/app/billing?checkout=success`,
    cancel_url: `${siteUrl(req)}/app/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
