"use client";

import { useEffect, useState } from "react";
import { Workflow, Loader2, Sparkles, Trash2, Zap, ArrowRight, Power } from "lucide-react";
import { Badge, Button, Card, cx } from "@/components/ui";
import { fetchAutomations, saveAutomation, toggleAutomation, deleteAutomation, type AutomationRow } from "@/lib/store";
import { parseAutomation } from "@/lib/automation";

const EXAMPLES = [
  "When inventory falls below 20, notify purchasing by email",
  "When an invoice is overdue by 7 days, send payment reminder",
  "When a purchase order exceeds $5000, request approval then notify finance on Slack",
];

interface Preview {
  description: string;
  actions: { type: string; label: string }[];
  valid: boolean;
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRow[] | null>(null);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => fetchAutomations().then(setRules).catch(() => setRules([]));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!input.trim()) { setPreview(null); return; }
    const parsed = parseAutomation(input);
    setPreview(parsed ? { description: parsed.description, actions: parsed.actions, valid: true } : { description: "Add a condition (when…) and an action (notify…).", actions: [], valid: false });
  }, [input]);

  const create = async () => {
    const parsed = parseAutomation(input);
    if (!parsed) return;
    setBusy(true);
    try {
      await saveAutomation(parsed.trigger.metric + " " + parsed.trigger.operator + " " + parsed.trigger.value, parsed);
      setInput("");
      setPreview(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 animate-rise">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Describe the workflow in plain language. No visual editor, no Zapier — AI builds it.
        </p>
      </div>

      {/* Builder */}
      <Card strong className="space-y-4">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold">Natural-language automation builder</span>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "When inventory falls below 20, notify purchasing by email"'
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => setInput(e)}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-400 hover:border-indigo-500/30 hover:text-indigo-200">
              {e.length > 48 ? e.slice(0, 47) + "…" : e}
            </button>
          ))}
        </div>
        {preview && (
          <div className={cx("rounded-xl border p-4", preview.valid ? "border-indigo-500/30 bg-indigo-500/8" : "border-white/10 bg-white/[0.02]")}>
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span className="font-medium text-indigo-200">{preview.valid ? "Understood. This is what I'll build:" : "Keep describing…"}</span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{preview.description}</p>
            {preview.actions.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <Badge tone="brand">trigger</Badge>
                <span>condition met</span>
                <ArrowRight className="h-3.5 w-3.5" />
                {preview.actions.map((a, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <Badge tone="good">{a.type}</Badge>
                    <span>{a.label}</span>
                  </span>
                ))}
              </div>
            )}
            {preview.valid && (
              <Button size="sm" className="mt-4" onClick={create} disabled={busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Build automation
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Existing */}
      <div className="space-y-2.5">
        <h2 className="text-sm font-semibold text-slate-300">Active automations</h2>
        {rules === null ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
        ) : rules.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No automations yet — describe your first above.</p>
        ) : (
          rules.map((r) => (
            <div key={r.id} className="glass flex items-center gap-4 p-4">
              <div className={cx("flex h-9 w-9 items-center justify-center rounded-lg", r.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-slate-500")}>
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {typeof r.rule === "object" && r.rule !== null && "description" in r.rule
                    ? String((r.rule as { description: string }).description)
                    : "Custom workflow"}
                </div>
              </div>
              <Badge tone={r.enabled ? "good" : "neutral"}>{r.enabled ? "live" : "paused"}</Badge>
              <button onClick={async () => { await toggleAutomation(r.id, !r.enabled); load(); }} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-200" title="Toggle">
                <Power className="h-3.5 w-3.5" />
              </button>
              <button onClick={async () => { await deleteAutomation(r.id); load(); }} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
