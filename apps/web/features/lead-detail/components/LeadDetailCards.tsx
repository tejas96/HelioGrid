'use client';
import type { LeadDetail } from '@heliogrid/contracts';
import type { LeadDetailScreen } from '@heliogrid/data/react';
import type { LeadDetailView } from '@heliogrid/domain';
import { leadDetailCardsWords, leadTimelineWords, leadWorkCardsWords } from '@heliogrid/i18n';
import { useI18n, useTranslate } from '@heliogrid/i18n/react';
import {
  type LeadDesignsPanel,
  LeadDetailCards,
  type LeadProposalsPanel,
  LeadTimeline,
  LeadWorkCards,
  useFormat,
} from '@heliogrid/ui';
import type { LeadDetailMoves } from '../hooks/use-lead-detail-moves';

/** What every card of the page draws from: the hook, the lead as read and domain's view of it. */
export interface LeadCardProps {
  readonly screen: LeadDetailScreen;
  readonly lead: LeadDetail;
  readonly view: LeadDetailView;
  readonly moves: LeadDetailMoves;
}

/**
 * The hero, the actions and the qualify card. In the desktop's columns the hero names the lead
 * itself and the actions stand as a grid; in one column the large title names it over the dock.
 */
export function LeadWork({
  screen,
  lead,
  view,
  moves,
  columns,
  dockDesign,
}: LeadCardProps & {
  columns: boolean;
  /** *Create design*; `null` for a reader without the design grant. */
  dockDesign: LeadDesignsPanel | null;
}) {
  const t = useTranslate();
  const format = useFormat();
  return (
    <LeadWorkCards
      screen={screen}
      lead={lead}
      view={view}
      identity={columns}
      layout={columns ? 'grid' : 'dock'}
      onAddReferral={moves.addReferral}
      onMerge={moves.merge}
      onMarkWon={screen.won.open}
      onOpenProject={moves.openProject}
      dockDesign={dockDesign}
      words={leadWorkCardsWords(t, lead, view, format.date)}
    />
  );
}

/**
 * Who to reach and what has happened (`M02-32`, `M02-34`, `M02-37`): the contacts with the calling
 * facts and the six sections — the files with the browser's chooser — in the order the column
 * takes them.
 */
export function LeadContactsAndSections({
  screen,
  lead,
  view,
  moves,
  first,
  proposals,
  designs,
}: LeadCardProps & {
  first: 'contacts' | 'sections';
  proposals?: LeadProposalsPanel;
  designs: LeadDesignsPanel;
}) {
  const { t, locale } = useI18n();
  const format = useFormat();
  return (
    <LeadDetailCards
      screen={screen}
      view={view}
      visit={lead.visit}
      timeline={<LeadTimeline timeline={screen.timeline} words={leadTimelineWords(t)} />}
      onDial={moves.dial}
      onAddFile={moves.addFile}
      onOpenFile={moves.openFile}
      first={first}
      designs={designs}
      {...(proposals === undefined ? {} : { proposals })}
      words={leadDetailCardsWords(t, { areas: format.pack.areas, language: locale })}
    />
  );
}
