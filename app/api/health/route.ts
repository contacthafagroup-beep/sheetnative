import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    service: "sheetnative",
    status: "ok",
    version: "1.0.0",
    time: new Date().toISOString(),
    capabilities: [
      "ai-workbook-interpreter",
      "ai-database-generator",
      "app-generator",
      "ai-chat",
      "automations",
      "approvals",
      "ai-employees",
    ],
  });
}
