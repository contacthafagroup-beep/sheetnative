"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sparkles, Upload, Database, Smartphone, Bot, Zap, ShieldCheck,
  MonitorSmartphone, Workflow, BarChart3, Users, Mic, ScanLine,
  ArrowRight, Check, Github, Globe, Lock,
} from "lucide-react";
import { Badge, Button, Card, LinkButton } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";
import { showAuth } from "@/components/auth";

const FEATURES = [
  { icon: Upload, title: "AI Workbook Interpreter", body: "Formulas, relationships, workflows and business logic — understood automatically. Every =SUM becomes documentation." },
  { icon: Database, title: "Instant PostgreSQL", body: "Normalized schema, foreign keys, indexes and audit tables generated from your sheets in seconds." },
  { icon: MonitorSmartphone, title: "Every Platform, One Codebase", body: "Web, Android, iOS, Windows, macOS and Linux — synchronized, offline-first, always." },
  { icon: Bot, title: "AI Employees", body: "CEO, Finance, Inventory, Sales and HR AI coworkers that actually do the work — or design your own." },
  { icon: Workflow, title: "Automation Without Config", body: "“When inventory falls below 20, notify purchasing.” That's the whole setup. No Zapier needed." },
  { icon: BarChart3, title: "Natural Language Analytics", body: "Not just charts — explanations. “Sales fell 12% because Region West slowed.”" },
  { icon: ScanLine, title: "Vision & Voice AI", body: "OCR invoices, scan barcodes, dictate approvals. The camera and microphone become input devices." },
  { icon: ShieldCheck, title: "Enterprise Security", body: "SSO/SAML, MFA, passkeys, row-level permissions, audit logs, AES-256, SOC2-ready." },
];

const PLATFORMS = [
  { name: "Web", tech: "Next.js 15" },
  { name: "Android", tech: "React Native" },
  { name: "iOS", tech: "React Native" },
  { name: "Windows", tech: "Tauri" },
  { name: "macOS", tech: "Tauri" },
  { name: "Linux", tech: "Tauri" },
];

const PLANS = [
  { name: "Starter", price: 99, features: ["1 organization", "5 workbooks", "AI interpreter", "Web app"] },
  { name: "Growth", price: 299, features: ["Unlimited workbooks", "Mobile + desktop apps", "AI employees (3)", "Automations"], featured: true },
  { name: "Business", price: 799, features: ["Multi-app generator", "AI employees (10)", "APIs + webhooks", "Priority support"] },
  { name: "Pro", price: 1499, features: ["White label", "Marketplace publishing", "Enterprise SSO", "Dedicated database"] },
];

export default function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = getSupabase().auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="relative overflow-hidden">
      {/* Aurora background */}
      <div className="aurora left-[-10%] top-[-20%] h-[500px] w-[500px] bg-indigo-600" />
      <div className="aurora right-[-15%] top-[10%] h-[400px] w-[400px] bg-violet-600" />
      <div className="aurora left-[30%] top-[60%] h-[450px] w-[450px] bg-cyan-500 opacity-20" />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SheetNative</span>
            <Badge tone="brand">AI Business OS</Badge>
          </div>
          <div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#platforms" className="hover:text-white">Platforms</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <LinkButton href="/app">Open workspace →</LinkButton>
            ) : (
              <>
                <Button variant="ghost" size="md" onClick={showAuth}>Sign in</Button>
                <Button size="md" onClick={showAuth}>Start free</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center">
        <Badge tone="brand" >Upload Excel. Get an operating system.</Badge>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.1] tracking-tight md:text-7xl animate-rise">
          Turn messy Excel businesses into <span className="gradient-text">enterprise software</span> in minutes
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 animate-fade">
          AI reads your workbook — every formula, every relationship, every workflow — then generates a full stack:
          PostgreSQL database, APIs, dashboards, mobile &amp; desktop apps, automations, and AI employees.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade">
          {signedIn ? (
            <LinkButton href="/app/workbooks" size="lg"><Upload className="h-4 w-4" /> Upload your workbook</LinkButton>
          ) : (
            <Button size="lg" onClick={showAuth}><Upload className="h-4 w-4" /> Upload your workbook</Button>
          )}
          <LinkButton href="#how" size="lg" variant="outline">See how it works</LinkButton>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> No migration downtime</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Keep thinking in spreadsheets</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Works offline</span>
        </div>

        {/* Product mock */}
        <div className="mx-auto mt-16 max-w-5xl animate-rise">
          <div className="glass-strong relative overflow-hidden p-1.5 rounded-3xl shadow-2xl shadow-indigo-950/50">
            <div className="flex items-center gap-1.5 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-slate-500">sheetnative — acme-trading.xlsx</span>
            </div>
            <div className="grid gap-3 rounded-2xl bg-black/40 p-5 text-left md:grid-cols-3">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2 text-xs text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse-soft" /> Interpreting workbook…
                </div>
                {[
                  ["Scanning 6 sheets, 12,408 rows", "done"],
                  ["Understanding 214 formulas → business logic", "done"],
                  ["Detected domain: Trading & Inventory (94%)", "done"],
                  ["Generating PostgreSQL schema — 5 tables", "done"],
                  ["Generating web, mobile & desktop apps", "running"],
                ].map(([label, state]) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3">
                    {state === "done" ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15"><Check className="h-3 w-3 text-emerald-400" /></span>
                    ) : (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                    )}
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="text-[11px] text-slate-500">RISK SCORE</div>
                  <div className="mt-1 text-2xl font-semibold text-emerald-400">31 <span className="text-xs font-normal text-slate-500">/ 100</span></div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="text-[11px] text-slate-500">AUTOMATION POTENTIAL</div>
                  <div className="mt-1 text-2xl font-semibold text-indigo-300">87</div>
                </div>
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-200">
                  “Total Monthly Revenue” was <span className="font-mono">=SUM(B2:B20)</span>. Now it's a live, audited metric.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">From spreadsheet to system in four steps</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {[
            { icon: Upload, t: "Upload", d: "Drop any XLSX, XLS, CSV or Google Sheets export. Macros, hidden sheets, pivots — all handled." },
            { icon: Sparkles, t: "Understand", d: "AI maps entities, explains every formula in business language, and scores your risks." },
            { icon: Database, t: "Generate", d: "PostgreSQL schema, APIs, dashboards, permissions and native apps — one click, no templates." },
            { icon: Bot, t: "Operate", d: "AI employees run the workflows, flag risks, chase payments and forecast what's next." },
          ].map((s, i) => (
            <Card key={s.t} className="relative">
              <span className="absolute right-4 top-4 text-4xl font-bold text-white/5">{i + 1}</span>
              <s.icon className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <Badge tone="brand">One platform replaces them all</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Excel, ERP, CRM, inventory, approvals,<br className="hidden md:block" /> reporting and automation — unified</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-indigo-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3.5 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section id="platforms" className="mx-auto max-w-7xl px-6 py-24">
        <div className="glass-strong relative overflow-hidden p-10 md:p-14">
          <div className="aurora right-[-5%] top-[-30%] h-[300px] w-[300px] bg-violet-600" />
          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <div>
              <Badge tone="brand">True cross-platform</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Your business runs everywhere. So does your software.</h2>
              <p className="mt-4 text-slate-400">
                One data model, every surface. Offline-first sync keeps the warehouse, the road and the boardroom
                on the same page — even with zero bars.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-slate-300">
                {["GPS check-ins and delivery proof", "Barcode / NFC inventory scanning", "OCR for invoices and receipts", "Voice approvals in any language", "Native file access and drag-drop on desktop"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5"><Zap className="h-4 w-4 text-indigo-400" />{f}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="glass flex flex-col items-center gap-2 p-5 text-center">
                  <MonitorSmartphone className="h-5 w-5 text-indigo-300" />
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-[11px] text-slate-500">{p.tech}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <Badge tone="brand">Pricing</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Starts at $99/mo. Scales with you.</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`glass relative p-6 ${p.featured ? "border-indigo-500/40 shadow-xl shadow-indigo-500/10" : ""}`}
            >
              {p.featured && <Badge tone="brand">Most popular</Badge>}
              <h3 className="mt-3 font-semibold">{p.name}</h3>
              <div className="mt-2 text-3xl font-semibold">${p.price}<span className="text-sm font-normal text-slate-500">/mo</span></div>
              <ul className="mt-5 space-y-2.5 text-[13px] text-slate-300">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" />{f}</li>
                ))}
              </ul>
              <Button
                variant={p.featured ? "primary" : "outline"}
                className="mt-6 w-full"
                onClick={() => (signedIn ? (window.location.href = "/app/billing") : showAuth())}
              >
                Choose {p.name}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Enterprise: custom plans with SSO/SAML, HIPAA mode, private cloud and dedicated infrastructure.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-28">
        <div className="glass-strong relative overflow-hidden p-12 text-center md:p-16">
          <div className="aurora left-[20%] top-[-40%] h-[350px] w-[350px] bg-indigo-600" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Your business already has the data.<br /><span className="gradient-text">Give it an operating system.</span></h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => (signedIn ? (window.location.href = "/app/workbooks") : showAuth())}>
                <Upload className="h-4 w-4" /> Upload your first workbook
              </Button>
              <LinkButton href="/app" size="lg" variant="outline"><ArrowRight className="h-4 w-4" /> Explore the demo workspace</LinkButton>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>© 2026 SheetNative — AI Business Operating System</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Web</span>
            <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> iOS + Android</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> SOC2-ready</span>
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Marketplace</span>
            <span className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" /> Voice AI</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
