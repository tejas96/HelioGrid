import { randomBytes } from 'node:crypto';

/** The 12 bits after the version nibble count ids made in one millisecond (RFC 9562 §6.2, method 1). */
const COUNTER_MAX = 0xfff;
/** A new millisecond seeds the counter below half, so a burst after it still has room to count. */
const COUNTER_SEED_MASK = 0x7ff;

let lastMs = 0;
let counter = 0;

/**
 * The millisecond and counter of the next id: ids this process makes one after another always sort
 * in the order they were made, which "newest first" lists read by `desc(id)` depend on. A clock that
 * steps back keeps the last millisecond; a counter that runs out borrows the next one.
 */
function nextStamp(seed: number): { ms: number; counter: number } {
  const now = Date.now();
  if (now > lastMs) {
    lastMs = now;
    counter = seed & COUNTER_SEED_MASK;
  } else if (counter < COUNTER_MAX) {
    counter += 1;
  } else {
    lastMs += 1;
    counter = 0;
  }
  return { ms: lastMs, counter };
}

/**
 * UUIDv7 — time-ordered, generated APP-SIDE: no Postgres extension
 * dependency on postgres-flex. Layout per RFC 9562: 48-bit unix-ms timestamp, ver 7 with a 12-bit
 * counter, variant 10, 62 bits randomness.
 */
export function uuidv7(): string {
  const bytes = randomBytes(16);
  const stamp = nextStamp(((bytes[6] as number) << 8) | (bytes[7] as number));
  const ts = BigInt(stamp.ms);
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);
  bytes[6] = 0x70 | (stamp.counter >> 8);
  bytes[7] = stamp.counter & 0xff;
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
