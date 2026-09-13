import type { PlatformActivities } from './platform.activities.types';

/**
 * How many recent keys ONE process remembers. A worker runs for weeks between deploys, so a
 * store that only ever grows ends as an OOM kill mid-activity — the one place a side effect is
 * half-applied, and the exact failure the retry model exists to prevent.
 *
 * The bound must exceed the keys alive across the longest window a retry can span: this
 * workflow holds two keys for up to its five-minute wait, and an activity retries within three
 * attempts of a ten-second timeout. 1024 is 512 concurrent runs of a healthcheck that never
 * runs more than a handful.
 *
 * NOT exported. Nothing outside this file may hold this number, and the store it bounds is
 * replaced by a table when the first product activity lands.
 */
const REMEMBERED_KEYS = 1024;

/**
 * Activities hold every side effect. Temporal RETRIES them, so each one must be idempotent:
 * a retry that double-applies is the defect the whole retry model rests on not having.
 *
 * `recordHeartbeat` is keyed by (eventId, beat) — the same key a real implementation would
 * use in `INSERT … ON CONFLICT DO NOTHING`, so the shape of the guarantee is the shape the
 * first product activity will implement.
 *
 * **The store is in memory, and that is a stated limit, not an oversight.** Product database
 * work is out of scope by owner ruling, so this proves the retry/idempotency
 * SHAPE and not durable idempotency across a process restart. The first product activity
 * replaces the map with its table.
 *
 * The bound is a PARAMETER so the eviction edge can be proven at a store of two rather than by
 * writing a thousand keys, and so no two cases share one process-wide map.
 */
export function createPlatformActivities(remembered: number): PlatformActivities {
  const applied = new Map<string, { key: string; at: string }>();

  return {
    async recordHeartbeat(eventId, beat) {
      const key = `${eventId}#${beat}`;
      const existing = applied.get(key);
      if (existing) return existing;

      // Drop the oldest keys until there is room for this one. A Map yields keys in INSERTION
      // order, so the first it offers is the oldest — and the oldest is the key a retry is
      // least likely to ask for. Deleting a key the iterator has already handed over is safe.
      for (const oldest of applied.keys()) {
        if (applied.size < remembered) break;
        applied.delete(oldest);
      }

      // `new Date()` is legal HERE and illegal in the workflow: an activity runs once per
      // attempt and its result is recorded in history, so the value is fixed on replay.
      const value = { key, at: new Date().toISOString() };
      applied.set(key, value);
      return value;
    },
  };
}

export const platformActivities = createPlatformActivities(REMEMBERED_KEYS);
