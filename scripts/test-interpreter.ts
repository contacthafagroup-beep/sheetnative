// Quick functional check of the AI Workbook Interpreter (run with: npx tsx scripts/test-interpreter.ts)
import { readFileSync } from "node:fs";
import { parseCsv } from "../lib/interpreter/parse";
import { analyzeWorkbook } from "../lib/interpreter/analyze";
import { parseAutomation } from "../lib/automation";
import { answerQuestion } from "../lib/nlq";
import type { ChatMessage } from "../lib/nlq";

const csv = readFileSync("sample/sample-invoices.csv", "utf8");
const parsed = { sheets: parseCsv(csv), hasMacros: false, externalRefs: false, definedNames: [] };
const analysis = analyzeWorkbook("sample-invoices.csv", parsed);

console.log("summary:", analysis.summary);
console.log("entities:", analysis.entities.map((e) => `${e.name}(${e.columns.length} cols, ${e.rowCount} rows)`));
console.log("detections:", analysis.detections.map((d) => `${d.domain} ${(d.confidence * 100).toFixed(0)}%`));
console.log("scores:", analysis.scores);
console.log("SQL:\n" + analysis.entities[0].createTableSQL);

const rows: Record<string, Record<string, unknown>[]> = {};
for (const e of analysis.entities) {
  const sheet = parsed.sheets.find((s) => s.name === e.sheet);
  rows[e.name] = sheet?.rows ?? [];
}

const questions = ["What was total revenue?", "Show unpaid invoices", "Top 2 customers by amount"];
for (const q of questions) {
  console.log(`\nQ: ${q}`);
  console.log("A:", answerQuestion(q, analysis, rows).slice(0, 220));
}

console.log("\nautomation:", JSON.stringify(parseAutomation("When inventory falls below 20, notify purchasing by email"), null, 1));
void (0 as unknown as ChatMessage);
