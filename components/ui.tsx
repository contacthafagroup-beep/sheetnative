import clsx from "clsx";
import Link from "next/link";

export function cx(...args: Parameters<typeof clsx>) {
  return clsx(...args);
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "good";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        size === "sm" && "text-xs px-3 py-1.5",
        size === "md" && "text-sm px-4 py-2",
        size === "lg" && "text-base px-6 py-3",
        variant === "primary" &&
          "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110",
        variant === "ghost" && "text-slate-300 hover:text-white hover:bg-white/5",
        variant === "outline" &&
          "border border-white/15 text-slate-200 hover:bg-white/5 hover:border-white/25",
        variant === "danger" && "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
        variant === "good" && "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]",
        size === "sm" && "text-xs px-3 py-1.5",
        size === "md" && "text-sm px-4 py-2",
        size === "lg" && "text-base px-6 py-3",
        variant === "primary" &&
          "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110",
        variant === "ghost" && "text-slate-300 hover:text-white hover:bg-white/5",
        variant === "outline" &&
          "border border-white/15 text-slate-200 hover:bg-white/5 hover:border-white/25"
      )}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
  strong,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={cx(strong ? "glass-strong" : "glass", "p-5", className)}>{children}</div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "brand";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "neutral" && "bg-white/8 text-slate-300 border border-white/10",
        tone === "good" && "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25",
        tone === "warn" && "bg-amber-500/12 text-amber-300 border border-amber-500/25",
        tone === "bad" && "bg-red-500/12 text-red-300 border border-red-500/25",
        tone === "brand" && "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  tone?: "brand" | "good" | "warn" | "bad";
}) {
  const glow = {
    brand: "from-indigo-500/20",
    good: "from-emerald-500/20",
    warn: "from-amber-500/20",
    bad: "from-red-500/20",
  }[tone];
  return (
    <div className="glass relative overflow-hidden p-4">
      <div className={cx("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl", glow)} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function ScoreRing({ value, label, tone }: { value: number; label: string; tone: string }) {
  const color = { good: "#34d399", warn: "#fbbf24", bad: "#f87171", brand: "#818cf8" }[tone] ?? "#818cf8";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 264} 264`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold">{value}</div>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="glass flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-slate-400">{body}</p>
      {action}
    </div>
  );
}
