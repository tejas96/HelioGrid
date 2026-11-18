import type { LeadDetailScreen, LeadDetailShown } from '@heliogrid/data/react';
import { leadDetailCardsWords, leadTimelineWords, leadWorkCardsWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  type LeadDesignsPanel,
  LeadDetailCards,
  type LeadProposalsPanel,
  LeadTimeline,
  LeadWorkCards,
  useFormat,
} from '@heliogrid/ui';
import type { LeadDetailMoves } from '../hooks/use-lead-detail-moves';

/**
 * The lead as the rep works it on a call (`M02-32`): the hero with its stage, owner and value, the
 * five actions in thumb reach with Call biggest, the state acts, the six questions inline, then
 * the contacts and the six sections — Proposals among them, where a proposal is started, continued
 * or withdrawn. The large title names the lead, so the hero does not.
 */
export function LeadDetailBody({
  screen,
  shown,
  moves,
  proposals,
  designs,
  dockDesign,
}: {
  screen: LeadDetailScreen;
  shown: LeadDetailShown;
  moves: LeadDetailMoves;
  /** The Proposals section's five states (`T-M06-001`); `null` on an api built before proposals. */
  proposals: LeadProposalsPanel | null;
  /** The Designs section: the lead's design cards (`T-M05-001`). */
  designs: LeadDesignsPanel;
  /** *Create design*; `null` for a reader without the design grant. */
  dockDesign: LeadDesignsPanel | null;
}) {
  const { t, locale } = useI18n();
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
        onMarkWon={screen.won.open}
        onOpenProject={moves.openProject}
        dockDesign={dockDesign}
        words={leadWorkCardsWords(t, lead, view, format.date)}
      />
      <LeadDetailCards
        screen={screen}
        view={view}
        visit={lead.visit}
        timeline={<LeadTimeline timeline={screen.timeline} words={leadTimelineWords(t)} />}
        onDial={moves.dial}
        onAddFile={moves.addFile}
        onOpenFile={moves.openFile}
        first="contacts"
        designs={designs}
        {...(proposals === null ? {} : { proposals })}
        words={leadDetailCardsWords(t, { areas: format.pack.areas, language: locale })}
      />
    </>
  );
}
