import type { Analysis, EntitySpec } from "./types";

export interface EntityRows {
  [entity: string]: Record<string, unknown>[];
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function buildReportHtml(analysis: Analysis, rows: EntityRows): string {
  const now = new Date().toLocaleString();
  const sections = analysis.entities
    .map((e: EntitySpec) => {
      const data = rows[e.name] ?? [];
      const numeric = e.columns.filter((c) => ["number", "currency", "integer"].includes(c.type));
      const totals = numeric
        .map((c) => ({ name: c.name, total: data.reduce((a, r) => a + num(r[c.name]), 0) }))
        .filter((t) => t.total !== 0 || data.length > 0);
      const preview = data.slice(0, 5);
      const headers = e.columns.slice(0, 6).map((c) => c.name);

      return `
      <section style="margin:28px 0;page-break-inside:avoid">
        <h2 style="font-size:16px;margin:0 0 4px;color:#312e81">${esc(e.name)} <span style="color:#64748b;font-weight:400">· ${esc(e.sheet)} · ${data.length} rows</span></h2>
        ${totals.length ? `<p style="margin:0 0 10px;font-size:12px;color:#334155">${totals.map((t) => `<b>${esc(t.name)}</b>: ${fmt(t.total)}`).join(" &nbsp;·&nbsp; ")}</p>` : ""}
        ${
          preview.length
            ? `<table style="width:100%;border-collapse:collapse;font-size:11px">
                <thead><tr>${headers.map((h) => `<th style="text-align:left;padding:5px 8px;background:#eef2ff;color:#3730a3;border:1px solid #e0e7ff">${esc(h)}</th>`).join("")}</tr></thead>
                <tbody>${preview
                  .map(
                    (r) =>
                      `<tr>${headers
                        .map((h) => {
                          const col = e.columns.find((c) => c.name === h);
                          const v = r[h];
                          const text = v === null || v === undefined ? "—" : col?.type === "currency" ? "$" + fmt(num(v)) : String(v);
                          return `<td style="padding:5px 8px;border:1px solid #e0e7ff;color:#1e293b">${esc(text)}</td>`;
                        })
                        .join("")}</tr>`
                  )
                  .join("")}</tbody>
              </table>
              ${data.length > 5 ? `<p style="font-size:10px;color:#94a3b8;margin:4px 0 0">…and ${data.length - 5} more rows</p>` : ""}`
            : `<p style="font-size:12px;color:#64748b">No migrated rows for this entity yet.</p>`
        }
      </section>`;
    })
    .join("");

  const totalRows = analysis.entities.reduce((a, e) => a + (rows[e.name]?.length ?? 0), 0);

  return `<!doctype html><html><head><meta charset="utf-8"><title>SheetNative Report — ${esc(analysis.fileName)}</title>
  <style>
    @page { margin: 22mm 18mm; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px; }
    .hdr { display:flex; align-items:center; gap:14px; border-bottom:3px solid; border-image:linear-gradient(90deg,#6366f1,#a855f7) 1; padding-bottom:16px; margin-bottom:8px; }
    .logo { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#6366f1,#a855f7); color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; }
    h1 { font-size:22px; margin:0; }
    .meta { font-size:12px; color:#64748b; margin:14px 0; }
    .stats { display:flex; gap:10px; margin:16px 0; }
    .stat { flex:1; border:1px solid #e0e7ff; border-radius:10px; padding:10px 12px; background:#f8faff; }
    .stat b { display:block; font-size:18px; color:#312e81; }
    .stat span { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
    @media print { .noprint { display:none } }
  </style></head><body>
    <div class="hdr">
      <div class="logo">✦</div>
      <div><h1>SheetNative Business Report</h1>
      <div style="font-size:12px;color:#64748b">${esc(analysis.fileName)}</div></div>
    </div>
    <p class="meta">Generated ${esc(now)} · Risk score ${analysis.scores?.risk ?? "—"}/100 · Automation score ${analysis.scores?.automation ?? "—"}/100</p>
    <div class="stats">
      <div class="stat"><b>${analysis.entities.length}</b><span>Entities</span></div>
      <div class="stat"><b>${totalRows.toLocaleString()}</b><span>Migrated rows</span></div>
      <div class="stat"><b>${analysis.detections?.length ?? 0}</b><span>Business domains</span></div>
      <div class="stat"><b>${analysis.scores?.risk ?? "—"}</b><span>Risk score</span></div>
    </div>
    ${sections}
    <p style="margin-top:36px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px">
      Generated by SheetNative — sheetnative.vercel.app · This report reflects the data migrated to the SheetNative PostgreSQL database at generation time.
    </p>
    <script>window.onload = () => setTimeout(() => window.print(), 350);</script>
  </body></html>`;
}
