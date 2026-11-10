import { leadValueShownOf } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import {
  type LeadDockPresses,
  type LeadDockQuickStanding,
  leadDockOf,
} from '../LeadActionDock/LeadActionDock.logic';
import type { LeadActionDockProps } from '../LeadActionDock/LeadActionDock.types';
import type { LeadHeroProps } from '../LeadHero/LeadHero.types';
import type { QualifyCardProps } from '../QualifyCard/QualifyCard.types';
import type { LeadWorkCardsProps } from './LeadWorkCards.types';

/** The hero: the record's stage, source, state, owner and value; on the desktop also its identity. */
export function leadHeroOf(
  { screen, lead, identity, words }: LeadWorkCardsProps,
  format: MarketFormat,
): LeadHeroProps {
  const { lead: summary } = lead;
  return {
    identity: identity
      ? { name: summary.name, phone: format.phone(summary.phoneE164), city: summary.city }
      : null,
    stage: summary.stage,
    source: summary.source,
    lifecycleState: summary.state,
    onOwner: screen.assign.show,
    ownerName: summary.owner?.name ?? null,
    value: leadValueShownOf(summary.value, format.pack),
    words: words.hero,
  };
}

/** The five actions and the state acts; a sheet-less act (wake, reopen) says where it stands. */
export function leadWorkDockOf({
  screen,
  lead,
  view,
  layout,
  onAddReferral,
  onMerge,
  words,
}: LeadWorkCardsProps): LeadActionDockProps {
  const { acts } = screen;
  const standing = acts.quickStanding;
  const quick: LeadDockQuickStanding | null =
    standing === null || standing.kind === 'waiting'
      ? standing
      : { kind: 'returned', act: standing.act, reason: words.failure(standing.failure) };
  const presses: LeadDockPresses = {
    message: () => acts.open({ kind: 'message', template: 'follow_up_nudge' }),
    log: () => acts.open({ kind: 'log' }),
    visit: () => acts.open({ kind: 'visit' }),
    stateAct: (act) => {
      if (act === 'wake' || act === 'reopen') acts.quick(act);
      else acts.open({ kind: act });
    },
    addReferral: () => onAddReferral(lead.lead.id),
    merge: screen.canMerge ? () => onMerge(lead.customer.id) : null,
  };
  return { layout, ...leadDockOf(view, words.dock, presses, quick) };
}

/** The six questions inline (`M02-39`), and Mark qualified where the stage offers it. */
export function leadQualifyOf({ screen, view, words }: LeadWorkCardsProps): QualifyCardProps {
  const { qualify } = screen;
  const mark = qualify.markQualified;
  return {
    questions: view.qualify.questions,
    answered: view.qualify.answered,
    onAnswer: qualify.answer,
    onRetry: qualify.retry,
    markQualified: view.acts.markQualified
      ? {
          onPress: mark.run,
          pending: mark.pending,
          failure: mark.failure === null ? null : words.failure(mark.failure),
        }
      : null,
    words: words.qualify,
  };
}
