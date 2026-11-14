import { LINK_CEILINGS } from '@heliogrid/domain';

const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1_000;
/**
 * The most addresses held at once. Past it a new address is counted by the backstop alone, so a
 * flood from ever-new addresses cannot grow this process's memory without end.
 */
const ADDRESSES_HELD = 100_000;

interface AddressCount {
  startedAt: number;
  asked: number;
  closedUntil: number;
}

/**
 * The ceilings over every public link route (`F5-78`, `T-F5-004`), counted in this process's memory
 * for the running minute and nothing else — never stored, never logged, so a restart forgets them
 * and no address outlives its minute (`F5-29`). Each network address gets its own share, so one
 * caller meets a 429 with the wait while every other customer still reads; the count over all
 * addresses together is only a backstop, far above one address's share. The per-link ceilings,
 * which a family reading across an evening never meets, are counted over the link's own rows.
 */
export class PublicCeiling {
  private readonly addresses = new Map<string, AddressCount>();
  private sweptAt = 0;
  private minuteStartedAt = 0;
  private asked = 0;

  /** Whether one more public request from `address` is served at `now`; a refused one is not counted. */
  admits(address: string, now: number): boolean {
    this.sweep(now);
    const own = this.countOf(address, now);
    if (own !== null && now < own.closedUntil) return false;
    if (!this.backstopAdmits(now)) return false;
    if (own === null) return true;
    own.asked += 1;
    if (own.asked <= LINK_CEILINGS.publicRequestsPerAddressPerMinute) return true;
    own.closedUntil = now + LINK_CEILINGS.publicBackoffSeconds * MS_PER_SECOND;
    return false;
  }

  /** How long a refused caller is told to wait, seconds. */
  get backoffSeconds(): number {
    return LINK_CEILINGS.publicBackoffSeconds;
  }

  /** How many addresses this process holds a count for — what bounds its memory. */
  get addressesHeld(): number {
    return this.addresses.size;
  }

  /** The most addresses held at once; past it a new one is counted by the backstop alone. */
  get addressCap(): number {
    return ADDRESSES_HELD;
  }

  /** A fresh minute — a proof's own, since the counts are this process's and outlive a test. */
  reset(): void {
    this.addresses.clear();
    this.sweptAt = 0;
    this.minuteStartedAt = 0;
    this.asked = 0;
  }

  /** The address's count for its running minute, or `null` once the map is full and it is new. */
  private countOf(address: string, now: number): AddressCount | null {
    const held = this.addresses.get(address);
    if (held !== undefined && now - held.startedAt < MS_PER_MINUTE) return held;
    if (held === undefined && this.addresses.size >= ADDRESSES_HELD) return null;
    const fresh = { startedAt: now, asked: 0, closedUntil: held?.closedUntil ?? 0 };
    this.addresses.set(address, fresh);
    return fresh;
  }

  private backstopAdmits(now: number): boolean {
    if (now - this.minuteStartedAt >= MS_PER_MINUTE) {
      this.minuteStartedAt = now;
      this.asked = 0;
    }
    if (this.asked >= LINK_CEILINGS.publicRequestsPerMinute) return false;
    this.asked += 1;
    return true;
  }

  /** Once a minute, forget every address whose minute and wait are both over. */
  private sweep(now: number): void {
    if (now - this.sweptAt < MS_PER_MINUTE) return;
    this.sweptAt = now;
    for (const [address, count] of this.addresses) {
      if (now - count.startedAt >= MS_PER_MINUTE && now >= count.closedUntil) {
        this.addresses.delete(address);
      }
    }
  }
}
