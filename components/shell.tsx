"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles, LayoutDashboard, FileSpreadsheet, AppWindow, Bot, Workflow,
  ClipboardCheck, Store, CreditCard, ShieldHalf, Send, X, Loader2, LogOut, PanelLeft,
} from "lucide-react";
import { cx, Badge } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { showAuth } from "@/components/auth";
import { answerQuestion, type ChatMessage } from "@/lib/nlq";
import { buildReportHtml } from "@/lib/report";
import type { Analysis } from "@/lib/types";
import { fetchWorkbooks, fetchAllRows, type EntityRows } from "@/lib/store";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/workbooks", label: "Workbooks", icon: FileSpreadsheet },
  { href: "/app/apps", label: "Generated Apps", icon: AppWindow },
  { href: "/app/ai-employees", label: "AI Employees", icon: Bot },
  { href: "/app/automations", label: "Automations", icon: Workflow },
  { href: "/app/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/app/marketplace", label: "Marketplace", icon: Store },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
];

const ADMIN_NAV = { href: "/app/admin", label: "Admin", icon: ShieldHalf };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        showAuth();
        const { data: sub } = sb.auth.onAuthStateChange((e) => {
          if (e === "SIGNED_IN") setReady(true);
        });
        setTimeout(() => sub.subscription.unsubscribe(), 1000 * 120);
      } else {
        setUserEmail(data.session.user.email ?? null);
        setReady(true);
      }
    });
    const { data: sub } = sb.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_OUT") router.push("/");
      if (e === "SIGNED_IN" && s) { setUserEmail(s.user.email ?? null); setReady(true); }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ready)
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Connecting to your workspace…</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cx(
          "flex shrink-0 flex-col border-r border-white/5 bg-black/30 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!collapsed && <span className="font-semibold tracking-tight">SheetNative</span>}
        </div>
        <nav className="mt-2 flex-1 space-y-0.5 px-2">
          {(isAdminEmail(userEmail) ? [...NAV, ADMIN_NAV] : NAV).map((n) => {
            const active = n.href === "/app" ? pathname === "/app" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  active ? "bg-indigo-500/15 text-indigo-200 border border-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                {!collapsed && n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/5 p-3">
          {!collapsed && userEmail && (
            <div className="mb-2 truncate px-2 text-[11px] text-slate-500">{userEmail}</div>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex-1 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300"
              title="Toggle sidebar"
            >
              <PanelLeft className="mx-auto h-4 w-4" />
            </button>
            <button
              onClick={() => getSupabase().auth.signOut()}
              className="flex-1 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-red-300"
              title="Sign out"
            >
              <LogOut className="mx-auto h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-5 py-2.5 backdrop-blur-xl">
          <span className="text-xs text-slate-500">AI-native business operating system</span>
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" /> Ask AI
          </button>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        {chatOpen && <AiChatDrawer onClose={() => setChatOpen(false)} />}
      </div>
    </div>
  );
}

function AiChatDrawer({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your business AI. Ask me anything about your migrated workbooks — totals, risks, low stock, unpaid invoices — or tell me to build something.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [rows, setRows] = useState<EntityRows>({});
  const [aiSource, setAiSource] = useState<"llm" | "local">("local");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const wbs = await fetchWorkbooks();
        if (wbs[0]?.analysis) {
          setAnalysis(wbs[0].analysis);
          setRows(await fetchAllRows(wbs[0].analysis));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const openReport = useCallback(() => {
    if (!analysis) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildReportHtml(analysis, rows));
    w.document.close();
  }, [analysis, rows]);

  const buildLlmContext = useCallback(() => {
    if (!analysis) return [];
    return analysis.entities.slice(0, 15).map((e) => {
      const data = rows[e.name] ?? [];
      const numeric = e.columns.filter((c) => ["number", "currency", "integer"].includes(c.type));
      const totals: Record<string, number> = {};
      for (const c of numeric.slice(0, 4)) {
        totals[c.name] = data.reduce((a, r) => {
          const v = r[c.name];
          const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[$,]/g, ""));
          return a + (Number.isFinite(n) ? n : 0);
        }, 0);
      }
      return {
        name: e.name,
        sheet: e.sheet,
        rowCount: data.length || e.rowCount,
        columns: e.columns.map((c) => ({ name: c.name, type: c.type })),
        totals,
        sample: data.slice(0, 10),
      };
    });
  }, [analysis, rows]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q, ts: Date.now() }]);
    setThinking(true);
    try {
      let content: string;
      let action: { label: string } | null = null;
      let usedLlm = false;
      if (analysis) {
        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q, entities: buildLlmContext() }),
          });
          const json = await res.json();
          if (json.answer) {
            content = json.answer;
            usedLlm = true;
          } else {
            content = answerQuestion(q, analysis, rows);
          }
        } catch {
          content = answerQuestion(q, analysis, rows);
        }
        setAiSource(usedLlm ? "llm" : "local");
      } else {
        content = "I don't have a workbook yet. Upload one under Workbooks and I'll learn your business from it — then ask me anything.";
      }
      if (analysis && /report/i.test(q)) action = { label: "Build report" };
      setMessages((m) => [...m, { role: "assistant", content, ts: Date.now(), action }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking, analysis, rows, buildLlmContext]);

  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b0e15]/95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold">Business AI</span>
            <Badge tone={aiSource === "llm" ? "good" : "brand"}>
              {aiSource === "llm" ? "GPT-class" : "Local engine"}
            </Badge>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cx(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-indigo-500/25 text-indigo-50 border border-indigo-500/30"
                    : "border border-white/8 bg-white/[0.04] text-slate-200"
                )}
              >
                {m.content}
                {m.action && (
                  <button
                    onClick={openReport}
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-medium text-indigo-200 hover:bg-indigo-500/30"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {m.action.label}
                  </button>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> analyzing your data…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything: “Why did revenue drop?”"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
            />
            <button onClick={send} disabled={!input.trim() || thinking} className="text-indigo-300 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Total revenue?", "Show low stock", "Top customers", "Unpaid invoices"].map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 hover:border-indigo-500/30 hover:text-indigo-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
