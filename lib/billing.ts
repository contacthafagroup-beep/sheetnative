import "server-only";

export interface PlanDef {
  id: string;
  name: string;
  monthly: number;
  aiCredits: string;
  seats: string;
}

export const PLANS: PlanDef[] = [
  { id: "starter", name: "Starter", monthly: 99, aiCredits: "5k", seats: "3 seats" },
  { id: "growth", name: "Growth", monthly: 299, aiCredits: "25k", seats: "10 seats" },
  { id: "business", name: "Business", monthly: 799, aiCredits: "100k", seats: "30 seats" },
  { id: "pro", name: "Pro", monthly: 1499, aiCredits: "400k", seats: "Unlimited seats" },
];

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

export function annualMonthly(monthly: number): number {
  // ~17% off: 10 months for 12
  return Math.round((monthly * 10) / 12);
}
