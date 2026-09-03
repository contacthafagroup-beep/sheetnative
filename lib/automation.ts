// Natural-language automation builder — parses sentences like:
// "When inventory falls below 20, notify purchasing by email"

export interface AutomationRule {
  trigger: {
    entity: string;
    metric: string;
    operator: "<" | ">" | "<=" | ">=" | "==" | "event";
    value: number | null;
    raw: string;
  };
  actions: { type: string; target: string; label: string }[];
  description: string;
}

const CHANNELS: { match: RegExp; type: string }[] = [
  { match: /\bemail\b|\be-?mail\b/i, type: "email" },
  { match: /\bsms\b|\btext\b|\btext message\b/i, type: "sms" },
  { match: /\bwhatsapp\b/i, type: "whatsapp" },
  { match: /\bslack\b/i, type: "slack" },
  { match: /\bteams\b/i, type: "teams" },
  { match: /\bpush\b|\bnotification\b|\bnotify\b/i, type: "push" },
  { match: /\bwebhook\b/i, type: "webhook" },
  { match: /\bpdf\b|\breport\b/i, type: "pdf" },
  { match: /\bcreate\b|\bgenerate\b/i, type: "action" },
];

export function parseAutomation(input: string): AutomationRule | null {
  const text = input.trim();
  if (text.length < 10) return null;

  const [triggerPart, ...actionParts] = text.split(/\b(?:then|,)\b/i);

  // Metric + threshold
  const cmp = text.match(
    /([\w ]+?)\s+(?:falls?|drops?|goes|is|are|exceeds?|reaches?|hits?|equals?|below|under|above|over)\s*(?:less than|more than|greater than)?\s*\$?([\d,]+(?:\.\d+)?)/i
  );
  let operator: AutomationRule["trigger"]["operator"] = "event";
  let value: number | null = null;
  let metric = "record";

  if (cmp) {
    metric = cmp[1]
      .trim()
      .replace(/^when\s+/i, "")
      .replace(/\s+(falls?|drops?|goes|is|are|exceeds?|reaches?|hits?|equals?)$/i, "")
      .trim();
    value = Number(cmp[2].replace(/[$,]/g, ""));
    const head = cmp[0].toLowerCase();
    if (/falls?|drops?|below|under|less than/.test(head)) operator = "<";
    else if (/above|over|more than|greater than|exceeds?/.test(head)) operator = ">";
    else operator = "==";
  }

  // Entity guess: first noun-ish word of the metric phrase
  const entity =
    metric.split(/\s+/).filter((w) => !/^(the|a|an|my|our|any|total|current|new)$/i.test(w))[0] ?? "record";

  const actions: AutomationRule["actions"] = [];
  const source = actionParts.join(" then ") || text;
  if (CHANNELS.some((c) => c.type === "action") && /\b(create|generate|make)\b/i.test(source)) {
    const what = source.match(/\b(create|generate|make)\s+(an?\s+)?([\w ]+?)(?:\s+for|\s+and|\s+then|$)/i);
    if (what)
      actions.push({
        type: "action",
        target: "system",
        label: `Create ${what[3].trim()}`,
      });
  }
  for (const ch of CHANNELS) {
    if (ch.type === "action") continue;
    if (ch.match.test(source)) {
      const to = source.match(/\b(?:notify|alert|message|send to|tell)\s+(?:the\s+)?([\w ]{2,24}?)(?:\s+by|\s+via|\s+on|\s+and|,|$)/i);
      actions.push({
        type: ch.type,
        target: to?.[1]?.trim() ?? "owner",
        label: `Notify ${to?.[1]?.trim() ?? "owner"} via ${ch.type}`,
      });
      break;
    }
  }
  if (actions.length === 0)
    actions.push({ type: "push", target: "owner", label: "Notify owner via push" });

  const symbols: Record<string, string> = { "<": "<", ">": ">", "==": "=" };
  const description = `When ${metric} ${symbols[operator] ?? "changes"} ${value ?? ""} → ${actions
    .map((a) => a.label)
    .join(", ")}`;

  return {
    trigger: { entity: entity.toLowerCase(), metric: metric.toLowerCase(), operator, value, raw: text },
    actions,
    description: description.replace(/\s+/g, " ").replace("→ =", "changes →"),
  };
}
