/** Free-tier monthly document allowance. Each selected person = one document. */
export const FREE_MONTHLY_LIMIT = 3;

/** Flip to true once monthly usage tracking exists on the server. */
export const QUOTA_ENFORCED = false;

export type Tier = "free" | "pro" | string;

export interface Allowance {
  allowed: boolean;
  remaining: number;
}

/** Decide whether a user may issue `requested` documents this month. Paid tiers are unlimited. */
export function checkIssueAllowance(tier: Tier, usedThisMonth: number, requested: number): Allowance {
  if (tier !== "free") return { allowed: true, remaining: Infinity };
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - Math.max(0, usedThisMonth));
  return { allowed: requested >= 1 && requested <= remaining, remaining };
}
