// SheetNative E2E test — runs against the user's own Supabase project.
// Usage: node scripts/e2e-supabase.mjs
const K = "sb_publishable_jBoN1Vj0SoRRRnPEbPnn4A_1b0pYPWC";
const B = "https://vbayhnlkcoqgssgapaay.supabase.co";
const EMAIL = "e2e-test@sheetnative.dev";
const PASS = "TestPass!234";

const out = [];
const log = (...a) => { const s = a.join(" "); out.push(s); console.log(s); };

(async () => {
  // 1. Sign up (or sign in if user already exists from a previous run)
  let r = await fetch(`${B}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: K, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  let j = await r.json();
  log(`1_SIGNUP status=${r.status} user=${j.user?.email ?? "(none)"}`, j.msg || j.error || j.error_description || "ok");

  let token = j.access_token, uid = j.user?.id;
  if (!token) {
    r = await fetch(`${B}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: K, "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASS }),
    });
    j = await r.json();
    log(`1B_SIGNIN status=${r.status}`, j.error_description || j.error || "ok");
    token = j.access_token; uid = j.user?.id;
  }
  if (!token) { log("FATAL: no session token — email confirmation may be required in the Supabase dashboard (Auth > Providers > Email > disable 'Confirm email' for testing, or use an OAuth provider)."); await flush(); process.exit(1); }
  log(`1C_SESSION token=yes uid=${uid}`);

  const H = { apikey: K, "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // 2. Insert a workbook (simulates upload + interpreter result)
  const wb = {
    user_id: uid,
    file_name: "e2e-sample.xlsx",
    status: "migrated",
    analysis: {
      fileName: "e2e-sample.xlsx",
      stats: { sheets: 2, rows: 6, formulas: 0, columns: 7 },
      entities: [], risks: [], detections: [], formulas: [],
      scores: { risk: 20, automation: 80, migration: 95 },
      createdAt: new Date().toISOString(),
    },
  };
  r = await fetch(`${B}/rest/v1/workbooks`, { method: "POST", headers: H, body: JSON.stringify(wb) });
  log(`2_INSERT_WORKBOOK status=${r.status}`, (await r.text()).slice(0, 100));

  // 3. Read back
  r = await fetch(`${B}/rest/v1/workbooks?select=file_name,status`, { headers: H });
  log(`3_READ_BACK status=${r.status}`, await r.text());

  // 4. Insert migrated entity rows
  r = await fetch(`${B}/rest/v1/entity_rows`, {
    method: "POST", headers: H,
    body: JSON.stringify([
      { user_id: uid, entity: "invoices", data: { invoice: "INV-001", amount: 12500.5, status: "paid" } },
      { user_id: uid, entity: "invoices", data: { invoice: "INV-002", amount: 8300, status: "unpaid" } },
    ]),
  });
  log(`4_INSERT_ROWS status=${r.status}`, (await r.text()).slice(0, 80));

  // 5. Read rows
  r = await fetch(`${B}/rest/v1/entity_rows?select=data->>invoice,data->>amount,data->>status`, { headers: H });
  log(`5_READ_ROWS status=${r.status}`, await r.text());

  // 6. RLS check: anonymous request must see nothing
  r = await fetch(`${B}/rest/v1/workbooks?select=id`, { headers: { apikey: K } });
  const anon = await r.text();
  log(`6_RLS_ANON status=${r.status} body=${anon} => ${anon === "[]" ? "PASS (RLS blocks anonymous)" : "FAIL"}`);

  // 7. Subscriptions table reachable
  r = await fetch(`${B}/rest/v1/subscriptions?select=id`, { headers: H });
  log(`7_SUBSCRIPTIONS_TABLE status=${r.status}`, await r.text());

  // 8. Cleanup test data
  await fetch(`${B}/rest/v1/entity_rows?entity=eq.invoices`, { method: "DELETE", headers: H });
  await fetch(`${B}/rest/v1/workbooks?file_name=eq.e2e-sample.xlsx`, { method: "DELETE", headers: H });
  log("8_CLEANUP done (workbook + rows removed, test user kept)");

  await flush();
})().catch(async (e) => { log("E2E_FAIL", e.message); await flush(); process.exit(1); });

async function flush() {
  const fs = await import("node:fs");
  fs.writeFileSync("e2e-result.txt", out.join("\n"));
}
