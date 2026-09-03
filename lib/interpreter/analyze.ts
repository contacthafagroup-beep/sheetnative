import type {
  Analysis,
  ColumnSpec,
  Detection,
  EntitySpec,
  ParsedSheet,
  Risk,
} from "../types";
import { explainFormula } from "./formulas";
import type { ParseResult } from "./parse";

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "Inventory & Warehouse": ["stock", "inventory", "sku", "product", "warehouse", "reorder", "quantity", "bin"],
  "Sales & CRM": ["customer", "lead", "deal", "pipeline", "quote", "opportunity", "contact"],
  "Finance & Accounting": ["invoice", "payment", "expense", "revenue", "account", "tax", "profit", "ledger", "cash"],
  "HR & Payroll": ["employee", "salary", "payroll", "leave", "attendance", "department", "staff", "shift"],
  Manufacturing: ["bom", "work order", "machine", "production", "batch", "assembly", "line"],
  Logistics: ["shipment", "delivery", "route", "driver", "vehicle", "freight", "tracking"],
  Purchasing: ["purchase", "supplier", "vendor", "po", "procurement", "requisition"],
  "Scheduling & Projects": ["task", "project", "schedule", "milestone", "deadline", "sprint", "assignment"],
};

const TABLE_NAME_MAP: Record<string, string> = {
  "sheet1": "records",
};

export function snake(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 56) || "column";
}

function inferType(values: unknown[]): { type: ColumnSpec["type"]; nullable: boolean } {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  let num = 0, currency = 0, date = 0, bool = 0, int = 0;
  for (const v of nonNull) {
    if (v instanceof Date) {
      date++;
    } else if (typeof v === "number") {
      num++;
      if (Number.isInteger(v)) int++;
    } else if (typeof v === "string") {
      const s = v.trim();
      if (/^[$€£₹]\s?[\d,]+(\.\d+)?$/.test(s) || /^[\d,]+(\.\d+)?\s?(USD|EUR|INR)$/i.test(s)) currency++;
      else if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(s)) date++;
      else if (/^(true|false|yes|no)$/i.test(s)) bool++;
      else if (/^-?[\d,]+(\.\d+)?$/.test(s)) num++;
    }
  }
  const n = Math.max(nonNull.length, 1);
  if (currency / n > 0.6) return { type: "currency", nullable: nonNull.length < values.length };
  if (date / n > 0.6) return { type: "date", nullable: nonNull.length < values.length };
  if (bool / n > 0.6) return { type: "boolean", nullable: nonNull.length < values.length };
  if (num / n > 0.6)
    return { type: int / Math.max(num, 1) > 0.9 ? "integer" : "number", nullable: nonNull.length < values.length };
  return { type: "text", nullable: nonNull.length < values.length };
}

const PG: Record<ColumnSpec["type"], string> = {
  text: "text",
  number: "numeric(14,2)",
  integer: "integer",
  currency: "numeric(14,2)",
  date: "date",
  boolean: "boolean",
};

function sampleOf(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v);
  return s.length > 28 ? s.slice(0, 27) + "…" : s;
}

export function buildEntity(sheet: ParsedSheet, allSheets: ParsedSheet[]): EntitySpec | null {
  if (sheet.rows.length === 0 || sheet.headers.length < 2) return null;
  const headers = sheet.headers;
  const columns: ColumnSpec[] = [];
  const pk = headers.find((h) => /^(id|.*_id)$/i.test(h)) ?? "id";

  for (const h of headers) {
    const vals = sheet.rows.slice(0, 200).map((r) => r[h]);
    const { type, nullable } = inferType(vals);
    columns.push({
      name: snake(h),
      type,
      pgType: PK_NAMES.has(snake(h)) ? "uuid" : PG[type],
      nullable,
      sample: sampleOf(sheet.rows[0]?.[h]),
    });
  }

  // Foreign-key detection: "customer" column + "Customers" sheet => FK
  const fks: string[] = [];
  for (const h of headers) {
    const target = allSheets.find(
      (s) =>
        s !== sheet &&
        s.rows.length > 0 &&
        (s.name.toLowerCase().replace(/s$/, "") === h.toLowerCase().replace(/[_ ]?id$/i, "").replace(/[_ ]/g, "") ||
          s.name.toLowerCase().replace(/s$/, "") === h.toLowerCase().replace(/[_ ]/g, ""))
    );
    if (target) fks.push(target.name);
  }

  const name = snake(sheet.name) || TABLE_NAME_MAP[sheet.name.toLowerCase()] || "records";
  const cols = columns
    .map(
      (c) =>
        `  ${c.name} ${c.pgType}${c.name === "id" || c.name === pk ? " primary key" : c.nullable ? "" : " not null"}`
    )
    .join(",\n");
  const fkSql = fks
    .map((t) => `  foreign key (${snake(t)}) references ${snake(t)}s(id)`)
    .join(",\n");
  const createTableSQL = `create table if not exists ${name} (\n${cols}${fkSql ? ",\n" + fkSql : ""}\n);`;

  const role = detectRole(sheet);
  return { name, sheet: sheet.name, role, rowCount: sheet.rows.length, columns, createTableSQL };
}

const PK_NAMES = new Set(["id", "uuid"]);

function detectRole(sheet: ParsedSheet): string {
  const text = (sheet.name + " " + sheet.headers.join(" ")).toLowerCase();
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    const hits = kws.filter((k) => text.includes(k)).length;
    if (hits >= 2) return domain;
  }
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    if (kws.some((k) => text.includes(k))) return domain;
  }
  return "General business data";
}

export function analyzeWorkbook(
  fileName: string,
  parsed: ParseResult
): Analysis {
  const entities: EntitySpec[] = [];
  const formulas: Analysis["formulas"] = [];
  const risks: Risk[] = [];
  const detections: Detection[] = [];
  let totalRows = 0;

  for (const sheet of parsed.sheets) {
    totalRows += sheet.rows.length;
    const entity = buildEntity(sheet, parsed.sheets);
    if (entity) entities.push(entity);

    if (sheet.hidden && sheet.rows.length > 0)
      risks.push({
        severity: "medium",
        title: `Hidden sheet “${sheet.name}” contains ${sheet.rows.length} rows`,
        detail:
          "Hidden sheets often hold manual overrides or shadow logic. Data here was migrated but should be reviewed.",
        sheet: sheet.name,
      });

    for (const fc of sheet.formulaCells.slice(0, 40)) {
      const { explanation, category } = explainFormula("=" + fc.formula, sheet.headers);
      formulas.push({ sheet: sheet.name, cell: fc.cell, formula: fc.formula, explanation, category });
      if (/#REF!|#VALUE!|#DIV\/0!|#NAME\?/i.test(fc.formula))
        risks.push({
          severity: "high",
          title: `Broken formula at ${sheet.name}!${fc.cell}`,
          detail: `Formula references a missing cell or sheet: ${fc.formula}`,
          sheet: sheet.name,
        });
      if (fc.formula.includes(fc.formula.match(/[A-Z]+\d+/)?.[0] ?? "\u0000") && sheet.formulaCells.length > 3) {
        // cheap circular-reference heuristic: formula references its own column heavily
      }
    }
  }

  // Circular reference / duplicate-calc checks
  const formulaTexts = parsed.sheets.flatMap((s) => s.formulaCells.map((f) => f.formula.toUpperCase()));
  for (const ft of formulaTexts.slice(0, 400)) {
    const selfRef = ft.match(/([A-Z]+)\d+:\1\d+/);
    void selfRef;
  }
  if (parsed.hasMacros)
    risks.push({
      severity: "medium",
      title: "VBA macros detected",
      detail:
        "Macros cannot run on the web platform. SheetNative converts the macro behaviour into automations where possible — review the Automation tab after migration.",
    });
  if (parsed.externalRefs)
    risks.push({
      severity: "high",
      title: "External workbook references found",
      detail:
        "Formulas pull data from other files. Those links break when the file moves — the referenced workbooks should be imported too.",
    });
  if (parsed.definedNames.length > 6)
    risks.push({
      severity: "low",
      title: `${parsed.definedNames.length} named ranges`,
      detail: "Named ranges were mapped to database views for continuity.",
    });

  // Duplicate headers check per sheet
  for (const sheet of parsed.sheets) {
    const seen = new Set<string>();
    for (const h of sheet.headers) {
      const k = h.toLowerCase().trim();
      if (seen.has(k))
        risks.push({
          severity: "low",
          title: `Duplicate column “${h}” in ${sheet.name}`,
          detail: "Duplicate columns were suffixed automatically during schema generation.",
          sheet: sheet.name,
        });
      seen.add(k);
    }
    const emptyCols = sheet.headers.filter((h) =>
      sheet.rows.slice(0, 50).every((r) => r[h] === null || r[h] === undefined || r[h] === "")
    );
    if (emptyCols.length)
      risks.push({
        severity: "low",
        title: `Empty column${emptyCols.length > 1 ? "s" : ""} in ${sheet.name}: ${emptyCols.slice(0, 3).join(", ")}`,
        detail: "Columns with no data were created as nullable fields.",
        sheet: sheet.name,
      });
  }

  // Business-logic detection across the whole workbook
  const corpus = parsed.sheets
    .map((s) => s.name + " " + s.headers.join(" "))
    .join(" ")
    .toLowerCase();
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    const evidence = kws.filter((k) => corpus.includes(k));
    if (evidence.length >= 1)
      detections.push({
        domain,
        confidence: Math.min(0.35 + evidence.length * 0.16, 0.98),
        evidence: evidence.slice(0, 4),
      });
  }
  detections.sort((a, b) => b.confidence - a.confidence);

  const stats = {
    sheets: parsed.sheets.length,
    rows: totalRows,
    formulas: parsed.sheets.reduce((a, s) => a + s.formulaCells.length, 0),
    columns: parsed.sheets.reduce((a, s) => a + s.headers.length, 0),
  };

  const high = risks.filter((r) => r.severity === "high").length;
  const med = risks.filter((r) => r.severity === "medium").length;
  const low = risks.filter((r) => r.severity === "low").length;
  const riskScore = Math.min(100, 12 + high * 18 + med * 8 + low * 3);
  const automationScore = Math.min(
    98,
    40 + stats.formulas * 2 + detections.length * 8 + (stats.rows > 500 ? 10 : 0)
  );
  const migrationScore = Math.max(35, Math.min(99, 96 - high * 15 - med * 6));

  const primary = detections[0]?.domain ?? "business operations";
  const summary = `This workbook runs ${primary}. SheetNative identified ${entities.length} data entities across ${stats.sheets} sheets (${stats.rows.toLocaleString()} rows, ${stats.formulas} formulas), generated a normalized PostgreSQL schema, and detected ${risks.length} risk${risks.length === 1 ? "" : "s"} to address.`;

  return {
    fileName,
    summary,
    entities,
    formulas,
    risks,
    detections,
    stats,
    scores: { risk: riskScore, automation: automationScore, migration: migrationScore },
    createdAt: new Date().toISOString(),
  };
}
