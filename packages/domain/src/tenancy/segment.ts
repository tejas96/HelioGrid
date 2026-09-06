/**
 * What an EPC sells. A readonly tuple rather than a Zod enum because domain carries no
 * dependencies — the rebuilt contract will declare `z.enum(TENANT_SEGMENTS)` from this
 * exact list, so the two can never disagree.
 */
export const TENANT_SEGMENTS = ['residential', 'ci', 'both'] as const;
export type TenantSegment = (typeof TENANT_SEGMENTS)[number];

/**
 * What ONE deal is. Kept beside `TENANT_SEGMENTS` because the two are one word apart and one
 * substitution wrong: an EPC sells to `both`, and no single deal ever does. Market rules that
 * turn on the customer — a subsidy's eligible segments (`F1-14`), the skippable incentive stage
 * and the omitted checklist row (`F1-35`, `F1-52`) — read THIS list.
 */
export const DEAL_SEGMENTS = ['residential', 'commercial'] as const;
export type DealSegment = (typeof DEAL_SEGMENTS)[number];
