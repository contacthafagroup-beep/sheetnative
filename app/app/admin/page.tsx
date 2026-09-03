"use client";

import { useEffect, useState } from "react";
import { Users, Database, Bot, DollarSign, ShieldHalf, Loader2, Ban } from "lucide-react";
import { Badge, Card, StatCard, cx } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/admin";

interface Overview {
  totals: {
    users: number;
    workbooks: number;
    rowsMigrated: number;
    activeSubscriptions: number;
    mrrCents: number;
  };
  planBreakdown: Record<string, number>;
  users: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    workbooks: number;
    plan: string | null;
  }[];
  stripeMode: "live" | "test";
}

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      const { data: s } = await sb.auth.getSession();
      if (!isAdminEmail(s.session?.user?.email)) {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      try {
        const res = await fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${s.session!.access_token}` },
        });
        const json = await res.json();
        if (!res.ok) setError(json.error ?? "Failed to load.");
        else setData(json);
      } catch {
        setError("Failed to reach the admin API.");
      }
    })();
  }, []);

  if (allowed === null)
    return (
      <div className="flex justify-center p-24">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );

  if (!allowed)
    return (
      <div className="mx-auto max-w-md p-16 text-center animate-rise">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15">
          <Ban className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="text-lg font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-slate-400">
          This area is restricted to the platform owner.
        </p>
      </div>
    );

  const t = data?.totals;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Real-time data from your Supabase project and Stripe account.</p>
        </div>
        <Badge tone={data?.stripeMode === "live" ? "good" : "warn"}>
          Stripe {data?.stripeMode ?? "…"} mode
        </Badge>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {!data ? (
        !error && (
          <div className="flex justify-center p-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        )
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Registered users" value={t!.users.toLocaleString()} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Workbooks migrated" value={t!.workbooks.toLocaleString()} icon={<Database className="h-4 w-4" />} />
            <StatCard label="Rows in database" value={t!.rowsMigrated.toLocaleString()} icon={<Bot className="h-4 w-4" />} />
            <StatCard
              label="MRR"
              value={`$${(t!.mrrCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              sub={`${t!.activeSubscriptions} active subscription${t!.activeSubscriptions === 1 ? "" : "s"}`}
              icon={<DollarSign className="h-4 w-4" />}
              tone={t!.activeSubscriptions > 0 ? "good" : undefined}
            />
          </div>

          {Object.keys(data.planBreakdown).length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold">Active plan breakdown</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.planBreakdown).map(([plan, n]) => (
                  <Badge key={plan} tone="brand">
                    {plan}: {n}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 text-sm font-semibold">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Signed up</th>
                    <th className="pb-2 pr-4 font-medium">Last sign-in</th>
                    <th className="pb-2 pr-4 font-medium">Workbooks</th>
                    <th className="pb-2 font-medium">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-t border-white/5">
                      <td className="py-2.5 pr-4 font-medium text-slate-200">{u.email}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2.5 pr-4">{u.workbooks}</td>
                      <td className="py-2.5">
                        {u.plan ? <Badge tone="good">{u.plan}</Badge> : <span className="text-xs text-slate-500">free</span>}
                      </td>
                    </tr>
                  ))}
                  {data.users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                        No users yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <ShieldHalf className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold">Infrastructure</h2>
            </div>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
              {[
                ["Supabase project", "vbayhnlkcoqgssgapaay"],
                ["Deployment", "Vercel — sheetnative.vercel.app"],
                ["Stripe", `${data.stripeMode} mode`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="font-medium text-slate-200">{k}</div>
                  <div className={cx("mt-0.5 text-slate-500")}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
