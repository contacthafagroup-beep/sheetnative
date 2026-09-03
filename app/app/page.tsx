"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sparkles, FileSpreadsheet, TrendingUp, Package, Users, DollarSign,
  Activity, ArrowUpRight, Loader2, Bot, Workflow, Upload,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar,
} from "recharts";
import { Badge, Card, LinkButton, StatCard, Button } from "@/components/ui";
import { fetchWorkbooks, type WorkbookRow, fetchEntityRows } from "@/lib/store";

const REVENUE_SERIES = [
  { m: "Apr", revenue: 84200, expenses: 61000 },
  { m: "May", revenue: 91500, expenses: 63500 },
  { m: "Jun", revenue: 88300, expenses: 66000 },
  { m: "Jul", revenue: 103400, expenses: 69800 },
  { m: "Aug", revenue: 112900, expenses: 72400 },
  { m: "Sep", revenue: 121700, expenses: 74900 },
];

export default function Dashboard() {
  const [workbooks, setWorkbooks] = useState<WorkbookRow[] | null>(null);

  useEffect(() => {
    fetchWorkbooks().then(setWorkbooks).catch(() => setWorkbooks([]));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Good day, CEO</h1>
          <p className="mt-1 text-sm text-slate-400">Here's what your AI operating system found overnight.</p>
        </div>
        <LinkButton href="/app/workbooks"><Upload className="h-4 w-4" /> New workbook</LinkButton>
      </div>

      {/* AI insight banner */}
      <div className="glass-strong relative overflow-hidden border-indigo-500/25 p-5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">AI insight</span>
              <Badge tone="brand">proactive</Badge>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Inventory turnover improved 18% this quarter, but <span className="text-indigo-300">6 SKUs will run out by Monday</span> based
              on the last 90 days of demand. Sales in Region West slowed 12% — the driver is two churned key accounts.
              I can draft a purchase order and a win-back campaign now.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary"><Workflow className="h-3.5 w-3.5" /> Draft purchase order</Button>
              <Button size="sm" variant="outline">Show the math</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (MTD)" value="$121,700" sub="+7.8% vs last month" icon={<DollarSign className="h-4 w-4" />} tone="good" />
        <StatCard label="Cash on hand" value="$412,340" sub="13 weeks runway" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="SKUs below reorder" value="6" sub="purchase order suggested" icon={<Package className="h-4 w-4" />} tone="warn" />
        <StatCard label="Active customers" value="1,284" sub="+42 this month" icon={<Users className="h-4 w-4" />} tone="good" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Revenue vs expenses</h2>
              <p className="text-xs text-slate-500">Live from your migrated ledger</p>
            </div>
            <Badge tone="good">+44% YoY</Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_SERIES}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => `$${Number(v).toLocaleString()}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#818cf8" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#f472b6" fill="url(#exp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Workbooks list */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Migrated workbooks</h2>
            <Link href="/app/workbooks" className="text-xs text-indigo-300 hover:text-indigo-200">View all</Link>
          </div>
          {workbooks === null ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
          ) : workbooks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              No workbooks yet — upload your first Excel file and AI will build your business system.
              <div className="mt-4"><LinkButton href="/app/workbooks" size="sm">Upload workbook</LinkButton></div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {workbooks.slice(0, 5).map((w) => (
                <Link
                  key={w.id}
                  href={`/app/apps/${w.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-indigo-500/25 hover:bg-indigo-500/5"
                >
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{w.file_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {w.analysis?.stats?.rows?.toLocaleString() ?? 0} rows · risk {w.analysis?.scores?.risk ?? "—"}/100
                    </div>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="mb-1 text-sm font-semibold">Sales by region</h2>
          <p className="mb-4 text-xs text-slate-500">AI note: Region West −12% (2 churned accounts)</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { r: "North", v: 38200 }, { r: "South", v: 29400 },
                { r: "East", v: 33100 }, { r: "West", v: 21000 },
              ]}>
                <XAxis dataKey="r" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => `$${Number(v).toLocaleString()}`}
                  cursor={{ fill: "rgba(129,140,248,0.08)" }}
                />
                <Bar dataKey="v" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold">AI employees on shift</h2>
          <div className="space-y-3">
            {[
              { n: "Finance AI", s: "Flagged 3 duplicate invoices", icon: DollarSign },
              { n: "Inventory AI", s: "Reorder forecast ready for 6 SKUs", icon: Package },
              { n: "Sales AI", s: "Scored 12 new leads, drafted follow-ups", icon: Users },
              { n: "HR AI", s: "Payroll run validated for Friday", icon: Activity },
            ].map((e) => (
              <div key={e.n} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <e.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{e.n}</div>
                  <div className="truncate text-xs text-slate-500">{e.s}</div>
                </div>
                <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse-soft" />
              </div>
            ))}
            <Link href="/app/ai-employees" className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2.5 text-xs text-slate-400 hover:border-indigo-500/30 hover:text-indigo-200">
              <Bot className="h-3.5 w-3.5" /> Hire another AI employee
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold">Forecast — next 90 days</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { w: "Sep", p: 121700, hi: 132000, lo: 111000 },
                { w: "Oct", p: 129400, hi: 146000, lo: 112000 },
                { w: "Nov", p: 137800, hi: 158000, lo: 114000 },
                { w: "Dec", p: 152100, hi: 179000, lo: 121000 },
              ]}>
                <XAxis dataKey="w" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="hi" stroke="none" fill="#818cf8" fillOpacity={0.08} />
                <Area type="monotone" dataKey="lo" stroke="none" fill="#07090f" fillOpacity={1} />
                <Area type="monotone" dataKey="p" stroke="#a5b4fc" strokeWidth={2} fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Projected revenue <span className="text-indigo-300">$152k ± 18%</span> by December at current run rate.
          </p>
        </Card>
      </div>
    </div>
  );
}
