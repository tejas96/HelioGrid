import { TENANT_READABLE_KEYS, type TenantReadableKey } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { errorEnvelope } from './error';

const c = initContract();

/**
 * ISO 3166-1 alpha-2, the segment a tenant reads its market's pack under. Never tenant
 * identity: a tenant learns its own market from `GET /tenants/me` (`T-M01-025`) and may read any
 * published pack, because a pack is platform reference data with no tenant fact in it (`F1-12`).
 */
export const marketCodeSchema = z.string().regex(/^[A-Z]{2}$/, 'two upper-case letters');

/**
 * One tenant-readable key as the wire carries it: an OPAQUE value. The interiors are validated
 * in `packages/domain`, never here (`T-FCORE-017`); the contract fixes only WHICH keys travel.
 * Optional, because an unauthored key is absent rather than null (`F1-05`).
 */
const opaqueKey = () => z.unknown().optional();

const tenantReadableShape = Object.fromEntries(
  TENANT_READABLE_KEYS.map((key) => [key, opaqueKey()]),
) as Record<TenantReadableKey, ReturnType<typeof opaqueKey>>;

/**
 * The current version of one market's pack, for tenant use: the envelope and the
 * tenant-readable keys. `priceBook` is not a property here and can never become one by
 * accident — the shape is built from `TENANT_READABLE_KEYS`, and `.strict()` turns a leaked
 * key into a response-validation failure rather than a silently stripped field (`F1-25`,
 * `BM-17`).
 */
export const marketPackReadSchema = z
  .object({
    market: marketCodeSchema,
    /** The published ordinal, 1 first (`F1-11`). */
    revision: z.number().int().min(1),
    publishedAt: z.string().datetime(),
    /** What an output pins: the market code and the revision as one identifier (`F8-14`). */
    version: z.string(),
    ...tenantReadableShape,
  })
  .strict();
export type MarketPackRead = z.infer<typeof marketPackReadSchema>;

export const marketPackContract = c.router({
  current: {
    method: 'GET',
    path: '/market-packs/:marketCode',
    pathParams: z.object({ marketCode: marketCodeSchema }),
    summary: 'The current published version of one market pack, without the price book',
    responses: {
      200: marketPackReadSchema,
      404: errorEnvelope(z.literal('NOT_FOUND')),
    },
  },
});
