'use client';
import {
  type LeadDesignsSection,
  type LeadDetailScreen as LeadDetailScreenView,
  type LeadProposalsSection,
  useLeadDesignsSection,
  useLeadDetailScreen,
  useLeadProposalsSection,
} from '@heliogrid/data/react';
import {
  destinationLabel,
  leadAssignPickerWords,
  leadDetailPageWords,
  leadDetailSheetWords,
  leadTitleWords,
  leadWorkCardsWords,
  markWonBasisWords,
  markWonWords,
  proposalMoments,
  proposalPageHeadWords,
} from '@heliogrid/i18n';
import { useI18n, useTranslate } from '@heliogrid/i18n/react';
import {
  type FocusAfter,
  LargeTitle,
  LeadAssignPicker,
  LeadDetailSheet,
  LeadDetailStates,
  LeadRecordMenu,
  MarkWonSheet,
  markWonSheetOf,
  PageTrail,
  useFormat,
  useOwnWidth,
} from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { useLeadDesignsPanel } from './components/LeadDesigns';
import {
  type LeadCardProps,
  LeadContactsAndSections,
  LeadWork,
} from './components/LeadDetailCards';
import { LeadProposalSheets, useLeadProposalsPanel } from './components/LeadProposals';
import { LEAD_DETAIL_COLUMNS_FROM } from './constants';
import {
  type LeadDetailMoves,
  useLeadDetailMoves,
  useWonOnArrival,
} from './hooks/use-lead-detail-moves';

import './lead-detail.css';

/**
 * Lead Detail on the web (`SCR-M02-04`, `M02-32`): for a rep on a call — call, note what was said,
 * answer the six questions as the customer talks, book the visit. Below the desktop's room the
 * phone's one column; at it, two columns — the hero, the actions and qualify on the left, the
 * sections and contacts on the right. What is read, answered and acted on is
 * `useLeadDetailScreen`'s, the phone's too; the web's own parts are the width, the router, the
 * dialler and the clipboard.
 */
export function LeadDetailScreen({
  leadId,
  won = false,
}: {
  leadId: string;
  /** The address asked for the *Mark won* sheet — a proposal's *Confirm won* (`M07-62`). */
  won?: boolean;
}) {
  const t = useTranslate();
  const format = useFormat();
  const screen = useLeadDetailScreen(leadId, format.pack.timeZone);
  const moves = useLeadDetailMoves(screen.files);
  const { read } = screen;
  const proposals = useLeadProposalsSection(
    leadId,
    read.kind === 'ready' ? read.value.lead : null,
    moves.proposals,
  );
  const designs = useLeadDesignsSection(
    leadId,
    read.kind === 'ready' ? read.value.lead : null,
    screen.section === 'designs',
    moves.designs,
  );
  useWonOnArrival(won, screen);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const columns = width !== null && width >= LEAD_DETAIL_COLUMNS_FROM;
  return (
    <div
      ref={room}
      tabIndex={-1}
      className="hg-shell-page hg-focus-target hg-lead-detail"
      data-columns={columns ? 'true' : undefined}
    >
      <BackToLeads
        moves={moves}
        wide={columns}
        here={read.kind === 'ready' ? read.value.lead.lead.name : null}
        menu={
          read.kind === 'ready' ? (
            <LeadRecordMenu
              screen={screen}
              lead={read.value.lead}
              view={read.value.view}
              onAddReferral={moves.addReferral}
              onMerge={moves.merge}
              onMarkWon={screen.won.open}
              words={leadWorkCardsWords(t, read.value.lead, read.value.view, format.date)}
            />
          ) : null
        }
      />
      {read.kind === 'ready' ? (
        <LeadDetailReady
          screen={screen}
          lead={read.value.lead}
          view={read.value.view}
          moves={moves}
          columns={columns}
          proposals={proposals}
          designs={designs}
          focusAfter={room}
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

/**
 * The way back above the page, the app's one pattern (`PageTrail`): the desktop's breadcrumb, one
 * back below it, and the record menu at the row's other end on every width.
 */
function BackToLeads({
  moves,
  wide,
  here,
  menu,
}: {
  moves: LeadDetailMoves;
  wide: boolean;
  here: string | null;
  menu: ReactNode;
}) {
  const t = useTranslate();
  const format = useFormat();
  const leads = destinationLabel(t, 'leads');
  const head = proposalPageHeadWords(t, {
    money: (amount) => format.moneyPlain(amount),
    number: format.number,
  });
  return (
    <PageTrail
      trail={[{ label: leads, onOpen: moves.toLeads }]}
      here={here ?? leads}
      label={head.trail}
      narrow={!wide}
      acts={menu}
    />
  );
}

function LeadDetailReady({
  columns,
  focusAfter,
  ...card
}: LeadCardProps & {
  screen: LeadDetailScreenView;
  columns: boolean;
  proposals: LeadProposalsSection;
  designs: LeadDesignsSection;
  /** The page itself: where focus lands once a withdraw takes its row's act away. */
  focusAfter: FocusAfter;
}) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const { proposals, designs, ...shown } = card;
  const { screen, lead } = shown;
  const designsPanel = useLeadDesignsPanel(designs);
  const dockDesign = designsPanel.canDesign ? designsPanel : null;
  const reopen = shown.view.acts.stateActs.includes('reopen')
    ? () => screen.acts.quick('reopen')
    : null;
  const panel = useLeadProposalsPanel(lead, proposals, reopen);
  const cards = {
    ...shown,
    designs: designsPanel,
    ...(panel === null ? {} : { proposals: panel }),
  };
  const { basis } = screen.won;
  const moments = proposalMoments(t, { pack: format.pack, language: locale, now: Date.now() });
  const overlays = (
    <>
      <LeadDetailSheet
        screen={screen}
        lead={lead}
        view={shown.view}
        onHandOn={shown.moves.copy}
        onMerge={shown.moves.merge}
        words={leadDetailSheetWords(t, 'copy')}
      />
      <LeadAssignPicker
        assign={screen.assign}
        ownerId={lead.lead.owner?.userId ?? null}
        words={leadAssignPickerWords(t, lead.lead.name)}
      />
      <MarkWonSheet
        {...markWonSheetOf(screen.won, shown.moves.openProject, screen.days.today)}
        words={markWonWords(t, lead.lead.name ?? format.phone(lead.lead.phoneE164))}
        {...(basis.kind === 'ready'
          ? {
              basis: markWonBasisWords(
                t,
                {
                  money: (amount, beside) => format.moneyPlain(amount, beside),
                  when: moments.when,
                  due: (stage) => format.word('stage', stage),
                },
                basis.value,
                {
                  customerName: lead.lead.name,
                  segment: lead.lead.segment,
                  phone: format.phone(lead.lead.phoneE164),
                },
              ),
            }
          : {})}
      />
      <LeadProposalSheets lead={lead} section={proposals} focusAfter={focusAfter} />
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
        <LargeTitle title={heading.title} summary={heading.summary} nameTitle />
        <LeadWork {...shown} columns={false} dockDesign={dockDesign} />
        <LeadContactsAndSections {...cards} first="contacts" />
        {overlays}
      </div>
    );
  }
  return (
    <div className="hg-lead-detail-columns">
      <div className="hg-lead-detail-column">
        <LeadWork {...shown} columns dockDesign={dockDesign} />
      </div>
      <div className="hg-lead-detail-column">
        <LeadContactsAndSections {...cards} first="sections" />
      </div>
      {overlays}
    </div>
  );
}
