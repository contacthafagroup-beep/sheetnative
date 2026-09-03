import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const envOr = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

interface EntitySummary {
  name: string;
  sheet: string;
  rowCount: number;
  columns: { name: string; type: string }[];
  totals: Record<string, number>;
  sample: Record<string, unknown>[];
}

function buildContext(entities: EntitySummary[]): string {
  return entities
    .map((e) => {
      const cols = e.columns.map((c) => `${c.name}(${c.type})`).join(", ");
      const totals = Object.entries(e.totals)
        .map(([k, v]) => `${k}=${v.toLocaleString()}`)
        .join(", ");
      const rows = e.sample
        .map((r) => JSON.stringify(Object.fromEntries(Object.entries(r).slice(0, 8))))
        .join("\n");
      return (
        `TABLE ${e.name} (sheet: "${e.sheet}", ${e.rowCount} rows)\n` +
        `Columns: ${cols}\n` +
        (totals ? `Totals: ${totals}\n` : "") +
        `Sample rows:\n${rows}`
      );
    })
    .join("\n\n");
}

const SYSTEM_PROMPT = `You are SheetNative Business AI, an analyst embedded in a business app generated from a user's Excel workbook.
Answer the user's question using ONLY the data provided below. Be concise (max ~120 words), concrete, and cite actual numbers.
Use markdown bold for key figures and bullet lists for enumerations. If the data provided is insufficient to answer precisely,
say so honestly and suggest what data would be needed. Never invent records.`;

async function askOpenAI(key: string, question: string, context: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `DATA:\n${context}\n\nQUESTION: ${question}` },
      ],
      max_tokens: 400,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

async function askGemini(key: string, question: string, context: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: `DATA:\n${context}\n\nQUESTION: ${question}` }] }],
        generationConfig: { maxOutputTokens: 1200, temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json();
  return (
    json.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

export async function POST(req: Request) {
  let body: { question?: string; entities?: EntitySummary[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  const entities = Array.isArray(body.entities) ? body.entities.slice(0, 20) : [];
  if (!question)
    return NextResponse.json({ error: "Question required." }, { status: 400 });

  const context = buildContext(entities);

  const openai = envOr(process.env.OPENAI_API_KEY);
  const gemini = envOr(process.env.GEMINI_API_KEY);

  if (openai) {
    try {
      const answer = await askOpenAI(openai, question, context);
      if (answer.trim())
        return NextResponse.json({ answer: answer.trim(), source: "llm" });
    } catch {
      // try Gemini below
    }
  }
  if (gemini) {
    try {
      const answer = await askGemini(gemini, question, context);
      if (answer.trim())
        return NextResponse.json({ answer: answer.trim(), source: "llm" });
    } catch {
      // fall through to local engine
    }
  }

  return NextResponse.json({ answer: null, source: "none" });
}
