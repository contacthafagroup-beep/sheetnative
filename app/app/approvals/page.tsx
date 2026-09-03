"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2, Check, X, Clock, DollarSign } from "lucide-react";
import { Badge, Button, Card, EmptyState, cx } from "@/components/ui";
import { fetchApprovals, decideApproval, type ApprovalRow } from "@/lib/store";

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => fetchApprovals().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      await decideApproval(id, status);
      load();
    } finally {
      setBusy(null);
    }
  };

  const pending = items?.filter((i) => i.status === "pending") ?? [];
  const decided = items?.filter((i) => i.status !== "pending") ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 animate-rise">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-slate-400">
          Multi-step approval chains for expenses, purchase orders, payroll, leave and invoices.
        </p>
      </div>

      {items === null ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
      ) : (
        <>
          <div className="space-y-2.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              Pending <Badge tone="warn">{pending.length}</Badge>
            </h2>
            {pending.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="h-6 w-6" />}
                title="Nothing waiting on you"
                body="New approval requests created by teammates or AI employees will appear here."
              />
            ) : (
              pending.map((a) => (
                <Card key={a.id} className="flex flex-wrap items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.title}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Badge tone="brand">{a.kind}</Badge>
                      {a.amount !== null && (
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{a.amount.toLocaleString()}</span>
                      )}
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="good" disabled={busy === a.id} onClick={() => decide(a.id, "approved")}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" disabled={busy === a.id} onClick={() => decide(a.id, "rejected")}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {decided.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-sm font-semibold text-slate-300">History</h2>
              {decided.map((a) => (
                <div key={a.id} className="glass flex items-center gap-3 p-3.5 opacity-70">
                  <span className={cx("h-2 w-2 rounded-full", a.status === "approved" ? "bg-emerald-400" : "bg-red-400")} />
                  <span className="min-w-0 flex-1 truncate text-sm">{a.title}</span>
                  <Badge tone={a.status === "approved" ? "good" : "bad"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
