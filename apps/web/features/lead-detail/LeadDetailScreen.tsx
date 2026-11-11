'use client';
import {
  type LeadDetailScreen as LeadDetailScreenView,
  useLeadDetailScreen,
} from '@heliogrid/data/react';
import {
  destinationLabel,
  leadAssignPickerWords,
  leadDetailPageWords,
  leadDetailSheetWords,
  leadTitleWords,
  markWonWords,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  LargeTitle,
  LeadAssignPicker,
  LeadDetailSheet,
  LeadDetailStates,
  MarkWonSheet,
  markWonSheetOf,
  ShellGlyph,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import {
  type LeadCardProps,
  LeadContactsAndSections,
  LeadWork,
} from './components/LeadDetailCards';
import { LEAD_DETAIL_COLUMNS_FROM } from './constants';
import { type LeadDetailMoves, useLeadDetailMoves } from './hooks/use-lead-detail-moves';

import './lead-detail.css';

/**
 * Lead Detail on the web (`SCR-M02-04`, `M02-32`): for a rep on a call — call, note what was said,
 * answer the six questions as the customer talks, book the visit. Below the desktop's room the
 * phone's one column; at it, two columns — the hero, the actions and qualify on the left, the
 * sections and contacts on the right. What is read, answered and acted on is
 * `useLeadDetailScreen`'s, the phone's too; the web's own parts are the width, the router, the
 * dialler and the clipboard.
 */
export function LeadDetailScreen({ leadId }: { leadId: string }) {
  const t = useTranslate();
  const screen = useLeadDetailScreen(leadId, useFormat().pack.timeZone);
  const moves = useLeadDetailMoves(screen.files);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const columns = width !== null && width >= LEAD_DETAIL_COLUMNS_FROM;
  const { read } = screen;
  return (
    <div
      ref={room}
      tabIndex={-1}
      className="hg-shell-page hg-focus-target hg-lead-detail"
      data-columns={columns ? 'true' : undefined}
    >
      <BackToLeads moves={moves} />
      {read.kind === 'ready' ? (
        <LeadDetailReady
          screen={screen}
          lead={read.value.lead}
          view={read.value.view}
          moves={moves}
          columns={columns}
        />
      ) : (
        <LeadDetailStates
          read={read}
          words={leadDetailPageWords(t)}
          onBackToList={moves.toLeads}
          focusAfter={room}
        />
      )}
    </div>
  );
}

/** The way back to the list, above the page — the desktop's crumb and the phone width's back. */
function BackToLeads({ moves }: { moves: LeadDetailMoves }) {
  const t = useTranslate();
  return (
    <div className="hg-lead-detail-back">
      <Button
        variant="ghost"
        size="sm"
        icon={<ShellGlyph name="chevron-left" size="sm" />}
        onClick={moves.toLeads}
      >
        {destinationLabel(t, 'leads')}
      </Button>
    </div>
  );
}

function LeadDetailReady({
  columns,
  ...card
}: LeadCardProps & { screen: LeadDetailScreenView; columns: boolean }) {
  const t = useTranslate();
  const format = useFormat();
  const { screen, lead } = card;
  const overlays = (
    <>
      <LeadDetailSheet
        screen={screen}
        lead={lead}
        view={card.view}
        onHandOn={card.moves.copy}
        onMerge={card.moves.merge}
        words={leadDetailSheetWords(t, 'copy')}
      />
      <LeadAssignPicker
        assign={screen.assign}
        ownerId={lead.lead.owner?.userId ?? null}
        words={leadAssignPickerWords(t, lead.lead.name)}
      />
      <MarkWonSheet
        {...markWonSheetOf(screen.won, card.moves.openProject, screen.days.today)}
        words={markWonWords(t, lead.lead.name ?? format.phone(lead.lead.phoneE164))}
      />
    </>
  );
  if (!columns) {
    const heading = leadTitleWords(t, {
      name: lead.lead.name,
      phone: format.phone(lead.lead.phoneE164),
      city: lead.lead.city,
    });
    return (
      <div className="hg-lead-detail-column">
        <LargeTitle title={heading.title} summary={heading.summary} />
        <LeadWork {...card} columns={false} />
        <LeadContactsAndSections {...card} first="contacts" />
        {overlays}
      </div>
    );
  }
  return (
    <div className="hg-lead-detail-columns">
      <div className="hg-lead-detail-column">
        <LeadWork {...card} columns />
      </div>
      <div className="hg-lead-detail-column">
        <LeadContactsAndSections {...card} first="sections" />
      </div>
      {overlays}
    </div>
  );
}
