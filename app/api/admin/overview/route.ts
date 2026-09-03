import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

const envOr = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value.trim() : fallback;

const SUPABASE_URL = envOr(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://vbayhnlkcoqgssgapaay.supabase.co"
);

function serviceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function stripeMrrCents(secret: string): Promise<number> {
  const stripe = new Stripe(secret);
  let mrr = 0;
  for await (const sub of stripe.subscriptions.list({ status: "active", limit: 100 })) {
    for (const item of sub.items.data) {
      const amount = item.price.unit_amount ?? 0;
      const qty = item.quantity ?? 1;
      const interval = item.price.recurring?.interval ?? "month";
      const count = item.price.recurring?.interval_count ?? 1;
      const monthly =
        interval === "month" ? amount / count : interval === "year" ? amount / (12 * count) : 0;
      mrr += monthly * qty;
    }
  }
  return Math.round(mrr);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const anon = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: userData, error: userErr } = await anon.auth.getUser(token);
  if (userErr || !userData.user || !isAdminEmail(userData.user.email))
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const sb = serviceClient();
  if (!sb)
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 501 }
    );

  const [usersRes, workbooksRes, rowsRes, subsRes] = await Promise.all([
    sb.auth.admin.listUsers({ page: 1, perPage: 500 }),
    sb.from("workbooks").select("id,user_id,file_name,analysis,created_at").order("created_at", { ascending: false }).limit(1000),
    sb.from("entity_rows").select("data", { count: "exact", head: true }),
    sb.from("subscriptions").select("user_id,plan,status,current_period_end"),
  ]);

  const users = (usersRes.data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "—",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));

  const workbooks = (workbooksRes.data ?? []) as {
    id: string;
    user_id: string;
    file_name: string;
    analysis: { stats?: { rows?: number }; entities?: unknown[] };
    created_at: string;
  }[];

  const subs = (subsRes.data ?? []) as {
    user_id: string;
    plan: string;
    status: string;
    current_period_end: string | null;
  }[];
  const activeSubs = subs.filter((s) => s.status === "active");
  const planByUser = new Map(activeSubs.map((s) => [s.user_id, s.plan]));

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const mrrCents = stripeSecret?.trim() ? await stripeMrrCents(stripeSecret).catch(() => 0) : 0;

  const rowsMigrated =
    rowsRes.count ??
    workbooks.reduce((a, w) => a + (w.analysis?.stats?.rows ?? 0), 0);

  return NextResponse.json({
    totals: {
      users: users.length,
      workbooks: workbooks.length,
      rowsMigrated,
      activeSubscriptions: activeSubs.length,
      mrrCents,
    },
    planBreakdown: activeSubs.reduce<Record<string, number>>((acc, s) => {
      acc[s.plan] = (acc[s.plan] ?? 0) + 1;
      return acc;
    }, {}),
    users: users.map((u) => ({
      ...u,
      workbooks: workbooks.filter((w) => w.user_id === u.id).length,
      plan: planByUser.get(u.id) ?? null,
    })),
    stripeMode: stripeSecret?.trim().startsWith("sk_live") ? "live" : "test",
  });
}
