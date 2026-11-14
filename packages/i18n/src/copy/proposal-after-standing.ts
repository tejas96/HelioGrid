import type { TranslatedText } from '@heliogrid/contracts';
import type { ProposalStanding } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/** Where a proposal stands, in a word (`M06-48`) — one word per standing, never two merged (`F3-12`). */
export const PROPOSAL_STANDING_WORD: Record<ProposalStanding, MessageRef> = {
  draft: /*i18n*/ { id: 'Draft' },
  ready: /*i18n*/ { id: 'Ready to share' },
  shared: /*i18n*/ { id: 'Shared' },
  opened: /*i18n*/ { id: 'Opened' },
  negotiating: /*i18n*/ { id: 'Wants changes' },
  accepted: /*i18n*/ { id: 'Accepted' },
  declined: /*i18n*/ { id: 'Declined' },
  won: /*i18n*/ { id: 'Won' },
  replaced: /*i18n*/ { id: 'Replaced' },
  withdrawn: /*i18n*/ { id: 'Withdrawn' },
};

/** A standing's word; one a newer server learned reads as sent (`F3-05`). */
export function proposalStandingWord(t: T, standing: string): TranslatedText {
  const word = (PROPOSAL_STANDING_WORD as Record<string, MessageRef | undefined>)[standing];
  return word === undefined ? shownAsSent(standing) : t(word);
}
