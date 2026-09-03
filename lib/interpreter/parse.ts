import * as XLSX from "xlsx";
import type { ParsedSheet } from "../types";

export interface ParseResult {
  sheets: ParsedSheet[];
  hasMacros: boolean;
  externalRefs: boolean;
  definedNames: string[];
}

export function parseWorkbook(data: ArrayBuffer): ParseResult {
  const wb = XLSX.read(data, { cellFormula: true, bookVBA: true, cellDates: true, dense: false });
  const hasMacros = !!(wb as { vbaraw?: unknown }).vbaraw;
  const definedNames: string[] = Object.keys(
    (wb as { Workbook?: { Names?: unknown[] } }).Workbook?.Names ?? {}
  );

  const sheets: ParsedSheet[] = [];
  let externalRefs = false;

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const hidden = !!(
      wb.Workbook?.Sheets?.find((s: { name?: string }) => s.name === name) as {
        Hidden?: number;
      }
    )?.Hidden;

    const rows: Record<string, unknown>[] = [];
    const formulaCells: ParsedSheet["formulaCells"] = [];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: null,
    });

    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 5000); r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr] as { f?: string; t?: string; v?: unknown } | undefined;
        if (cell?.f) {
          if (/\[.+!|\w+!/.test(cell.f) && cell.f.includes("!")) {
            if (/\[[^\]]+\]/.test(cell.f)) externalRefs = true;
          }
          const header = String(
            ws[XLSX.utils.encode_cell({ r: range.s.r, c })]?.v ?? `Column ${c + 1}`
          );
          formulaCells.push({ cell: addr, col: header, formula: cell.f });
        }
      }
    }

    if (json.length > 0) rows.push(...json);
    const headers = json.length
      ? Object.keys(json[0])
      : [];

    sheets.push({ name, hidden, headers, rows, formulaCells });
  }

  return { sheets, hasMacros, externalRefs, definedNames };
}

export function parseCsv(text: string, sheetName?: string): ParsedSheet[] {
  const wb = XLSX.read(text, { type: "string", raw: false, cellDates: true });
  const out: ParsedSheet[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: null,
    });
    out.push({
      name: sheetName ?? name,
      hidden: false,
      headers: rows.length ? Object.keys(rows[0]) : [],
      rows,
      formulaCells: [],
    });
  }
  return out;
}
