import type { PlatformActivities } from './platform.activities.types';

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
 */
const applied = new Map<string, { key: string; at: string }>();

export const platformActivities: PlatformActivities = {
  async recordHeartbeat(eventId, beat) {
    const key = `${eventId}#${beat}`;
    const existing = applied.get(key);
    if (existing) return existing;
    // `new Date()` is legal HERE and illegal in the workflow: an activity runs once per
    // attempt and its result is recorded in history, so the value is fixed on replay.
    const value = { key, at: new Date().toISOString() };
    applied.set(key, value);
    return value;
  },
};
