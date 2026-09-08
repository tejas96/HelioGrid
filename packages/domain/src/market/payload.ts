import { PACK_KEYS, type PackKey, TENANT_READABLE_KEYS, type TenantReadableKey } from './keys';
import type { MarketPack } from './pack';

/**
 * The ONE stored column of a pack version (`F1-01`): every property a `PACK_KEYS` name, an
 * unauthored key absent rather than null (`F1-05`). The interiors are opaque here — typed code
 * is the only writer until `T-FCORE-017`, so a read doubts the envelope and not the values.
 */
export type PackPayload = Partial<Record<PackKey, unknown>>;

/** A pack's authored keys, in PRD order, as the payload the store keeps. */
export function payloadOf(pack: MarketPack): PackPayload {
  const authored = new Map<string, unknown>(Object.entries(pack));
  const payload: PackPayload = {};
  for (const key of PACK_KEYS) {
    if (authored.has(key)) payload[key] = authored.get(key);
  }
  return payload;
}

/** The part of a payload a tenant-facing read may serve (`F1-25`): never the book. */
export function tenantReadablePayload(
  payload: PackPayload,
): Partial<Record<TenantReadableKey, unknown>> {
  const served: Partial<Record<TenantReadableKey, unknown>> = {};
  for (const key of TENANT_READABLE_KEYS) {
    if (Object.hasOwn(payload, key)) served[key] = payload[key];
  }
  return served;
}

function byKey([a]: [string, unknown], [b]: [string, unknown]): number {
  return a < b ? -1 : 1;
}

function sortedKeys(_key: string, held: unknown): unknown {
  return held !== null && typeof held === 'object' && !Array.isArray(held)
    ? Object.fromEntries(Object.entries(held).sort(byKey))
    : held;
}

/**
 * JSON with every object's keys sorted. `jsonb` stores a payload in its own key order, so the
 * literal that was written and the row that comes back compare equal only this way; a plain
 * `JSON.stringify` would call every unchanged pack a new revision.
 */
export function canonicalJson(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value, sortedKeys);
}
