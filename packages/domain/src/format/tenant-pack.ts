import type { FormatPack } from './pack';

/**
 * The pack a TENANT is read by (`F3-22`).
 *
 * `pack.timeZone` is the market's default (`F1-10`) — the answer for a tenant that set none. A
 * tenant that set its own must be READ by it, and every date reader already takes its zone from
 * the pack, so the substitution happens once here rather than as a second argument threaded
 * through every call site. Two sources for one fact, one of them optional, is how half the
 * surfaces end up on the market default.
 *
 * Nothing else moves: grouping, the compact ladder, the date style and the currency are the
 * MARKET's, and a tenant cannot choose them (`F1-12`).
 */

/**
 * A zone Intl cannot resolve would make every date throw mid-render, and a formatter that throws
 * blanks the screen it was called on. An unusable zone therefore keeps the market default, which
 * is wrong by a few hours at worst — never blank, and never the DEVICE's zone, which is the one
 * answer `F3-22` forbids outright.
 */
function isResolvable(timeZone: string): boolean {
  if (timeZone === '') return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The market pack with the tenant's own zone in it, or the pack itself when there is nothing to change. */
export function packOnTenantTime(pack: FormatPack, timeZone: string): FormatPack {
  if (timeZone === pack.timeZone || !isResolvable(timeZone)) return pack;
  return { ...pack, timeZone };
}
