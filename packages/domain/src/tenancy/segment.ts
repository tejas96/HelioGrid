/**
 * What an EPC sells. A readonly tuple rather than a Zod enum because domain carries no
 * dependencies — the rebuilt contract will declare `z.enum(TENANT_SEGMENTS)` from this
 * exact list, so the two can never disagree.
 */
export const TENANT_SEGMENTS = ['residential', 'ci', 'both'] as const;
export type TenantSegment = (typeof TENANT_SEGMENTS)[number];
