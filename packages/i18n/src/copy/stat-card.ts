/**
 * `StatCard`'s own words (`packages/ui`'s `StatCardWords`): the name its loading face speaks, the
 * delta's direction said with its figure, and the sentiment word after it — plus the usual
 * sentences of its empty, failed and unavailable faces, which a card draws only when given.
 */
import type { Translator } from '../runtime';
import { BLOCK } from './block';

/** Which way a figure moved — `packages/ui`'s `StatCardDeltaDir`. */
type StatCardDirection = 'up' | 'down' | 'flat';

export const STAT_CARD = {
  moved: {
    up: /*i18n*/ { id: 'Up {delta}' },
    down: /*i18n*/ { id: 'Down {delta}' },
    flat: /*i18n*/ { id: 'No change {delta}' },
  },
  better: /*i18n*/ { id: 'better' },
  worse: /*i18n*/ { id: 'worse' },
  empty: /*i18n*/ { id: 'No figure for this period yet.' },
  couldNotRead: /*i18n*/ {
    id: "Couldn't read this figure. Try again — nothing here is a stale number.",
  },
  notMeasured: /*i18n*/ { id: 'Not measured here' },
} as const;

/** Every word `StatCard` says itself, in the reader's language. */
export function statCardWords(t: Translator['t']) {
  return {
    loading: (label: string) => t(BLOCK.loadingNamed, { title: label }),
    moved: (dir: StatCardDirection, delta: string) => t(STAT_CARD.moved[dir], { delta }),
    better: t(STAT_CARD.better),
    worse: t(STAT_CARD.worse),
  };
}
