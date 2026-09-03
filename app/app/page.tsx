"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sparkles, FileSpreadsheet, ArrowUpRight, Loader2, Bot, Workflow,
  Upload, AppWindow, CreditCard, CheckCircle2, Circle, Database,
} from "lucide-react";
import { Badge, Card, LinkButton, StatCard } from "@/components/ui";
import { fetchWorkbooks, fetchEmployees, type WorkbookRow, type EmployeeRow } from "@/lib/store";

export default function Dashboard() {
  const [workbooks, setWorkbooks] = useState<WorkbookRow[] | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);

  useEffect(() => {
    fetchWorkbooks().then(setWorkbooks).catch(() => setWorkbooks([]));
    fetchEmployees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  const rows = (workbooks ?? []).reduce((a, w) => a + (w.analysis?.stats?.rows ?? 0), 0);
  const entities = (workbooks ?? []).reduce(
    (a, w) => a + (Array.isArray(w.analysis?.entities) ? w.analysis!.entities!.length : 0),
    0
  );

  const steps = [
    { label: "Upload your first Excel workbook", href: "/app/workbooks", done: (workbooks?.length ?? 0) > 0, icon: Upload },
    { label: "Open your AI-generated app", href: "/app/apps", done: (workbooks?.length ?? 0) > 0, icon: AppWindow },
    { label: "Hire an AI employee", href: "/app/ai-employees", done: (employees?.length ?? 0) > 0, icon: Bot },
    { label: "Create your first automation", href: "/app/automations", done: false, icon: Workflow },
    { label: "Choose a plan to unlock your team", href: "/app/billing", done: false, icon: CreditCard },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your business OS</h1>
          <p className="mt-1 text-sm text-slate-400">Everything here is live from your workspace — no placeholders.</p>
        </div>
        <LinkButton href="/app/workbooks"><Upload className="h-4 w-4" /> New workbook</LinkButton>
      </div>

      {/* Real stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Workbooks migrated" value={(workbooks?.length ?? 0).toLocaleString()} icon={<FileSpreadsheet className="h-4 w-4" />} />
        <StatCard label="Rows processed" value={rows.toLocaleString()} sub="across all workbooks" icon={<Database className="h-4 w-4" />} />
        <StatCard label="Entities detected" value={entities.toLocaleString()} sub="tables AI understood" icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="AI employees hired" value={(employees?.length ?? 0).toLocaleString()} icon={<Bot className="h-4 w-4" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Getting started — real progress */}
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Getting started</h2>
            <Badge tone={doneCount === steps.length ? "good" : "brand"}>{doneCount}/{steps.length}</Badge>
          </div>
          <div className="space-y-2">
            {steps.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-indigo-500/25 hover:bg-indigo-500/5"
              >
                {s.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{s.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              </Link>
            ))}
          </div>
        </Card>

        {/* Real migrated workbooks */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Migrated workbooks</h2>
            <Link href="/app/workbooks" className="text-xs text-indigo-300 hover:text-indigo-200">View all</Link>
          </div>
          {workbooks === null ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
          ) : workbooks.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              <FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              No workbooks yet — upload your first Excel file and AI will build your business system.
              <div className="mt-4"><LinkButton href="/app/workbooks" size="sm">Upload workbook</LinkButton></div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {workbooks.slice(0, 8).map((w) => (
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

      {/* Real AI employees */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">AI employees</h2>
          <Link href="/app/ai-employees" className="text-xs text-indigo-300 hover:text-indigo-200">Manage</Link>
        </div>
        {employees === null ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
        ) : employees.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">
            You haven&apos;t hired any AI employees yet. They analyze your real workbook data — finance, inventory, sales and more.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {employees.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{e.name}</div>
                  <div className="truncate text-xs text-slate-500">{e.role}</div>
                </div>
                <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse-soft" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
