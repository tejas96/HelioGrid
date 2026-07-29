import { z } from 'zod';

/** Shared conventions every feature contract builds on. */

export const uuidSchema = z.string().uuid();

/** E.164 — the only phone shape stored or transported (forward-compat register: auth/tenancy). */
export const phoneE164Schema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'must be E.164, e.g. +919876543210');

/**
 * Money travels as a decimal STRING with exactly two fraction digits (numeric(14,2) INR
 * in the DB) — never a float. Rendering uses formatInr() (Indian grouping) exclusively.
 */
export const inrAmountSchema = z
  .string()
  .regex(/^-?\d{1,12}\.\d{2}$/, 'INR amount as decimal string with 2 fraction digits');

/** Percentages: numeric(5,2) as string, 0.00–100.00. */
export const percentSchema = z
  .string()
  .regex(/^\d{1,3}\.\d{2}$/)
  .refine((v) => Number(v) <= 100, 'percent ≤ 100.00');

/** Provenance tier — product law: every user-visible number carries one. */
export const provenanceTierSchema = z.enum(['measured', 'derived', 'estimated', 'assumed']);
export type ProvenanceTier = z.infer<typeof provenanceTierSchema>;

/** Per-USER UI language (D25). The agent language set is broader and lives with the agent contract. */
export const uiLanguageSchema = z.enum(['en', 'hi', 'mr']);
export type UiLanguage = z.infer<typeof uiLanguageSchema>;

/** Per-USER measurement units preference. */
export const unitsPrefSchema = z.enum(['m', 'ft']);
export type UnitsPref = z.infer<typeof unitsPrefSchema>;

/** The six preset roles (D27/D28) — OR across held roles, widest visibility wins. */
export const rolePresetSchema = z.enum([
  'owner',
  'manager',
  'sales_rep',
  'surveyor',
  'designer',
  'engineer',
]);
export type RolePreset = z.infer<typeof rolePresetSchema>;

/**
 * The customer-journey pipeline status shared by leads, proposals and projects, and by
 * every surface that renders one (StatusChip on both platforms, list filters, reports).
 * Lives here — not in a UI package — because Law 4 makes this the only definition; the
 * owning module's migration adds the matching pgEnum from THIS list.
 */
export const workflowStatusSchema = z.enum([
  'lead',
  'survey-scheduled',
  'design-in-progress',
  'approved',
  'installing',
  'commissioned',
  'on-hold',
]);
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;

/**
 * Pagination convention: cursor-based, tenant-scoped, stable order.
 * `cursor` is an opaque server-issued token; `limit` defaults to 25, max 100.
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    /** Absent when there is no further page. */
    nextCursor: z.string().optional(),
  });
}

/**
 * Tenancy convention: tenant_id NEVER travels in request bodies or params — it comes from
 * the verified JWT claim on the request context (guard → repository filter → RLS backstop).
 * Contracts therefore never declare a tenantId input field on tenant-scoped routes.
 */
export const tenantClaimSchema = z.object({
  tenantId: uuidSchema,
  userId: uuidSchema,
  roles: z.array(rolePresetSchema).min(1),
});
export type TenantClaim = z.infer<typeof tenantClaimSchema>;

/**
 * What the session guard puts on the request. Lives here — not in the api — because it is
 * the shape every controller signature depends on, and the guard that produces it now sits
 * in `common/` while the module that resolves it sits in `modules/auth/`; a single owner
 * keeps those two from drifting. `tenantId` is null until onboarding/accept-invite completes.
 */
export const sessionClaimsSchema = z.object({
  userId: z.string(),
  phoneE164: z.string(),
  tenantId: z.string().nullable(),
  roles: z.array(rolePresetSchema),
});
export type SessionClaims = z.infer<typeof sessionClaimsSchema>;
