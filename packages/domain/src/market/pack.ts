import { type FormatPack, IN_FORMATS } from '../format/pack';
import { IN_MARKET, type MarketCode } from './code';
import { type PackVersion, packVersion } from './version';

/**
 * The market pack, the versioned unit of market configuration (`F1-01`). Every market fact
 * the product renders, computes with or enforces is a value on one of its eight keys
 * (`F1-02`); nothing else is a market fact, and no module keeps one of its own.
 *
 * **The keys land one task at a time (Law 9).** `formats` is here because its task built it.
 * Each remaining key arrives with its own T-FCORE task (`docs/tasks/F-core.md`) as a property
 * here, a folder beside `format/`, and its India values on `IN_PACK`; `unauthoredKeys(IN_PACK)`
 * names what is still owed. Until all eight are present the pack is not launchable, and
 * `launch.ts` says so rather than pretending (`F1-05`).
 *
 * A pack is DATA, and it is INJECTED: a caller resolves the tenant's pack and passes it in.
 * There is no registry and no default here, because a module-level lookup is the
 * anti-pattern this package exists to prevent. Platform-authored, never tenant-edited
 * (`F1-12`); the tenant's own values, its timezone above all, are substituted by the caller
 * and never written back.
 *
 * No published date here. `F1-11`'s "dated" belongs to the publication record, which the
 * storage slice adds when a pack can be published at all; an authored, unlaunched pack has no
 * such date, and inventing one would put a false fact on every output that pinned it.
 */
export interface MarketPack {
  readonly market: MarketCode;
  /** What every money- and engineering-bearing output pins (`F1-11`). */
  readonly version: PackVersion;
  /** `pack.formats`: locale, format and display data (`F1-21`, `F1-22`). */
  readonly formats: FormatPack;
}

/**
 * India, the one authored pack at launch (`F1-06`). Revision 1, and it stays 1 until the
 * pack is live: a revision number exists to stale the outputs that pinned it (`F1-11`), and
 * nothing can pin an unlaunched pack. `market` and `formats.id` are the same constant on
 * purpose; the market's code is spelled once, in `code.ts`.
 */
export const IN_PACK: MarketPack = {
  market: IN_MARKET,
  version: packVersion(IN_MARKET, 1),
  formats: IN_FORMATS,
};
