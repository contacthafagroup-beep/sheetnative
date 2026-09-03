"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Check, Sparkles, Zap, Loader2, ExternalLink } from "lucide-react";
import { Badge, Button, Card, StatCard, cx } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";

const PLANS = [
  { id: "starter", name: "Starter", price: 99, aiCredits: "5k", seats: "3 seats" },
  { id: "growth", name: "Growth", price: 299, aiCredits: "25k", seats: "10 seats" },
  { id: "business", name: "Business", price: 799, aiCredits: "100k", seats: "30 seats" },
  { id: "pro", name: "Pro", price: 1499, aiCredits: "400k", seats: "Unlimited seats" },
];

const INVOICES = [
  { id: "INV-2026-091", date: "Sep 1, 2026", amount: 299, status: "paid" },
  { id: "INV-2026-088", date: "Aug 1, 2026", amount: 299, status: "paid" },
  { id: "INV-2026-075", date: "Jul 1, 2026", amount: 99, status: "paid" },
];

interface Subscription {
  plan: string;
  interval: string;
  status: string;
}

export default function BillingPage() {
  const [current, setCurrent] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      const { data: s } = await getSupabase().auth.getSession();
      if (!s.session) return;
      const { data } = await getSupabase()
        .from("subscriptions")
        .select("plan,interval,status")
        .eq("user_id", s.session.user.id)
        .maybeSingle();
      if (data && data.status === "active") {
        setCurrent(data.plan);
        setAnnual(data.interval === "annual");
      }
    } catch {
      /* first visit — no subscription yet */
    }
  }, []);

  useEffect(() => {
    loadSubscription();
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") loadSubscription();
  }, [loadSubscription]);

  const checkout = async (planId: string) => {
    setLoadingPlan(planId);
    setError(null);
    try {
      const { data: s } = await getSupabase().auth.getSession();
      if (!s.session) { setError("Sign in first."); return; }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s.session.access_token}`,
        },
        body: JSON.stringify({ plan: planId, interval: annual ? "annual" : "monthly" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Checkout failed.");
        return;
      }
      if (json.url) window.location.href = json.url;
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-1 text-sm text-slate-400">Stripe-powered subscriptions, usage billing and AI credits.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
          {["Monthly", "Annual"].map((m, i) => (
            <button key={m} onClick={() => setAnnual(i === 1)}
              className={cx("rounded-lg px-3 py-1.5 text-xs font-medium transition",
                annual === (i === 1) ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400")}>
              {m}{i === 1 && <span className="ml-1 text-emerald-400">−17%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current plan" value={current ? PLANS.find((p) => p.id === current)?.name ?? current : "Free trial"} sub={current ? "active subscription" : "no card on file"} icon={<CreditCard className="h-4 w-4" />} />
        <StatCard label="AI credits used" value="18,240" sub={current ? `of ${PLANS.find((p) => p.id === current)?.aiCredits} monthly` : "trial allowance"} icon={<Sparkles className="h-4 w-4" />} tone="warn" />
        <StatCard label="Automations run" value="1,902" sub="this month" icon={<Zap className="h-4 w-4" />} tone="good" />
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const price = annual ? Math.round(p.price * 10 / 12) : p.price;
          const isCurrent = current === p.id;
          return (
            <Card key={p.id} className={cx(isCurrent && "border-indigo-500/40")}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {isCurrent && <Badge tone="brand">current</Badge>}
              </div>
              <div className="mt-2 text-2xl font-semibold">${price}<span className="text-xs font-normal text-slate-500">/mo</span></div>
              <div className="mt-1 text-xs text-slate-500">{p.aiCredits} AI credits · {p.seats}</div>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                {["AI interpreter", "All platforms", "Automations", "API access"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-400" />{f}</li>
                ))}
              </ul>
              <Button size="sm" variant={isCurrent ? "outline" : "primary"} className="mt-4 w-full" disabled={isCurrent || loadingPlan !== null}
                onClick={() => checkout(p.id)}>
                {loadingPlan === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isCurrent ? "Active" : `Switch to ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Need something custom?</h2>
            <p className="mt-0.5 text-xs text-slate-500">Enterprise: SSO/SAML, HIPAA mode, private cloud, dedicated infrastructure.</p>
          </div>
          <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" /> Contact sales</Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold">Invoices</h2>
        <div className="space-y-2">
          {INVOICES.map((i) => (
            <div key={i.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-sm">
              <span className="font-mono text-xs text-slate-400">{i.id}</span>
              <span className="text-slate-500">{i.date}</span>
              <span className="ml-auto font-medium">${i.amount}</span>
              <Badge tone="good">{i.status}</Badge>
              <button className="text-xs text-indigo-300 hover:text-indigo-200">PDF</button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-600">
          Live invoices appear here once Stripe is connected (customer portal integration).
        </p>
      </Card>
    </div>
  );
}
