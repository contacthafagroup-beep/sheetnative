import type { Analysis, EntitySpec } from "./types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
  action?: { label: string } | null;
}

interface Rows { [entity: string]: Record<string, unknown>[] }

const SUM_RE = /\brevenue\b|\bsales\b|\bincome\b|\bexpenses?\b|\bcosts?\b|\bspending?\b|\bamounts?\b|\btotals?\b|\bsum\b/i;
const LOW_RE = /\blow\b|\bbelow\b|\brunning out\b|\bstock\b|\breorder\b|\bshortage\b|\bout of\b/i;
const TOP_RE = /\btop\b|\bbest\b|\bbiggest\b|\blargest\b|\bmost\b|\bhighest\b/i;
const COUNT_RE = /\bhow many\b|\bcount\b|\bnumber of\b/i;
const UNPAID_RE = /\bunpaid\b|\bpending\b|\boverdue\b|\boutstanding\b|\bdue\b|\bawaiting\b/i;

function pickNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (v instanceof Date) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Rows may store keys under original Excel headers ("Invoice #") while analysis
// columns are snake_case ("invoice_"). Resolve case/spacing-insensitively.
function rowGet(row: Record<string, unknown>, col: string): unknown {
  if (col in row) return row[col];
  const key = Object.keys(row).find(
    (k) => k.toLowerCase().replace(/[^a-z0-9]+/g, "_") === col
  );
  return key ? row[key] : undefined;
}

function scoreEntity(entity: EntitySpec, q: string): number {
  const nameWords = (entity.name + " " + entity.sheet).toLowerCase();
  let s = 0;
  for (const w of q.toLowerCase().split(/\W+/)) if (w.length > 3 && nameWords.includes(w)) s += 2;
  if (/\binventory\b|\bstock\b/.test(q) && /stock|item|product|inventory/.test(nameWords)) s += 3;
  if (/\brevenue\b|\binvoice\b|\bpayment\b/.test(q) && /revenue|sales|invoice|order|payment/.test(nameWords)) s += 3;
  return s;
}

function findMetricColumn(entity: EntitySpec, q: string): string | null {
  const qLower = q.toLowerCase();
  const numeric = entity.columns.filter((c) => ["number", "currency", "integer"].includes(c.type));
  const byName = numeric.find((c) => qLower.includes(c.name.replace(/_/g, " ")));
  if (byName) return byName.name;
  const preferred = ["revenue", "total", "amount", "price", "value", "sales", "cost", "salary", "quantity", "stock"];
  for (const p of preferred) {
    const hit = numeric.find((c) => c.name.includes(p));
    if (hit) return hit.name;
  }
  return numeric[0]?.name ?? null;
}

function findLabelColumn(entity: EntitySpec, q: string): string {
  const qLower = q.toLowerCase();
  const textCols = entity.columns.filter((c) => c.type === "text");
  const byName = textCols.find((c) => qLower.includes(c.name.replace(/_/g, " ").replace(/s$/, "")));
  if (byName) return byName.name;
  return textCols[0]?.name ?? entity.columns[0]?.name ?? "id";
}

export function answerQuestion(q: string, analysis: Analysis, rows: Rows): string {
  const ql = q.toLowerCase().trim();

  if (/^(hi|hello|hey)\b/.test(ql) || ql.includes("what can you do"))
    return `I'm your business AI for “${analysis.fileName}”. I can answer questions like “What was total revenue?”, “Which customers owe the most?”, “Show low stock items”, or build reports and automations for you.`;

  if (!analysis.entities.length)
    return "Upload a workbook first and I'll learn your business from it. Then ask me anything about your numbers.";

  const ranked = [...analysis.entities].sort((a, b) => scoreEntity(b, ql) - scoreEntity(a, ql));
  const entity = ranked[0];
  const data = rows[entity.name] ?? [];
  if (!data.length)
    return `I found the “${entity.sheet}” table but it has no migrated rows yet. Finish the migration to ask questions about live data.`;

  const fmt = (n: number) =>
    "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Low stock / threshold alerts
  if (LOW_RE.test(ql)) {
    const metric = findMetricColumn(entity, ql) ?? "quantity";
    const threshold = Number(ql.match(/below (\d+)/)?.[1] ?? 20);
    const low = data
      .filter((r) => (pickNumber(rowGet(r, metric)) ?? Infinity) < threshold)
      .sort((a, b) => (pickNumber(a[metric]) ?? 0) - (pickNumber(b[metric]) ?? 0))
      .slice(0, 5);
    const labelCol = findLabelColumn(entity, ql);
    if (low.length === 0) return `Nothing in ${entity.sheet} is below ${threshold} ${metric.replace(/_/g, " ")}. You're covered.`;
    return `**${low.length}+ items below ${threshold}:**\n` +
      low.map((r) => `• ${rowGet(r, labelCol) ?? "Item"} — ${pickNumber(rowGet(r, metric))} ${metric.replace(/_/g, " ")}`).join("\n") +
      `\n\nWant me to draft a purchase order for these?`;
  }

  // Unpaid / overdue / status filters
  const statusCol = entity.columns.find((c) => /status|state|paid|stage/i.test(c.name));
  if (statusCol && UNPAID_RE.test(ql)) {
    const key = ql.match(/\bunpaid\b|\bpending\b|\boverdue\b|\boutstanding\b/)?.[0] ?? "unpaid";
    const matches = data.filter((r) => String(rowGet(r, statusCol.name) ?? "").toLowerCase().includes(key === "unpaid" ? "unpaid" : key));
    const labelCol = findLabelColumn(entity, ql);
    const metric = findMetricColumn(entity, ql);
    const total = matches.reduce((a, r) => a + (pickNumber(rowGet(r, metric ?? "")) ?? 0), 0);
    const preview = matches.slice(0, 5).map((r) => `• ${rowGet(r, labelCol) ?? "—"} (${rowGet(r, statusCol.name) ?? "?"})`).join("\n");
    return `${matches.length} ${key} record${matches.length === 1 ? "" : "s"} in ${entity.sheet}${metric ? `, worth **${fmt(total)}**` : ""}:\n${preview}${matches.length > 5 ? "\n…and more" : ""}`;
  }

  // Top-N ranking
  if (TOP_RE.test(ql)) {
    const metric = findMetricColumn(entity, ql);
    if (metric) {
      const labelCol = findLabelColumn(entity, ql);
      const n = Number(ql.match(/\btop (\d+)\b/)?.[1] ?? 5);
      const top = [...data]
        .sort((a, b) => (pickNumber(b[metric]) ?? 0) - (pickNumber(a[metric]) ?? 0))
        .slice(0, n);
      return `Top ${n} by ${metric.replace(/_/g, " ")}:\n` +
        top
          .map((r, i) => `${i + 1}. ${rowGet(r, labelCol) ?? "—"} — ${fmt(pickNumber(rowGet(r, metric)) ?? 0)}`)
          .join("\n");
    }
  }

  // Totals
  if (SUM_RE.test(ql)) {
    const metric = findMetricColumn(entity, ql);
    if (metric) {
      const total = data.reduce((a, r) => a + (pickNumber(rowGet(r, metric)) ?? 0), 0);
      const nice = metric.replace(/_/g, " ");
      const periodMatch = ql.match(/\bmonth\b|\bweekly?\b|\bquarter\b|\byear\b/);
      return `Total ${nice} in ${entity.sheet} is **${fmt(total)}** across ${data.length} records${
        periodMatch ? ". Ask me to break it down by month for a trend view." : "."
      }`;
    }
  }

  // Counts
  if (COUNT_RE.test(ql) || /\bcustomers?\b|\borders?\b|\binvoices?\b|\bemployees?\b/.test(ql)) {
    const grouped = entity.columns.find((c) => c.type === "text" && /status|type|category|region|stage/i.test(c.name));
    if (grouped && /\bby\b/.test(ql)) {
      const counts = new Map<string, number>();
      for (const r of data) {
        const k = String(rowGet(r, grouped.name) ?? "—");
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
      return `Breakdown by ${grouped.name.replace(/_/g, " ")}:\n` +
        top.map(([k, v]) => `• ${k}: ${v}`).join("\n");
    }
    return `${entity.sheet} contains **${data.length} records**.`;
  }

  // Generic fallback: summarise the most relevant entity
  const numericCols = entity.columns.filter((c) => ["number", "currency"].includes(c.type));
  let extra = "";
  for (const c of numericCols.slice(0, 2)) {
    const t = data.reduce((a, r) => a + (pickNumber(rowGet(r, c.name)) ?? 0), 0);
    extra += `• Total ${c.name.replace(/_/g, " ")}: ${fmt(t)}\n`;
  }
  return `Here's what I see in **${entity.sheet}** (${data.length} records):\n${extra}\nAsk me for totals, top performers, low stock, unpaid items — or say “build a report”.`;
}
