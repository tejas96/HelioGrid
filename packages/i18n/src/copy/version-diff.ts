/**
 * `VersionDiff`'s own words (`packages/ui`'s `VersionDiffWords`): each row's state in its pill,
 * the counts line, the pair's name, a side's note, the unchanged rows' toggle, the two sides'
 * names by mode, and the defaults of its change-note overline, removed field and empty pair.
 */
import type { Translator } from '../runtime';
import { COMPANY_PROFILE_STANDING_WORD } from './company-profile';
import { PRICE_BOOK } from './price-book';

/** A row's state — `packages/ui`'s `DiffState`. */
type DiffState = 'changed' | 'unchanged' | 'added' | 'removed';

export const VERSION_DIFF = {
  states: {
    changed: PRICE_BOOK.changed,
    unchanged: /*i18n*/ { id: 'Unchanged' },
    added: COMPANY_PROFILE_STANDING_WORD.added,
    removed: /*i18n*/ { id: 'Removed' },
  },
  counted: {
    changed: /*i18n*/ { id: '{count} changed' },
    unchanged: /*i18n*/ { id: '{count} unchanged' },
    added: /*i18n*/ { id: '{count} added' },
    removed: /*i18n*/ { id: '{count} removed' },
  },
  compared: /*i18n*/ { id: '{before} compared with {after}' },
  sideNote: /*i18n*/ { id: '{side}: {note}' },
  showUnchanged: /*i18n*/ {
    id: '{count, plural, one {Show # unchanged field} other {Show # unchanged fields}}',
  },
  hideUnchanged: /*i18n*/ {
    id: '{count, plural, one {Hide # unchanged field} other {Hide # unchanged fields}}',
  },
  firstVersion: /*i18n*/ { id: 'v1' },
  secondVersion: /*i18n*/ { id: 'v2' },
  now: /*i18n*/ { id: 'Now' },
  upgraded: /*i18n*/ { id: 'Upgraded' },
  whatChanged: /*i18n*/ { id: 'What changed and why' },
  notInThisVersion: /*i18n*/ { id: 'Not in this version' },
  nothingChanged: /*i18n*/ { id: 'Nothing changed between these two versions.' },
} as const;

/** Every word `VersionDiff` says itself, in the reader's language. */
export function versionDiffWords(t: Translator['t']) {
  return {
    states: {
      changed: t(VERSION_DIFF.states.changed),
      unchanged: t(VERSION_DIFF.states.unchanged),
      added: t(VERSION_DIFF.states.added),
      removed: t(VERSION_DIFF.states.removed),
    },
    counted: (state: DiffState, count: number) => t(VERSION_DIFF.counted[state], { count }),
    compared: (before: string, after: string) => t(VERSION_DIFF.compared, { before, after }),
    sideNote: (side: string, note: string) => t(VERSION_DIFF.sideNote, { side, note }),
    unchangedToggle: (shown: boolean, count: number) =>
      t(shown ? VERSION_DIFF.hideUnchanged : VERSION_DIFF.showUnchanged, { count }),
    sides: {
      versions: { before: t(VERSION_DIFF.firstVersion), after: t(VERSION_DIFF.secondVersion) },
      upgrade: { before: t(VERSION_DIFF.now), after: t(VERSION_DIFF.upgraded) },
    },
    whatChanged: t(VERSION_DIFF.whatChanged),
    notInThisVersion: t(VERSION_DIFF.notInThisVersion),
    nothingChanged: t(VERSION_DIFF.nothingChanged),
  };
}
