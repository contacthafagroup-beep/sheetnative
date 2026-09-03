"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, Plus, Sparkles, Trash2, DollarSign, Package, Users, Activity, ShieldHalf, X } from "lucide-react";
import { Badge, Button, Card, cx } from "@/components/ui";
import { fetchEmployees, saveEmployee, deleteEmployee, type EmployeeRow } from "@/lib/store";

const PRESETS = [
  { name: "CEO AI", role: "Executive copilot", icon: Sparkles, skills: ["Revenue & cash-flow briefings", "Risk radar", "Growth forecasts", "Board report drafting"] },
  { name: "Finance AI", role: "Controller", icon: DollarSign, skills: ["Invoice summaries", "Expense categorization", "Fraud alerts", "Payment reminders"] },
  { name: "Inventory AI", role: "Supply chain", icon: Package, skills: ["Stockout prediction", "Reorder timing", "Supplier recommendations"] },
  { name: "Sales AI", role: "Revenue ops", icon: Users, skills: ["Lead scoring", "Quote generation", "Customer summaries", "Follow-up drafting"] },
  { name: "HR AI", role: "People ops", icon: Activity, skills: ["Payroll explanations", "Leave processing", "Onboarding", "Policy answers"] },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => fetchEmployees().then(setEmployees).catch(() => setEmployees([]));
  useEffect(() => { load(); }, []);

  const hire = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await saveEmployee(name.trim(), role.trim() || "Custom role", instructions.trim() || "Act in the best interest of the business.");
      setName(""); setRole(""); setInstructions("");
      setCreating(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Employees</h1>
          <p className="mt-1 text-sm text-slate-400">AI coworkers that run workflows, watch your data and act — not just chatbots.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Create AI role</Button>
      </div>

      {/* Hired */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employees === null ? (
          <div className="col-span-full flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
        ) : (
          employees.map((e) => (
            <Card key={e.id} className="group relative">
              <button
                onClick={async () => { await deleteEmployee(e.id); load(); }}
                className="absolute right-4 top-4 text-slate-600 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-violet-500/10">
                  <Bot className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{e.name}</div>
                  <div className="text-xs text-slate-500">{e.role}</div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{e.instructions}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                <span className="text-[11px] text-slate-500">on shift · learning your business</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Presets */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">One-click hires</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((p) => (
            <Card key={p.name} className="transition hover:border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <p.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.role}</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {p.skills.map((s) => (
                  <li key={s} className="text-xs text-slate-400">· {s}</li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                onClick={async () => { await saveEmployee(p.name, p.role, `You are ${p.name}, responsible for: ${p.skills.join(", ")}.`); load(); }}
              >
                Hire {p.name}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade" onClick={() => setCreating(false)}>
          <div className="glass-strong w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldHalf className="h-4 w-4 text-indigo-400" /> Create an AI employee</h3>
              <button onClick={() => setCreating(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name — e.g. Purchasing Manager AI"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role — e.g. Procurement"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
                placeholder="Instructions — e.g. Watch purchase prices, flag unusual vendor quotes, draft POs when stock hits reorder point."
                className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-indigo-500/50" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={hire} disabled={busy || !name.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Build employee
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
