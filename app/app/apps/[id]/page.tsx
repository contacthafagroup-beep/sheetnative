"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Table2, Columns3, BarChart3, Plus, Sparkles,
  FileDown, Shield, X, Check,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { Badge, Button, Card, cx, EmptyState } from "@/components/ui";
import type { Analysis, EntitySpec } from "@/lib/types";
import { fetchEntityRows, fetchWorkbooks } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { showAuth } from "@/components/auth";

type ViewMode = "table" | "kanban" | "chart";

const COLORS = ["#818cf8", "#22d3ee", "#f472b6", "#fbbf24", "#34d399", "#a78bfa"];

export default function GeneratedAppPage() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEntity, setActiveEntity] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [view, setView] = useState<ViewMode>("table");

  useEffect(() => {
    fetchWorkbooks()
      .then((wbs) => {
        const wb = wbs.find((w) => w.id === id);
        if (wb?.analysis) {
          setAnalysis(wb.analysis);
          setActiveEntity(wb.analysis.entities[0]?.name ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const entity = useMemo(
    () => analysis?.entities.find((e) => e.name === activeEntity) ?? null,
    [analysis, activeEntity]
  );

  const loadRows = useCallback(() => {
    if (!entity) return;
    setRowsLoading(true);
    fetchEntityRows(entity.name)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setRowsLoading(false));
  }, [entity]);

  useEffect(loadRows, [loadRows]);

  if (loading)
    return <div className="flex justify-center p-20"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div>;

  if (!analysis)
    return (
      <div className="p-6">
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="App not found"
          body="This generated app doesn't exist or belongs to another workspace."
          action={<Link href="/app/apps" className="text-sm text-indigo-300 hover:text-indigo-200">← Back to apps</Link>}
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 animate-rise">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/app/apps" className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{analysis.fileName.replace(/\.[^.]+$/, "")} — Operations App</h1>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              {analysis.detections.slice(0, 3).map((d) => (
                <Badge key={d.domain} tone="brand">{d.domain}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Shield className="h-3.5 w-3.5" /> Permissions</Button>
          <Button variant="outline" size="sm"><FileDown className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      {/* Entity nav */}
      <div className="flex flex-wrap gap-1.5">
        {analysis.entities.map((e) => (
          <button
            key={e.name}
            onClick={() => setActiveEntity(e.name)}
            className={cx(
              "rounded-xl border px-3.5 py-1.5 text-xs font-medium transition",
              activeEntity === e.name
                ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
                : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
            )}
          >
            {e.name}
            <span className="ml-1.5 text-slate-500">{e.rowCount}</span>
          </button>
        ))}
      </div>

      {entity && (
        <>
          <EntityToolbar
            entity={entity}
            view={view}
            setView={setView}
            rows={rows}
            onAdded={() => { loadRows(); }}
          />
          <EntityBody entity={entity} rows={rows} loading={rowsLoading} view={view} onAdded={() => loadRows()} />
        </>
      )}
    </div>
  );
}

function EntityToolbar({
  entity, view, setView, rows, onAdded,
}: {
  entity: EntitySpec;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  rows: Record<string, unknown>[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const kanbanable = entity.columns.some((c) => c.type === "text" && /status|stage|state|type|category/i.test(c.name));
  const chartable = entity.columns.some((c) => ["number", "currency", "integer"].includes(c.type));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
        <ViewBtn active={view === "table"} onClick={() => setView("table")} icon={<Table2 className="h-3.5 w-3.5" />} label="Table" />
        <ViewBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={<Columns3 className="h-3.5 w-3.5" />} label="Kanban" disabled={!kanbanable} />
        <ViewBtn active={view === "chart"} onClick={() => setView("chart")} icon={<BarChart3 className="h-3.5 w-3.5" />} label="Chart" disabled={!chartable} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{rows.length} records loaded</span>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> New record</Button>
      </div>
      {open && <NewRecordModal entity={entity} onClose={() => setOpen(false)} onSaved={onAdded} />}
    </div>
  );
}

function ViewBtn({ active, onClick, icon, label, disabled }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400 hover:text-slate-200",
        disabled && "opacity-30"
      )}
    >
      {icon} {label}
    </button>
  );
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function EntityBody({
  entity, rows, loading, view, onAdded,
}: {
  entity: EntitySpec;
  rows: Record<string, unknown>[];
  loading: boolean;
  view: ViewMode;
  onAdded: () => void;
}) {
  if (loading)
    return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>;

  if (view === "table") return <DataTable entity={entity} rows={rows} onChanged={onAdded} />;
  if (view === "kanban") return <Kanban entity={entity} rows={rows} />;
  return <EntityCharts entity={entity} rows={rows} />;
}

function DataTable({
  entity, rows, onChanged,
}: {
  entity: EntitySpec;
  rows: Record<string, unknown>[];
  onChanged: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = rows.filter((r) =>
    q ? JSON.stringify(r).toLowerCase().includes(q.toLowerCase()) : true
  );
  const cols = entity.columns.slice(0, 8);

  const removeRow = useCallback(
    async (data: Record<string, unknown>) => {
      const sb = getSupabase();
      const { data: all } = await sb.from("entity_rows").select("id,data").eq("entity", entity.name);
      const target = all?.find((r: { data: Record<string, unknown> }) => JSON.stringify(r.data) === JSON.stringify(data));
      if (target) {
        await sb.from("entity_rows").delete().eq("id", (target as { id: string }).id);
        onChanged();
      }
    },
    [entity.name, onChanged]
  );

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${entity.name}…`}
          className="w-56 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none placeholder:text-slate-600 focus:border-indigo-500/40"
        />
        {entity.columns.slice(0, 4).map((c) => (
          <span key={c.name} className="hidden text-[11px] text-slate-600 md:inline">
            {c.name}·{c.type}
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-500">{filtered.length} shown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs text-slate-500">
              {cols.map((c) => (
                <th key={c.name} className="whitespace-nowrap px-4 py-2.5 font-medium">{c.name}</th>
              ))}
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-white/[0.03] transition hover:bg-white/[0.03]">
                {cols.map((c) => (
                  <td key={c.name} className="whitespace-nowrap px-4 py-2.5 text-slate-300">
                    {formatCell(r[c.name], c.type)}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => removeRow(r)} className="text-xs text-slate-600 hover:text-red-300">delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="px-4 py-10 text-center text-sm text-slate-500">No records match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function formatCell(v: unknown, type: string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (type === "currency") {
    const n = num(v);
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (type === "boolean") return v ? "✓" : "✗";
  if (type === "date") {
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  }
  return String(v);
}

function Kanban({ entity, rows }: { entity: EntitySpec; rows: Record<string, unknown>[] }) {
  const groupCol =
    entity.columns.find((c) => c.type === "text" && /status|stage|state/i.test(c.name)) ??
    entity.columns.find((c) => c.type === "text" && /type|category/i.test(c.name));
  const labelCol = entity.columns.find((c) => c.type === "text" && !/status|type|category/i.test(c.name)) ?? groupCol!;
  const groups = [...new Set(rows.map((r) => String(r[groupCol!.name] ?? "—")))].slice(0, 6);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {groups.map((g) => {
        const items = rows.filter((r) => String(r[groupCol!.name] ?? "—") === g);
        return (
          <div key={g} className="w-64 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-300">{g}</span>
              <Badge>{items.length}</Badge>
            </div>
            {items.slice(0, 20).map((r, i) => (
              <div key={i} className="glass p-3.5 transition hover:border-indigo-500/30">
                <div className="text-sm font-medium">{String(r[labelCol.name] ?? "—")}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {entity.columns
                    .filter((c) => ["currency", "number"].includes(c.type))
                    .slice(0, 1)
                    .map((c) => formatCell(r[c.name], c.type))
                    .join(" ")}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function EntityCharts({ entity, rows }: { entity: EntitySpec; rows: Record<string, unknown>[] }) {
  const metric = entity.columns.find((c) => ["number", "currency"].includes(c.type));
  const dim = entity.columns.find((c) => c.type === "text");

  const agg = useMemo(() => {
    if (!metric || !dim) return [];
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = String(r[dim.name] ?? "—").slice(0, 18);
      m.set(k, (m.get(k) ?? 0) + num(r[metric.name]));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ name: k, value: v }));
  }, [rows, metric, dim]);

  if (!metric || !dim || agg.length === 0)
    return <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="Not enough structure" body="This entity has no numeric + categorical column pair to chart." />;

  const total = agg.reduce((a, d) => a + d.value, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h3 className="mb-1 text-sm font-semibold">Total {metric.name.replace(/_/g, " ")} by {dim.name.replace(/_/g, " ")}</h3>
        <p className="mb-4 text-xs text-slate-500">AI-selected the most meaningful aggregation for this entity.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agg}>
              <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "rgba(129,140,248,0.08)" }} />
              <Bar dataKey="value" fill="#818cf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h3 className="mb-4 text-sm font-semibold">Share of total</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={agg} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {agg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-1.5 text-xs">
          {agg.slice(0, 5).map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate text-slate-300">{d.name}</span>
              <span className="ml-auto text-slate-500">{total ? Math.round((d.value / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NewRecordModal({
  entity, onClose, onSaved,
}: {
  entity: EntitySpec;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = useCallback(async () => {
    setSaving(true);
    try {
      const data: Record<string, unknown> = {};
      for (const c of entity.columns) {
        const v = values[c.name];
        if (v === undefined || v === "") continue;
        if (c.type === "number" || c.type === "currency" || c.type === "integer") data[c.name] = Number(v.replace(/[$,]/g, ""));
        else if (c.type === "boolean") data[c.name] = /^(true|yes)$/i.test(v);
        else data[c.name] = v;
      }
      await saveRow(entity.name, data);
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 400);
    } finally {
      setSaving(false);
    }
  }, [entity, values, onSaved, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade" onClick={onClose}>
      <div className="glass-strong w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">New record in <span className="font-mono text-indigo-300">{entity.name}</span></h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid max-h-[50vh] gap-3 overflow-y-auto sm:grid-cols-2">
          {entity.columns.filter((c) => c.name !== "id").map((c) => (
            <label key={c.name} className="block">
              <span className="text-[11px] text-slate-500">{c.name} · {c.pgType}</span>
              <input
                value={values[c.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [c.name]: e.target.value }))}
                type={c.type === "date" ? "date" : "text"}
                placeholder={c.sample}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saved ? <Check className="h-4 w-4" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {saved ? "Saved" : "Save record"}
          </Button>
        </div>
      </div>
    </div>
  );
}

async function saveRow(entity: string, data: Record<string, unknown>) {
  const sb = getSupabase();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) { showAuth(); throw new Error("Not signed in"); }
  const { error } = await sb.from("entity_rows").insert({ user_id: u.user.id, entity, data });
  if (error) throw new Error(error.message);
}
