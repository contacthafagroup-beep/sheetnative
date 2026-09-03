// Formula Intelligence — translates Excel formulas into business language.

export interface FormulaExplanation {
  explanation: string;
  category: string;
}

const cat = {
  aggregate: "Aggregation",
  conditional: "Conditional logic",
  lookup: "Relationship / lookup",
  financial: "Financial",
  datetime: "Date & time",
  text: "Text",
  other: "Calculation",
};

function rangeToWords(range: string): string {
  const m = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!m) return range;
  return `rows ${m[2]}–${m[4]}`;
}

function colName(range: string, headers: string[]): string {
  const m = range.match(/^([A-Z]+)\d+/i);
  if (!m || headers.length === 0) return range;
  let idx = 0;
  const letters = m[1].toUpperCase();
  for (let i = 0; i < letters.length; i++)
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  return headers[idx - 1] ?? range;
}

export function explainFormula(
  formula: string,
  headers: string[] = []
): FormulaExplanation {
  const f = formula.replace(/^=/, "").trim();
  const upper = f.toUpperCase();

  // SUM with criteria: SUMIF(S)
  let m = upper.match(/^(SUMIFS?|COUNTIFS?|AVERAGEIFS?)\((.+)\)$/);
  if (m) {
    const fn = m[1].replace("S", "");
    const verb =
      fn === "SUM" ? "Total" : fn === "COUNT" ? "Count of" : "Average of";
    const args = m[2].split(/,(?![^(]*\))/);
    const target = colName(args[0]?.trim() ?? "", headers);
    const criteriaCol = colName(args[1]?.trim() ?? "", headers);
    const criteria = args[2]?.trim().replace(/"/g, "") ?? "";
    return {
      explanation: `${verb} ${target} where ${criteriaCol} matches ${criteria}`,
      category: cat.conditional,
    };
  }

  // Simple aggregates
  m = upper.match(/^(SUM|AVERAGE|MAX|MIN|COUNT)\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
  if (m) {
    const verb = { SUM: "Total", AVERAGE: "Average", MAX: "Highest", MIN: "Lowest", COUNT: "Count of" }[m[1]]!;
    return {
      explanation: `${verb} of ${rangeToWords(m[2])}`,
      category: cat.aggregate,
    };
  }

  // Lookups
  m = upper.match(/^(VLOOKUP|XLOOKUP|HLOOKUP)\((.+)$/);
  if (m) {
    return {
      explanation: `Looks up a value from another table and pulls the matching record into this cell`,
      category: cat.lookup,
    };
  }
  if (upper.startsWith("INDEX(") || upper.startsWith("MATCH("))
    return {
      explanation: "Positional lookup — finds and retrieves a value by its position in a table",
      category: cat.lookup,
    };

  // Conditional
  if (upper.startsWith("IF("))
    return {
      explanation: "Decision rule — returns one value when a condition is met, another when it is not",
      category: cat.conditional,
    };
  if (upper.startsWith("IFERROR("))
    return {
      explanation: "Fallback value shown when the calculation fails",
      category: cat.conditional,
    };

  // Financial
  for (const [fn, desc] of [
    ["PMT", "Loan payment amount for a given rate, term and principal"],
    ["NPV", "Net present value of future cash flows"],
    ["IRR", "Internal rate of return of the cash-flow series"],
    ["FV", "Future value of an investment"],
    ["PV", "Present value of an investment"],
    ["RATE", "Interest rate per period"],
    ["NPER", "Number of payment periods"],
  ] as const) {
    if (upper.startsWith(fn + "("))
      return { explanation: desc, category: cat.financial };
  }

  // Date & time
  for (const [fn, desc] of [
    ["TODAY", "Current date"],
    ["NOW", "Current timestamp"],
    ["DATEDIF", "Difference between two dates"],
    ["EDATE", "Date shifted by a number of months"],
    ["EOMONTH", "Last day of the month"],
    ["NETWORKDAYS", "Working days between two dates"],
    ["YEARFRAC", "Fraction of a year between two dates"],
  ] as const) {
    if (upper.startsWith(fn + "("))
      return { explanation: desc, category: cat.datetime };
  }

  // Text
  if (/^(CONCAT|CONCATENATE|TEXTJOIN|LEFT|RIGHT|MID|TRIM|PROPER|UPPER|LOWER)\(/.test(upper))
    return { explanation: "Text shaping — combines or reformats text values", category: cat.text };

  // Arithmetic
  if (/[+\-*/^]/.test(f) && /\d|[A-Z]\d/i.test(f))
    return {
      explanation: `Arithmetic calculation across referenced cells`,
      category: cat.other,
    };

  return { explanation: "Custom calculation", category: cat.other };
}
