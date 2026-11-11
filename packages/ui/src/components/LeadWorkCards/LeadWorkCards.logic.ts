import { leadValueShownOf } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import {
  type LeadDockPresses,
  type LeadDockQuickStanding,
  leadDockOf,
} from '../LeadActionDock/LeadActionDock.logic';
import type { LeadActionDockProps } from '../LeadActionDock/LeadActionDock.types';
import type { LeadHeroProps, LeadRecordActPress } from '../LeadHero/LeadHero.types';
import type { QualifyCardProps } from '../QualifyCard/QualifyCard.types';
import type { LeadWorkCardsProps } from './LeadWorkCards.types';

/**
 * The hero: the record's stage, source, state, owner and value, on the desktop also its identity,
 * and the record menu — Mark won where the deal may close, a referral always, merge to who may,
 * junk where the standing offers it.
 */
export function leadHeroOf(
  {
    screen,
    lead,
    view,
    identity,
    onAddReferral,
    onMerge,
    onMarkWon,
    onOpenProject,
    words,
  }: LeadWorkCardsProps,
  format: MarketFormat,
): LeadHeroProps {
  const { lead: summary } = lead;
  const recordActs: LeadRecordActPress[] = [
    ...(screen.canWin && view.acts.markWon
      ? [{ act: 'mark-won' as const, onPress: onMarkWon }]
      : []),
    { act: 'add-referral', onPress: () => onAddReferral(summary.id) },
  ];
  if (screen.canMerge) recordActs.push({ act: 'merge', onPress: () => onMerge(lead.customer.id) });
  if (view.acts.stateActs.includes('junk')) {
    recordActs.push({ act: 'junk', onPress: () => screen.acts.open({ kind: 'junk' }) });
  }
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
    project: screen.canOpenProject ? projectOfLead(lead, onOpenProject) : null,
    recordActs,
    recordActsOff: screen.acts.quickStanding?.kind === 'waiting',
    words: words.hero,
  };
}

/** The five actions and the state acts; a sheet-less act (wake, reopen) says where it stands. */
export function leadWorkDockOf({
  screen,
  view,
  layout,
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

/** The project a won lead became, opened from the hero; null before the win. */
function projectOfLead(
  lead: LeadWorkCardsProps['lead'],
  onOpenProject: LeadWorkCardsProps['onOpenProject'],
): LeadHeroProps['project'] {
  const won = lead.project ?? null;
  return won === null ? null : { number: won.number, onOpen: () => onOpenProject(won.id) };
}
