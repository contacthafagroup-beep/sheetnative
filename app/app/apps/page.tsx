"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppWindow, FileSpreadsheet, Loader2, Sparkles, ArrowUpRight, Layers } from "lucide-react";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { fetchWorkbooks, type WorkbookRow } from "@/lib/store";

export default function AppsPage() {
  const [workbooks, setWorkbooks] = useState<WorkbookRow[] | null>(null);

  useEffect(() => {
    fetchWorkbooks().then(setWorkbooks).catch(() => setWorkbooks([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generated Apps</h1>
          <p className="mt-1 text-sm text-slate-400">
            One database, many experiences — every migrated workbook becomes a full application for every role.
          </p>
        </div>
        <LinkButton href="/app/workbooks"><Sparkles className="h-4 w-4" /> Generate from workbook</LinkButton>
      </div>

      {workbooks === null ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>
      ) : workbooks.length === 0 ? (
        <EmptyState
          icon={<AppWindow className="h-6 w-6" />}
          title="No generated apps yet"
          body="Migrate a workbook and SheetNative will generate dashboards, CRUD pages, permissions and mobile-ready views automatically."
          action={<LinkButton href="/app/workbooks" size="sm"><FileSpreadsheet className="h-3.5 w-3.5" /> Upload workbook</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workbooks.map((w) => {
            const domains = w.analysis?.detections?.slice(0, 2).map((d) => d.domain) ?? [];
            return (
              <Link key={w.id} href={`/app/apps/${w.id}`}>
                <Card className="group transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-violet-500/10">
                      <AppWindow className="h-5 w-5 text-indigo-300" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-indigo-300" />
                  </div>
                  <div className="mt-3 truncate font-semibold">{w.file_name.replace(/\.[^.]+$/, "")}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {w.analysis?.entities?.length ?? 0} entities · {w.analysis?.stats?.rows?.toLocaleString() ?? 0} records
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {domains.map((d) => <Badge key={d} tone="brand">{d}</Badge>)}
                    {domains.length === 0 && <Badge><Layers className="h-3 w-3" /> Business data</Badge>}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] py-1.5">Web</div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] py-1.5">Mobile</div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] py-1.5">Desktop</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
