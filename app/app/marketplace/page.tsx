"use client";

import Link from "next/link";
import { Store, Upload, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 animate-rise">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-1 text-sm text-slate-400">
          Industry templates, automations, AI employees and plugins — install into any workspace, publish your own and earn revenue share.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-500/15">
          <Store className="h-6 w-6 text-indigo-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Opening soon</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            The marketplace launches with the first community templates. In the meantime, everything the templates
            would give you, AI can already build directly from your own data.
          </p>
        </div>
        <Link
          href="/app/workbooks"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
        >
          <Upload className="h-4 w-4" /> Build from your workbook instead
        </Link>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
        <Sparkles className="h-3 w-3" /> Template publishing and revenue sharing arrive with the marketplace launch.
      </p>
    </div>
  );
}
