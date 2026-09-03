"use client";

import { Activity, Server, Users, Database, Bot, Flag, ShieldHalf, CircleDot } from "lucide-react";
import { Badge, Card, StatCard, cx } from "@/components/ui";

const SERVICES = [
  { name: "API gateway", status: "healthy", latency: "42ms" },
  { name: "PostgreSQL primary", status: "healthy", latency: "3ms" },
  { name: "Read replica", status: "healthy", latency: "6ms" },
  { name: "Redis cache", status: "healthy", latency: "1ms" },
  { name: "AI inference cluster", status: "degraded", latency: "1.8s" },
  { name: "WebSocket realtime", status: "healthy", latency: "11ms" },
  { name: "S3 storage", status: "healthy", latency: "38ms" },
];

const FLAGS = [
  { name: "ai-app-builder", on: true, desc: "Generate apps from text prompts (no spreadsheet)" },
  { name: "voice-approvals", on: true, desc: "Approve workflows by voice command" },
  { name: "white-label-mobile", on: false, desc: "Custom-branded mobile builds" },
  { name: "hipaa-mode", on: false, desc: "HIPAA-compliant processing mode" },
  { name: "business-dna-engine", on: true, desc: "Continuous business-learning loop" },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-rise">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Admin</h1>
        <p className="mt-1 text-sm text-slate-400">SaaS control plane — users, health, AI usage, feature flags and moderation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value="3,412" sub="+128 this week" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Migrated workbooks" value="11,908" sub="6.2M rows processed" icon={<Database className="h-4 w-4" />} />
        <StatCard label="AI credits burned" value="4.1M" sub="today" icon={<Bot className="h-4 w-4" />} tone="warn" />
        <StatCard label="MRR" value="$412k" sub="+9.4% MoM" icon={<Activity className="h-4 w-4" />} tone="good" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">System health</h2>
          </div>
          <div className="space-y-2">
            {SERVICES.map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5">
                <CircleDot className={cx("h-3.5 w-3.5", s.status === "healthy" ? "text-emerald-400" : "text-amber-400")} />
                <span className="text-sm">{s.name}</span>
                <span className="ml-auto text-xs text-slate-500">{s.latency}</span>
                <Badge tone={s.status === "healthy" ? "good" : "warn"}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Flag className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">Feature flags</h2>
          </div>
          <div className="space-y-2">
            {FLAGS.map((f) => (
              <div key={f.name} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-slate-200">{f.name}</div>
                  <div className="truncate text-[11px] text-slate-500">{f.desc}</div>
                </div>
                <span className={cx("relative h-5 w-9 rounded-full transition", f.on ? "bg-emerald-500/60" : "bg-white/10")}>
                  <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", f.on ? "left-[18px]" : "left-0.5")} />
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldHalf className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">Security & compliance</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ["SOC 2 Type II", "audit in progress"],
              ["GDPR tools", "enabled"],
              ["AES-256 at rest", "enforced"],
              ["SSO / SAML", "enterprise tier"],
              ["Audit logs", "streaming"],
              ["HIPAA mode", "flag-gated"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="font-medium text-slate-200">{k}</div>
                <div className="mt-0.5 text-slate-500">{v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold">Marketplace moderation queue</h2>
          <div className="space-y-2">
            {[
              ["Manufacturing BOM Kit", "submitted 2h ago", "warn"],
              ["Logistics Route Optimizer", "submitted 5h ago", "warn"],
              ["Restaurant OS Template", "approved yesterday", "good"],
            ].map(([n, t, tone]) => (
              <div key={n} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{n}</div>
                  <div className="text-[11px] text-slate-500">{t}</div>
                </div>
                <Badge tone={tone === "good" ? "good" : "warn"}>{tone === "good" ? "approved" : "review"}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
