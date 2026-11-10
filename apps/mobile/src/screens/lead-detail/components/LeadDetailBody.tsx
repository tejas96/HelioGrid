import type { LeadDetailScreen, LeadDetailShown } from '@heliogrid/data/react';
import { leadDetailCardsWords, leadTimelineWords, leadWorkCardsWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { LeadDetailCards, LeadTimeline, LeadWorkCards, useFormat } from '@heliogrid/ui';
import type { LeadDetailMoves } from '../hooks/use-lead-detail-moves';

/**
 * The lead as the rep works it on a call (`M02-32`): the hero with its stage, owner and value, the
 * five actions in thumb reach with Call biggest, the state acts, the six questions inline, then
 * the contacts and the six sections. The large title names the lead, so the hero does not.
 */
export function LeadDetailBody({
  screen,
  shown,
  moves,
}: {
  screen: LeadDetailScreen;
  shown: LeadDetailShown;
  moves: LeadDetailMoves;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { lead, view } = shown;
  return (
    <>
      <LeadWorkCards
        screen={screen}
        lead={lead}
        view={view}
        identity={false}
        layout="dock"
        onAddReferral={moves.addReferral}
        onMerge={moves.merge}
        words={leadWorkCardsWords(t, lead, view, format.date)}
      />
      <LeadDetailCards
        screen={screen}
        view={view}
        visit={lead.visit}
        timeline={<LeadTimeline timeline={screen.timeline} words={leadTimelineWords(t)} />}
        onDial={moves.dial}
        first="contacts"
        words={leadDetailCardsWords(t)}
      />
    </>
  );
}
