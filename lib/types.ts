export type ColumnType =
  | "text"
  | "number"
  | "integer"
  | "currency"
  | "date"
  | "boolean";

export interface ColumnSpec {
  name: string;
  type: ColumnType;
  pgType: string;
  nullable: boolean;
  sample: string;
}

export interface EntitySpec {
  name: string;
  sheet: string;
  role: string;
  rowCount: number;
  columns: ColumnSpec[];
  createTableSQL: string;
}

export interface FormulaRef {
  sheet: string;
  cell: string;
  formula: string;
  explanation: string;
  category: string;
}

export interface Risk {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  sheet?: string;
}

export interface Detection {
  domain: string;
  confidence: number;
  evidence: string[];
}

export interface Analysis {
  fileName: string;
  summary: string;
  entities: EntitySpec[];
  formulas: FormulaRef[];
  risks: Risk[];
  detections: Detection[];
  stats: { sheets: number; rows: number; formulas: number; columns: number };
  scores: { risk: number; automation: number; migration: number };
  createdAt: string;
}

export interface ParsedSheet {
  name: string;
  hidden: boolean;
  headers: string[];
  rows: Record<string, unknown>[];
  formulaCells: { cell: string; col: string; formula: string }[];
}
