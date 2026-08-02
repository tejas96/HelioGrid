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
 * Lives here — not in a UI package — because this is the only definition — one definition per fact; the
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
 * Pagination convention: offset-based, tenant-scoped, STABLE order (indexed sort key +
 * id tiebreaker — repository recipe in apps/api/CLAUDE.md). Offset over cursor is a
 * 2026-08-02 owner decision (specs/2026-08-02-foundation-dx-design.md §4): per-tenant CRM
 * volumes never hit offset's deep-page cost, and counts / jump-to-page / column sorting
 * are product needs. A hot endpoint may go cursor-based per-route ONLY with an owner ruling.
 */
export const DEFAULT_PAGE_LIMIT = 25;
export const MAX_PAGE_LIMIT = 100;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  page: z.coerce.number().int().min(1).default(1),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    /** Rows matching the SAME filters — `page × limit < totalCount` derives hasNextPage. */
    totalCount: z.number().int().nonnegative(),
  });
}

/** Wire shape of `paginated()` — keep the two in step (one fact, two artefacts). */
export type Paginated<T> = { items: T[]; totalCount: number };

/**
 * Tenancy convention: tenant_id NEVER travels in request bodies or params — it comes from
 * the verified session claim on the request context (guard → repository filter → RLS
 * backstop). Contracts therefore never declare a tenantId input field on tenant-scoped
 * routes. The rule outlives the auth teardown; it constrains every module still to come.
 *
 * `tenantClaimSchema` and `sessionClaimsSchema` lived here until 2026-08-01 and existed
 * solely for the session guard, which was deleted with auth (ADR-0024). The rebuild
 * re-authors them alongside the guard that consumes them.
 */
