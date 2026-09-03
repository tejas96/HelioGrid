import { ROLE_PRESETS } from '@heliogrid/domain';
import { z } from 'zod';

/** Shared conventions every feature contract builds on. */

export const uuidSchema = z.string().uuid();

/** E.164 — the only phone shape stored or transported (forward-compat register: auth/tenancy). */
export const phoneE164Schema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'must be E.164, e.g. +919876543210');

/**
 * Money travels as a decimal STRING scaled to the currency's minor unit (INR: exactly 2
 * fraction digits; numeric(14,3) in the DB) — never a float. A money-bearing payload
 * carries ONE document-level currency_code; the route's object schema refines the scale
 * against it. Rendering uses formatMoney(amount, currency, locale) exclusively — market
 * grouping per currency (lakh/crore for INR).
 */
export const amountSchema = z
  .string()
  .regex(/^-?\d{1,12}(\.\d{1,3})?$/, 'amount as decimal string scaled to the currency minor unit');

/** Percentages: numeric(5,2) as string, 0.00–100.00. */
export const percentSchema = z
  .string()
  .regex(/^\d{1,3}\.\d{2}$/)
  .refine((v) => Number(v) <= 100, 'percent ≤ 100.00');

/** Provenance tier — product law: every user-visible number carries one. */
export const provenanceTierSchema = z.enum(['measured', 'derived', 'estimated', 'assumed']);
export type ProvenanceTier = z.infer<typeof provenanceTierSchema>;

/** Per-USER measurement units preference. */
export const unitsPrefSchema = z.enum(['m', 'ft']);
export type UnitsPref = z.infer<typeof unitsPrefSchema>;

/**
 * The TWELVE preset roles — F2-01, owner ruling `Q69` (2026-08-25), which supersedes the
 * retired six-value set and says it "must not be restored".
 *
 * Built from `ROLE_PRESETS` in `@heliogrid/domain`, never restated: domain is the bottom
 * layer, so the list is written once and this enum is derived. `z.enum` needs a non-empty
 * literal tuple, which the `as const` tuple already is.
 *
 * OR across held roles (F2-11); widest visibility wins, per domain (F2-13/F2-14). Both live
 * in `@heliogrid/domain/authz` — they are policy, not wire shape.
 */
export const rolePresetSchema = z.enum(ROLE_PRESETS);
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
 * Our request-correlation header. The API assigns one per request before CORS and body
 * parsing (so even a parser 413 carries it) and echoes it on the response; a server render
 * forwards it so one user action has ONE id end to end.
 *
 * Here, not in an app: it was written in `apps/api` AND `packages/data` until 2026-09-03, and
 * a header the two sides spell differently correlates nothing. Owner ruling 2026-09-03 —
 * contracts is the wire truth, and this is wire, not business truth. It is not in the OpenAPI
 * document: the transport sets it, no route declares it.
 */
export const REQUEST_ID_HEADER = 'x-request-id';

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
 * solely for the session guard, which was deleted with auth. The rebuild
 * re-authors them alongside the guard that consumes them.
 */
