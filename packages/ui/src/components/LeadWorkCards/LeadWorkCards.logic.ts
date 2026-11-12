import { leadValueShownOf } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { HeroPanelMenu } from '../HeroPanel/HeroPanel.types';
import {
  type LeadDockPresses,
  type LeadDockQuickStanding,
  leadDockOf,
} from '../LeadActionDock/LeadActionDock.logic';
import type { LeadActionDockProps } from '../LeadActionDock/LeadActionDock.types';
import { leadRecordMenuOf } from '../LeadHero/LeadHero.logic';
import type { LeadHeroProps, LeadRecordActPress } from '../LeadHero/LeadHero.types';
import type { QualifyCardProps } from '../QualifyCard/QualifyCard.types';
import type { LeadRecordMenuProps, LeadWorkCardsProps } from './LeadWorkCards.types';

/** The state acts the record menu holds, out of the action row on every layout. */
const MENU_STATE_ACTS = ['snooze', 'disqualify'] as const;

/**
 * The record menu's acts: snooze and disqualify where the standing offers them,
 * then Mark won and Mark lost where the deal may close, a referral always, merge to who may, junk where the
 * standing offers it.
 */
export function leadRecordActsOf({
  screen,
  lead,
  view,
  onAddReferral,
  onMerge,
  onMarkWon,
}: Pick<
  LeadWorkCardsProps,
  'screen' | 'lead' | 'view' | 'onAddReferral' | 'onMerge' | 'onMarkWon'
>): LeadRecordActPress[] {
  const offered = view.acts.stateActs;
  /* Won and lost are the deal's two ends: the same open stages before Won offer both (`M07-62`,
     `M07-63`), to a reader who may close a deal. */
  const mayClose = screen.canWin && view.acts.markWon;
  const states: LeadRecordActPress[] = MENU_STATE_ACTS.filter((act) => offered.includes(act)).map(
    (act) => ({ act, onPress: () => screen.acts.open({ kind: act }) }),
  );
  return [
    ...states,
    ...(mayClose
      ? [
          { act: 'mark-won' as const, onPress: onMarkWon },
          { act: 'mark-lost' as const, onPress: () => screen.acts.open({ kind: 'lost' }) },
        ]
      : []),
    { act: 'add-referral', onPress: () => onAddReferral(lead.lead.id) },
    ...(screen.canMerge
      ? [{ act: 'merge' as const, onPress: () => onMerge(lead.customer.id) }]
      : []),
    ...(offered.includes('junk')
      ? [{ act: 'junk' as const, onPress: () => screen.acts.open({ kind: 'junk' }) }]
      : []),
  ];
}

/** The narrow page's record menu, drawn in its top bar: its acts in order, or none to draw. */
export function leadPageMenuOf(
  props: LeadRecordMenuProps,
  glyph: (name: ShellGlyphName) => ReactNode,
): HeroPanelMenu | undefined {
  const { screen, words } = props;
  return leadRecordMenuOf(
    {
      recordActs: leadRecordActsOf(props),
      recordActsOff: screen.acts.quickStanding?.kind === 'waiting',
      words: words.hero,
    },
    glyph,
  );
}

/**
 * The hero: the record's stage, source, state, owner and value, on the wide page also its identity
 * and the record menu in its corner; the narrow page draws that menu in its top bar.
 */
export function leadHeroOf(props: LeadWorkCardsProps, format: MarketFormat): LeadHeroProps {
  const { screen, lead, identity, layout, onOpenProject, words } = props;
  const { lead: summary } = lead;
  return {
    form: layout === 'dock' ? 'narrow' : 'wide',
    onEditDetails: () => screen.acts.open({ kind: 'details' }),
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
    words: words.hero,
  };
}

/**
 * The five actions and the state acts; a sheet-less act (wake, reopen) says where it stands. Only
 * wake and reopen stay under the actions: snooze and disqualify are the record menu's, so the
 * action row holds the day's work alone.
 */
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
  const dock = leadDockOf(view, words.dock, presses, quick);
  return {
    layout,
    ...dock,
    stateActs: dock.stateActs.filter((each) => !MENU_STATE_ACTS.some((act) => act === each.act)),
  };
}

/** The six questions inline (`M02-39`), and Mark qualified where the stage offers it. */
export function leadQualifyOf({
  screen,
  view,
  layout,
  words,
}: LeadWorkCardsProps): QualifyCardProps {
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
    foldable: layout === 'dock',
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
