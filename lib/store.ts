import { getSupabase } from "./supabase/client";
import type { Analysis } from "./types";

export type EntityRows = Record<string, Record<string, unknown>[]>;

export interface WorkbookRow {
  id: string;
  user_id: string;
  file_name: string;
  status: string;
  analysis: Analysis;
  created_at: string;
}

export async function fetchWorkbooks(): Promise<WorkbookRow[]> {
  const { data, error } = await getSupabase()
    .from("workbooks")
    .select("id,user_id,file_name,status,analysis,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkbookRow[];
}

export async function saveWorkbook(fileName: string, analysis: Analysis): Promise<WorkbookRow> {
  const sb = getSupabase();
  const { data: u } = await sb.auth.getUser();
  const row = {
    user_id: u.user?.id,
    file_name: fileName,
    status: "migrated",
    analysis,
  };
  const { data, error } = await sb.from("workbooks").insert(row).select().single();
  if (error) throw new Error(error.message);
  return data as WorkbookRow;
}

export async function deleteWorkbook(id: string): Promise<void> {
  const { error } = await getSupabase().from("workbooks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchEntityRows(entityName: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await getSupabase()
    .from("entity_rows")
    .select("data")
    .eq("entity", entityName)
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d: { data: Record<string, unknown> }) => d.data);
}

export async function saveEntityRows(
  entityName: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const sb = getSupabase();
  const { data: u } = await sb.auth.getUser();
  const payload = rows.map((r) => ({
    user_id: u.user?.id,
    entity: entityName,
    data: r,
  }));
  const { error } = await sb.from("entity_rows").insert(payload);
  if (error) throw new Error(error.message);
}

export async function fetchAllRows(analysis: Analysis | null): Promise<EntityRows> {
  if (!analysis) return {};
  const out: EntityRows = {};
  await Promise.all(
    analysis.entities.map(async (e) => {
      try {
        out[e.name] = await fetchEntityRows(e.name);
      } catch {
        out[e.name] = [];
      }
    })
  );
  return out;
}

// --- Automations ---
export interface AutomationRow {
  id: string;
  user_id: string;
  name: string;
  rule: unknown;
  enabled: boolean;
  created_at: string;
}

export async function fetchAutomations(): Promise<AutomationRow[]> {
  const { data, error } = await getSupabase()
    .from("automations")
    .select("id,user_id,name,rule,enabled,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AutomationRow[];
}

export async function saveAutomation(name: string, rule: unknown): Promise<AutomationRow> {
  const sb = getSupabase();
  const { data: u } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("automations")
    .insert({ user_id: u.user?.id, name, rule, enabled: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as AutomationRow;
}

export async function toggleAutomation(id: string, enabled: boolean): Promise<void> {
  const { error } = await getSupabase().from("automations").update({ enabled }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAutomation(id: string): Promise<void> {
  const { error } = await getSupabase().from("automations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// --- Approvals ---
export interface ApprovalRow {
  id: string;
  user_id: string;
  title: string;
  kind: string;
  amount: number | null;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export async function fetchApprovals(): Promise<ApprovalRow[]> {
  const { data, error } = await getSupabase()
    .from("approvals")
    .select("id,user_id,title,kind,amount,status,payload,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ApprovalRow[];
}

export async function decideApproval(id: string, status: "approved" | "rejected"): Promise<void> {
  const { error } = await getSupabase().from("approvals").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveApproval(
  title: string,
  kind: string,
  amount: number | null
): Promise<void> {
  const sb = getSupabase();
  const { data: u } = await sb.auth.getUser();
  const { error } = await sb.from("approvals").insert({
    user_id: u.user?.id,
    title,
    kind,
    amount,
    status: "pending",
    payload: {},
  });
  if (error) throw new Error(error.message);
}

// --- AI Employees ---
export interface EmployeeRow {
  id: string;
  user_id: string;
  name: string;
  role: string;
  instructions: string;
  created_at: string;
}

export async function fetchEmployees(): Promise<EmployeeRow[]> {
  const { data, error } = await getSupabase()
    .from("ai_employees")
    .select("id,user_id,name,role,instructions,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmployeeRow[];
}

export async function saveEmployee(name: string, role: string, instructions: string): Promise<EmployeeRow> {
  const sb = getSupabase();
  const { data: u } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("ai_employees")
    .insert({ user_id: u.user?.id, name, role, instructions })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as EmployeeRow;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await getSupabase().from("ai_employees").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
