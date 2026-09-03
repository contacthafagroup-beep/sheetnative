"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Sparkles, Mail, Lock, Chrome, Github, ChevronRight } from "lucide-react";
import { Button, cx } from "@/components/ui";
import {
  getSupabase,
  signInWithProvider,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/supabase/client";

const AUTH_EVENT = "sheetnative:auth";

export function showAuth() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(AUTH_EVENT, handler);
    return () => window.removeEventListener(AUTH_EVENT, handler);
  }, []);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res =
        mode === "signin"
          ? await signInWithPassword(email.trim(), password)
          : await signUpWithPassword(email.trim(), password);
      if (res.error) {
        setError(res.error.message);
        return;
      }
      if (mode === "signup" && !res.data.session) {
        setNotice("Check your inbox — confirm your email to activate your account.");
        return;
      }
      setOpen(false);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google" | "github") => {
    setBusy(true);
    setError(null);
    const res = await signInWithProvider(provider);
    if (res.error) {
      setError(res.error.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade" onClick={() => setOpen(false)}>
      <div className="glass-strong w-full max-w-sm p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</div>
              <div className="text-xs text-slate-500">SheetNative — AI Business OS</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2.5">
          <Button variant="outline" className="w-full" onClick={() => oauth("google")} disabled={busy}>
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={() => oauth("github")} disabled={busy}>
            <Github className="h-4 w-4" /> Continue with GitHub
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3 text-[11px] text-slate-600">
          <span className="h-px flex-1 bg-white/10" /> or with email <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@company.com"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
            <Lock className="h-4 w-4 text-slate-500" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              type="password"
              placeholder="Password"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        {notice && <p className="mt-3 text-xs text-emerald-300">{notice}</p>}

        <Button className="mt-4 w-full" onClick={submit} disabled={busy || !email || !password}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : "Create account"}
          <ChevronRight className="h-4 w-4" />
        </Button>

        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-indigo-300"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
