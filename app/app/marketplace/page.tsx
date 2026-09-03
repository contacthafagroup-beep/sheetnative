"use client";

import { useState } from "react";
import { Store, Download, Star, Search, Sparkles, Building2, BarChart3, Bot, Workflow, Package } from "lucide-react";
import { Badge, Button, Card, cx } from "@/components/ui";

const CATALOG = [
  { name: "Trading ERP Starter", kind: "ERP", icon: Building2, rating: 4.8, installs: 12400, desc: "Inventory, purchases, sales and ledger — the full trading company starter." },
  { name: "Field Services CRM", kind: "CRM", icon: Sparkles, rating: 4.7, installs: 8210, desc: "Leads, quotes, jobs, technicians and route planning with GPS check-ins." },
  { name: "Warehouse Inventory Pro", kind: "Inventory", icon: Package, rating: 4.9, installs: 15900, desc: "Bin locations, barcode scanning, NFC tagging, reorder automations." },
  { name: "Payroll & Attendance", kind: "HR", icon: BarChart3, rating: 4.6, installs: 6104, desc: "Shift scheduling, attendance, payroll runs with multi-step approvals." },
  { name: "Approval Chains Pack", kind: "Automation", icon: Workflow, rating: 4.5, installs: 4320, desc: "Ready-made multi-step approval templates for POs, expenses and leave." },
  { name: "CFO AI Employee", kind: "AI Employee", icon: Bot, rating: 4.9, installs: 9800, desc: "Senior-finance-grade AI: cash flow, fraud alerts, board reporting." },
];

const KINDS = ["All", "ERP", "CRM", "Inventory", "HR", "Automation", "AI Employee"];

export default function MarketplacePage() {
  const [kind, setKind] = useState("All");
  const [q, setQ] = useState("");
  const [installed, setInstalled] = useState<string[]>([]);

  const items = CATALOG.filter(
    (c) => (kind === "All" || c.kind === kind) && c.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-rise">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-1 text-sm text-slate-400">
          Templates, automations, AI employees and plugins — install into any workspace. Publish your own and earn revenue share.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the marketplace…" className="w-56 bg-transparent text-sm outline-none placeholder:text-slate-600" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className={cx("rounded-full border px-3 py-1.5 text-xs transition",
                kind === k ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200" : "border-white/10 text-slate-400 hover:text-slate-200")}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => {
          const isIn = installed.includes(c.name);
          return (
            <Card key={c.name} className="flex flex-col transition hover:border-indigo-500/30">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-indigo-300">
                  <c.icon className="h-5 w-5" />
                </div>
                <Badge tone="brand">{c.kind}</Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{c.name}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-400">{c.desc}</p>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {c.rating}</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {c.installs.toLocaleString()}</span>
              </div>
              <Button
                size="sm"
                variant={isIn ? "good" : "outline"}
                className="mt-4 w-full"
                onClick={() => !isIn && setInstalled((s) => [...s, c.name])}
              >
                {isIn ? "Installed ✓" : "Install"}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 border-indigo-500/25">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-indigo-300" />
          <div>
            <div className="text-sm font-semibold">Become a publisher</div>
            <div className="text-xs text-slate-400">Agencies and consultants earn 70% revenue share on published templates.</div>
          </div>
        </div>
        <Button size="sm" variant="outline">Apply to publish</Button>
      </Card>
    </div>
  );
}
