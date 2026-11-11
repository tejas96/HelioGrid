/**
 * The series a company numbers its records by (`M08-03`): every business identifier is assigned by
 * the server from the company's own counter, never by a device, so two people winning deals at
 * the same moment can never collide. A readonly tuple, mirrored as a pgEnum; a series is added by
 * the slice whose record it numbers (Law 9) — proposals join it with `M06-44`.
 */
export const TENANT_COUNTER_KINDS = ['project'] as const;
export type TenantCounterKind = (typeof TENANT_COUNTER_KINDS)[number];
