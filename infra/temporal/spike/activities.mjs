/**
 * Activities are where the side effects live, and every one must be IDEMPOTENT: Temporal
 * retries them, and a retry that double-applies is the defect the whole retry model rests on
 * not having.
 *
 * `applied` stands in for the product table this effect would write. It is keyed by
 * (eventId, beat) — the same key the caller would use in a real `INSERT … ON CONFLICT DO
 * NOTHING`, so the shape of the guarantee is the shape Track 7 implements.
 */
const applied = new Map();

export function appliedEffects() {
  return [...applied.keys()].sort();
}

export async function recordHeartbeat(eventId, beat) {
  const key = `${eventId}#${beat}`;
  if (applied.has(key)) return applied.get(key);
  const value = { key, at: new Date().toISOString() };
  applied.set(key, value);
  return value;
}
