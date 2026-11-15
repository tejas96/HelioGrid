import type {
  LeadDetailScreen,
  LeadDetailShown,
  LeadProposalsSection,
} from '@heliogrid/data/react';
import {
  leadAssignPickerWords,
  leadDetailSheetWords,
  markWonBasisWords,
  markWonWords,
} from '@heliogrid/i18n';
import {
  type FocusAfter,
  LeadAssignPicker,
  LeadDetailSheet,
  MarkWonSheet,
  markWonSheetOf,
} from '@heliogrid/ui';
import { useProposalFormats } from '../../shared/use-proposal-formats';
import type { LeadDetailMoves } from '../hooks/use-lead-detail-moves';
import { LeadProposalSheets } from './LeadProposals';

/**
 * Everything that opens over the lead on the phone: the act sheet, *Mark won* — with the accepted
 * proposal as its basis where one stands, the value shown and not typed (`M07-62`) — the proposal
 * sheets, and the assign picker. Each rises as a sheet; Android's Back closes the top one first.
 */
export function LeadDetailOverlays({
  screen,
  shown,
  moves,
  proposals,
  focusAfter,
}: {
  screen: LeadDetailScreen;
  shown: LeadDetailShown;
  moves: LeadDetailMoves;
  proposals: LeadProposalsSection;
  /** The page: where focus lands once an act that opened a sheet has gone. */
  focusAfter: FocusAfter;
}) {
  const { t, format, formats } = useProposalFormats();
  const { lead, view } = shown;
  const person = lead.lead;
  const { basis } = screen.won;
  const wonBasis =
    basis.kind === 'ready'
      ? markWonBasisWords(
          t,
          {
            money: formats.money,
            when: formats.when,
            due: (stage) => format.word('stage', stage),
          },
          basis.value,
          {
            customerName: person.name,
            segment: person.segment,
            phone: format.phone(person.phoneE164),
          },
        )
      : null;
  return (
    <>
      <LeadDetailSheet
        screen={screen}
        lead={lead}
        view={view}
        onHandOn={moves.share}
        onMerge={moves.merge}
        words={leadDetailSheetWords(t, 'share')}
      />
      <MarkWonSheet
        {...markWonSheetOf(screen.won, moves.openProject, screen.days.today)}
        words={markWonWords(t, person.name ?? format.phone(person.phoneE164))}
        {...(wonBasis === null ? {} : { basis: wonBasis })}
      />
      <LeadProposalSheets lead={lead} proposals={proposals} focusAfter={focusAfter} />
      <LeadAssignPicker
        assign={screen.assign}
        ownerId={person.owner?.userId ?? null}
        words={leadAssignPickerWords(t, person.name)}
      />
    </>
  );
}
