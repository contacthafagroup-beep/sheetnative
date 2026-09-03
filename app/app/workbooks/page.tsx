"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, FileSpreadsheet, Sparkles, Check, Loader2, ShieldAlert, Database,
  Table2, FileCode, Trash2, ChevronDown, ChevronRight, FileDown, Layers,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, ScoreRing, cx } from "@/components/ui";
import { parseWorkbook, parseCsv, type ParseResult } from "@/lib/interpreter/parse";
import { analyzeWorkbook, snake } from "@/lib/interpreter/analyze";
import type { Analysis } from "@/lib/types";
import { fetchWorkbooks, saveWorkbook, saveEntityRows, deleteWorkbook, type WorkbookRow } from "@/lib/store";

const STAGES = [
  { label: "Scanning sheets, rows and hidden tabs", icon: FileSpreadsheet },
  { label: "Interpreting formulas into business language", icon: Sparkles },
  { label: "Detecting business domains and workflows", icon: Layers },
  { label: "Scanning for risks and broken logic", icon: ShieldAlert },
  { label: "Generating PostgreSQL schema", icon: Database },
];

export default function WorkbooksPage() {
  const [workbooks, setWorkbooks] = useState<WorkbookRow[] | null>(null);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [stage, setStage] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const parseRef = useRef<ParseResult | null>(null);

  const load = useCallback(() => {
    fetchWorkbooks().then(setWorkbooks).catch(() => setWorkbooks([]));
  }, []);
  useEffect(load, [load]);

  const runPipeline = useCallback(async (file: File) => {
    setPhase("running");
    setStage(0);
    setAnalysis(null);
    setMigrated(false);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const parsed = /\.csv$/i.test(file.name)
        ? { sheets: parseCsv(new TextDecoder().decode(buf), file.name.replace(/\.[^.]+$/, "")), hasMacros: false, externalRefs: false, definedNames: [] }
        : parseWorkbook(buf);
      parseRef.current = parsed;
      if (parsed.sheets.length === 0) throw new Error("No readable sheets found in this file.");

      for (let s = 0; s < STAGES.length; s++) {
        setStage(s);
        await new Promise((r) => setTimeout(r, 620 + s * 160));
      }
      const result = analyzeWorkbook(file.name, parsed);
      setAnalysis(result);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this workbook.");
      setPhase("idle");
    }
  }, []);

  const onFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (f) runPipeline(f);
    },
    [runPipeline]
  );

  const migrate = useCallback(async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await saveWorkbook(analysis.fileName, analysis);
      if (parseRef.current) {
        for (const entity of analysis.entities) {
          const sheet = parseRef.current.sheets.find((s) => s.name === entity.sheet);
          if (!sheet) continue;
          const headerMap = new Map(sheet.headers.map((h) => [h, snake(h)]));
          const rows = sheet.rows.slice(0, 400).map((r) => {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(r)) out[headerMap.get(k) ?? snake(k)] = v;
            return out;
          });
          if (rows.length) await saveEntityRows(entity.name, rows);
        }
      }
      setMigrated(true);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Migration failed.");
    } finally {
      setSaving(false);
    }
  }, [analysis, load]);

  const exportReport = useCallback(() => {
    if (!analysis) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(reportHtml(analysis));
    w.document.close();
    setTimeout(() => w.print(), 400);
  }, [analysis]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-rise">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workbooks</h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload an Excel workbook — the AI Interpreter maps it to a database and business logic.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={cx(
          "glass flex cursor-pointer flex-col items-center gap-3 border-dashed p-10 text-center transition-all duration-300",
          dragOver ? "border-indigo-500/60 bg-indigo-500/10 scale-[1.01]" : "hover:border-indigo-500/40 hover:bg-indigo-500/5"
        )}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => onFiles(e.target.files)} />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-500/15">
          <Upload className="h-7 w-7 text-indigo-300" />
        </div>
        <div>
          <div className="text-sm font-medium">Drop your workbook here, or click to browse</div>
          <div className="mt-1 text-xs text-slate-500">XLSX · XLS · CSV — multiple sheets, formulas, hidden tabs and macros supported</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {/* Pipeline */}
      {phase !== "idle" && (
        <Card strong className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse-soft" />
            <span className="text-sm font-semibold">AI Workbook Interpreter</span>
            {phase === "running" && <Badge tone="brand">running</Badge>}
            {phase === "done" && <Badge tone="good">complete</Badge>}
          </div>

          <div className="space-y-2">
            {STAGES.map((s, i) => {
              const state = phase === "done" || i < stage ? "done" : i === stage ? "active" : "wait";
              return (
                <div key={s.label} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-4 py-2.5">
                  {state === "done" ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15"><Check className="h-3 w-3 text-emerald-400" /></span>
                  ) : state === "active" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-white/10" />
                  )}
                  <s.icon className={cx("h-3.5 w-3.5", state === "wait" ? "text-slate-600" : "text-indigo-300")} />
                  <span className={cx("text-sm", state === "wait" ? "text-slate-500" : "text-slate-200")}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {phase === "running" && (
            <div className="skeleton h-3 w-2/3" />
          )}

          {phase === "done" && analysis && (
            <AnalysisReport analysis={analysis} onMigrate={migrate} migrating={saving} migrated={migrated} onExport={exportReport} />
          )}
        </Card>
      )}

      {/* Saved workbooks */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Your library</h2>
        {workbooks === null ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
        ) : workbooks.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet className="h-6 w-6" />}
            title="No workbooks yet"
            body="Upload an .xlsx file above. Within a minute you'll have a PostgreSQL schema, a risk report and a generated application."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workbooks.map((w) => (
              <Card key={w.id} className="group">
                <div className="flex items-start justify-between">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  <button
                    onClick={async () => { await deleteWorkbook(w.id); load(); }}
                    className="rounded-lg p-1.5 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 truncate text-sm font-medium">{w.file_name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {w.analysis?.stats?.sheets ?? 0} sheets · {w.analysis?.stats?.rows?.toLocaleString() ?? 0} rows ·{" "}
                  {w.analysis?.entities?.length ?? 0} tables
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={(w.analysis?.scores?.risk ?? 100) > 55 ? "warn" : "good"}>risk {w.analysis?.scores?.risk}</Badge>
                  <Badge tone="brand">migration {w.analysis?.scores?.migration}</Badge>
                </div>
                <div className="mt-3 text-[11px] text-slate-500">{new Date(w.created_at).toLocaleString()}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisReport({
  analysis, onMigrate, migrating, migrated, onExport,
}: {
  analysis: Analysis;
  onMigrate: () => void;
  migrating: boolean;
  migrated: boolean;
  onExport: () => void;
}) {
  const [tab, setTab] = useState<"entities" | "formulas" | "risks" | "sql">("entities");
  const [openEntity, setOpenEntity] = useState<string | null>(analysis.entities[0]?.name ?? null);

  return (
    <div className="space-y-5 pt-2">
      {/* Summary + scores */}
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-300">{analysis.summary}</p>
          <div className="flex flex-wrap gap-2">
            {analysis.detections.slice(0, 4).map((d) => (
              <Badge key={d.domain} tone="brand">
                {d.domain} · {Math.round(d.confidence * 100)}%
              </Badge>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>{analysis.stats.sheets} sheets</span>
            <span>{analysis.stats.rows.toLocaleString()} rows</span>
            <span>{analysis.stats.formulas} formulas</span>
            <span>{analysis.entities.length} tables generated</span>
          </div>
        </div>
        <div className="flex gap-5">
          <ScoreRing value={analysis.scores.risk} label="Risk score" tone={analysis.scores.risk > 55 ? "warn" : "good"} />
          <ScoreRing value={analysis.scores.automation} label="Automation" tone="brand" />
          <ScoreRing value={analysis.scores.migration} label="Migration" tone="good" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
        {([
          ["entities", `Entities (${analysis.entities.length})`],
          ["formulas", `Formula intelligence (${analysis.formulas.length})`],
          ["risks", `Risk report (${analysis.risks.length})`],
          ["sql", "Generated SQL"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cx(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition",
              tab === k ? "bg-indigo-500/20 text-indigo-200" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "entities" && (
        <div className="space-y-2">
          {analysis.entities.map((e) => (
            <div key={e.name} className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
              <button
                onClick={() => setOpenEntity(openEntity === e.name ? null : e.name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
              >
                {openEntity === e.name ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                <Table2 className="h-4 w-4 text-indigo-300" />
                <span className="font-mono text-sm">{e.name}</span>
                <span className="text-xs text-slate-500">from “{e.sheet}”</span>
                <Badge>{e.role}</Badge>
                <span className="ml-auto text-xs text-slate-500">{e.rowCount.toLocaleString()} rows · {e.columns.length} cols</span>
              </button>
              {openEntity === e.name && (
                <div className="border-t border-white/5 px-4 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pb-2 font-medium">column</th>
                        <th className="pb-2 font-medium">type</th>
                        <th className="pb-2 font-medium">sample</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.columns.map((c) => (
                        <tr key={c.name} className="border-t border-white/5">
                          <td className="py-1.5 font-mono text-slate-200">{c.name}</td>
                          <td className="py-1.5"><Badge>{c.pgType}</Badge></td>
                          <td className="py-1.5 text-slate-400">{c.sample}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {analysis.entities.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">No tabular entities were detected in this workbook.</p>
          )}
        </div>
      )}

      {tab === "formulas" && (
        <div className="space-y-2">
          {analysis.formulas.slice(0, 30).map((f, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
              <div className="flex items-center gap-2">
                <FileCode className="h-3.5 w-3.5 text-indigo-300" />
                <span className="text-[11px] text-slate-500">{f.sheet}!{f.cell}</span>
                <Badge>{f.category}</Badge>
              </div>
              <code className="mt-2 block rounded-lg bg-black/40 px-3 py-1.5 font-mono text-xs text-emerald-300">={f.formula}</code>
              <p className="mt-2 text-sm text-slate-300">→ {f.explanation}</p>
            </div>
          ))}
          {analysis.formulas.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">No formulas found — pure data workbook.</p>
          )}
        </div>
      )}

      {tab === "risks" && (
        <div className="space-y-2">
          {analysis.risks.map((r, i) => (
            <div key={i} className={cx(
              "rounded-xl border p-3.5",
              r.severity === "high" ? "border-red-500/25 bg-red-500/8" : r.severity === "medium" ? "border-amber-500/25 bg-amber-500/8" : "border-white/8 bg-white/[0.02]"
            )}>
              <div className="flex items-center gap-2">
                <Badge tone={r.severity === "high" ? "bad" : r.severity === "medium" ? "warn" : "neutral"}>{r.severity}</Badge>
                <span className="text-sm font-medium">{r.title}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{r.detail}</p>
            </div>
          ))}
          {analysis.risks.length === 0 && (
            <p className="py-4 text-center text-sm text-emerald-300">Clean scan — no risks detected. This workbook is migration-ready.</p>
          )}
        </div>
      )}

      {tab === "sql" && (
        <pre className="max-h-96 overflow-auto rounded-xl border border-white/8 bg-black/50 p-4 font-mono text-xs leading-relaxed text-slate-300">
          {analysis.entities.map((e) => e.createTableSQL).join("\n\n")}
        </pre>
      )}

      <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
        <Button onClick={onMigrate} disabled={migrating || migrated}>
          {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          {migrated ? "Migrated ✓" : migrating ? "Migrating data…" : "Approve & migrate to PostgreSQL"}
        </Button>
        <Button variant="outline" onClick={onExport}><FileDown className="h-4 w-4" /> Export risk report (PDF)</Button>
        {migrated && (
          <a href="/app/apps" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:brightness-110">
            <Sparkles className="h-4 w-4" /> Open generated apps →
          </a>
        )}
      </div>
    </div>
  );
}

function reportHtml(a: Analysis): string {
  const rows = a.risks
    .map((r) => `<tr><td>${r.severity.toUpperCase()}</td><td>${r.title}</td><td>${r.detail}</td></tr>`)
    .join("");
  return `<!doctype html><html><head><title>SheetNative Business Risk Report — ${a.fileName}</title>
  <style>body{font-family:-apple-system,Segoe UI,sans-serif;padding:40px;color:#111}
  h1{font-size:22px} table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}
  td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}
  .scores{display:flex;gap:24px;margin:12px 0}</style></head><body>
  <h1>Business Risk Report</h1><p><b>${a.fileName}</b> — generated by SheetNative AI on ${new Date(a.createdAt).toLocaleString()}</p>
  <div class="scores"><div><b>Risk</b> ${a.scores.risk}/100</div><div><b>Automation potential</b> ${a.scores.automation}/100</div><div><b>Migration readiness</b> ${a.scores.migration}/100</div></div>
  <p>${a.summary}</p>
  <table><tr><th>Severity</th><th>Finding</th><th>Detail</th></tr>${rows}</table>
  <p style="margin-top:24px;color:#666;font-size:11px">SheetNative — AI Business Operating System</p></body></html>`;
}
