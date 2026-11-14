'use client';
import { type ProposalListScreen as ListView, useProposalListScreen } from '@heliogrid/data/react';
import {
  pickLeadLine,
  pickLeadWords,
  proposalActFailureWords,
  proposalListPageWords,
  proposalListWords,
  proposalStartSheetSaid,
} from '@heliogrid/i18n';
import {
  Button,
  LargeTitle,
  PickLeadSheet,
  ProposalList,
  ProposalStartSheet,
  proposalStartSheetPropsOf,
  ShellGlyph,
  useOwnWidth,
} from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { QuickAddForProposal } from '../../quick-add-lead';
import { PROPOSALS_TABLE_FROM } from '../shared/constants';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { useProposalMoves } from '../shared/use-proposal-moves';

import '../shared/proposals.css';

/**
 * The proposals list on the web (`SCR-M06-19`, `M06-48`): a rep or the owner came to find one
 * proposal and see where each stands, or to start one — *New proposal* asks who it is for first,
 * and a row's copy starts the same proposal for another lead. Long names and long Hindi could
 * crowd a row: below the table's room each proposal is a card. What is read, filtered and started
 * is `useProposalListScreen`'s, the phone's too; the web's own parts are the width and the router.
 */
export function ProposalListScreen() {
  const { t, format, formats } = useProposalFormats();
  const router = useRouter();
  const moves = useProposalMoves();
  const screen = useProposalListScreen({
    toProposal: moves.toProposal,
    toBuilder: moves.toBuilder,
  });
  const [room, width] = useOwnWidth<HTMLDivElement>();
  /* A person offered neither Leads nor Proposals meets the page that does not exist (`F7-48`). */
  if (!screen.allowed) notFound();
  const wide = width !== null && width >= PROPOSALS_TABLE_FROM;
  const page = proposalListPageWords(t, formats, {
    waiting: screen.waiting?.count ?? 0,
    waitingValue: screen.waiting?.value ?? '0',
  });
  const { flow } = screen;
  return (
    <div ref={room} tabIndex={-1} className="hg-shell-page hg-focus-target hg-proposal-page">
      <div className="hg-proposal-head-row">
        <LargeTitle
          title={page.title}
          summary={screen.waiting === null ? undefined : page.summary}
        />
        {screen.canStart ? (
          <div className="hg-proposal-head-acts">
            <Button icon={<ShellGlyph name="plus" size="sm" />} onClick={flow.openNew}>
              {page.newProposal}
            </Button>
          </div>
        ) : null}
      </div>
      <ProposalList
        read={screen.read}
        room={wide ? 'wide' : 'narrow'}
        filter={screen.filter}
        onFilter={screen.setFilter}
        words={proposalListWords(t, formats)}
        onOpen={screen.open}
        {...(screen.canStart
          ? { onCopy: flow.openCopy, onNewVersion: (row) => moves.toBuilder(row.id) }
          : {})}
        {...(screen.hasMore ? { onMore: screen.showMore } : {})}
        loadingMore={screen.loadingMore}
        focusAfter={room}
      />
      {flow.stage === 'capture' ? (
        <QuickAddForProposal
          onLeft={flow.close}
          onLead={flow.startOn}
          onOpenLead={(address) => router.push(address)}
        />
      ) : null}
      <ProposalStartSheet
        {...proposalStartSheetPropsOf(
          flow.start,
          proposalStartSheetSaid(t, formats, {
            name: flow.customerName ?? '',
            segment: flow.customerSegment,
            ...flow.start,
          }),
        )}
      />
      <PickLeadSheet
        open={flow.stage === 'pick'}
        onClose={flow.close}
        words={pickLeadWords(t)}
        query={flow.picker.query}
        onQuery={flow.picker.setQuery}
        leads={pickRowsOf(flow, format.phone)}
        pendingId={flow.picker.pendingId}
        failure={flow.stage === 'pick' ? proposalActFailureWords(t, flow.failure) : null}
        onPick={flow.picker.pick}
        onNewCustomer={flow.picker.newCustomer}
        focusAfter={room}
      />
    </div>
  );
}

/** A lead the copy can start on, as the picker lists it: its name, else its number, and where it is. */
function pickRowsOf(flow: ListView['flow'], phone: (e164: string) => string) {
  const { leads } = flow.picker;
  if (leads.kind !== 'ready') return leads;
  return {
    ...leads,
    value: leads.value.map((lead) => ({
      id: lead.id,
      name: lead.name ?? phone(lead.phoneE164),
      line: pickLeadLine({ city: lead.city, phone: phone(lead.phoneE164) }),
    })),
  };
}
