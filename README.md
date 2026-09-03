# SheetNative — AI Business Operating System

Upload an Excel workbook. AI understands formulas, relationships, workflows, permissions and business
logic — then generates a full application stack: **PostgreSQL database, APIs, dashboards, web + mobile +
desktop apps, automations, and AI employees.**

Not an Excel converter. An operating system for businesses that still think in spreadsheets.

## What's implemented here

| Capability | Status |
| --- | --- |
| AI Workbook Interpreter (XLSX/XLS/CSV parsing, formula intelligence, entity + FK detection, risk scan, scores) | Working (`lib/interpreter/`) |
| AI Database Generator (normalized PostgreSQL schema + `CREATE TABLE` SQL per entity) | Working |
| One-click migration of sheet data into a live PostgreSQL (Supabase) database | Working |
| Generated Apps runtime (per-entity table / kanban / chart views, search, CRUD) | Working (`app/app/apps/[id]`) |
| AI Chat — natural-language Q&A over your migrated data (totals, top-N, low stock, unpaid filters) | Working (`lib/nlq.ts`) |
| Natural-language Automation Builder ("when inventory falls below 20, notify purchasing by email") | Working (`lib/automation.ts`) |
| Approvals, AI Employees, Marketplace, Billing, Platform Admin | Working UI backed by Supabase |
| Auth (Google + email) | Verdent-managed Supabase Auth (`@verdent/auth-js`) |
| Multi-platform (Expo mobile, Tauri desktop) | Scaffolds in `apps/` |
| Self-hosted DB model | Prisma schema in `packages/db` |

## Architecture

```
Next.js 15 (React 19, TypeScript, Tailwind v4, glassmorphism design system)
├── app/                    # Landing, workspace, API routes
├── lib/interpreter/        # AI Workbook Interpreter engine
├── lib/nlq.ts              # Business Q&A engine
├── lib/automation.ts       # NL automation parser
├── lib/store.ts            # Supabase data layer (RLS-enforced)
├── components/             # Shell, design-system primitives
├── packages/db             # Prisma schema (self-hosted PostgreSQL)
├── apps/mobile             # React Native / Expo companion (camera, GPS, NFC, offline sync)
└── apps/desktop            # Tauri shell (native files, drag-drop ingest, multi-window)
```

Data: every table is user-scoped with **row-level security** (`auth.uid() = user_id`).
The workbook analysis itself is stored as a JSON document, so generated apps render
directly from the AI's interpretation of your business.

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (standalone output)
```

Self-hosted stack (app + Postgres + Redis):

```bash
docker compose up --build
```

Desktop (Windows/macOS/Linux): `cd apps/desktop && npm install && npm run tauri dev`
Mobile (Android/iOS): `cd apps/mobile && npm install && npx expo start`

## The 60-second demo

1. Open the workspace → **Workbooks**
2. Drop any `.xlsx` (multi-sheet, with formulas — the messier the better)
3. Watch the interpreter: entities, formula→business-language explanations, risk report, generated SQL
4. **Approve & migrate** — rows land in PostgreSQL
5. **Generated Apps** — table/kanban/chart views over your real data
6. Hit **Ask AI** — "total revenue?", "show low stock", "top customers"
7. **Automations** — type a sentence, AI builds the workflow

## Security

Row-level security on all tables · AES-256 at rest (managed Postgres) · TLS in transit ·
no service-role keys in the browser · secrets only via environment injection.
