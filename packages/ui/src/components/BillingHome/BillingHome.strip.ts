import type { BillingStanding } from '@heliogrid/contracts';
import { MS_PER_DAY } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { BillingStripView } from './BillingHome.types';
import { plain } from './BillingHome.values';
import type { BillingStripWords } from './BillingHome.words';

/**
 * `SCR-SHELL-06`'s strip as this page draws it (inherited; owner ruling): a title, then rows of
 * one family — what paused, what still works, until when — read off the soft-block matrix for the
 * standing's phase. No act and no amount row here: `Needs you`, under it, carries both.
 */
export function stripOf(
  standing: BillingStanding,
  words: BillingStripWords,
  format: MarketFormat,
  now: number,
): BillingStripView | null {
  switch (standing.phase) {
    case 'past_due_full_function': {
      const day = Math.floor((now - Date.parse(standing.stateEnteredAt)) / MS_PER_DAY);
      const paused = words.matrix('past_due_metered_paused').paused;
      return {
        kind: 'dunning',
        title: words.graceDay(day, true),
        rows: [
          { key: 'works', mark: 'works', label: words.stillWorks, value: plain(words.everything) },
          ...(standing.pausesAt === null
            ? []
            : [
                {
                  key: 'pause',
                  mark: 'until' as const,
                  label: paused,
                  value: plain(format.date(standing.pausesAt)),
                },
              ]),
        ],
      };
    }
    case 'past_due_metered_paused': {
      const day = Math.floor((now - Date.parse(standing.stateEnteredAt)) / MS_PER_DAY);
      const { paused, stillWorks } = words.matrix(standing.phase);
      return {
        kind: 'dunning',
        title: words.graceDay(day, false),
        rows: [
          { key: 'paused', mark: 'paused', label: words.paused, value: plain(paused) },
          { key: 'works', mark: 'works', label: words.stillWorks, value: plain(stillWorks) },
          ...(standing.graceEndsAt === null
            ? []
            : [
                {
                  key: 'until',
                  mark: 'until' as const,
                  label: words.until,
                  value: plain(format.date(standing.graceEndsAt)),
                },
              ]),
        ],
      };
    }
    case 'halted':
      return deadStrip(words, words.haltedTitle, standing.phase);
    case 'expired':
      return deadStrip(
        words,
        words.trialEndedOn(format.date(standing.trialEndsAt ?? standing.stateEnteredAt)),
        standing.phase,
      );
    case 'cancelled_post_period':
      return deadStrip(words, words.subscriptionEnded, standing.phase);
    default:
      return null;
  }
}

/** A dead state's strip: what is paused and the four things that always work (`BM-32`). */
function deadStrip(
  words: BillingStripWords,
  title: BillingStripView['title'],
  phase: 'halted' | 'expired' | 'cancelled_post_period',
): BillingStripView {
  const { paused, stillWorks } = words.matrix(phase);
  return {
    kind: 'dunning',
    title,
    rows: [
      { key: 'paused', mark: 'paused', label: words.paused, value: plain(paused) },
      { key: 'works', mark: 'works', label: words.stillWorks, value: plain(stillWorks) },
    ],
  };
}
