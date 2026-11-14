'use client';
import {
  type ProposalTrackScreen as TrackView,
  useProposalMarketNames,
  useProposalTrackScreen,
} from '@heliogrid/data/react';
import {
  destinationLabel,
  messageSheetWords,
  proposalActFailureWords,
  proposalPageHeadWords,
  proposalScreenSaid,
  proposalTrackWords,
  shareToastWords,
  taxNumberNoticeWords,
} from '@heliogrid/i18n';
import {
  MessageSheet,
  ProposalTrack,
  ScaledProposalPage,
  TRACK_COVER_WIDTH,
  useOwnWidth,
} from '@heliogrid/ui';
import { useEffect, useRef } from 'react';
import { OneToast } from '../../../lib/one-toast';
import { PROPOSAL_WIDE_FROM } from '../shared/constants';
import { ProposalPageHead } from '../shared/ProposalPageHead';
import { useProposalFormats } from '../shared/use-proposal-formats';
import { type ProposalMoves, useProposalMoves } from '../shared/use-proposal-moves';
import { useProposalPages } from '../shared/use-proposal-pages';
import { TrackMenu } from './TrackMenu';

import '../shared/proposals.css';

/**
 * A proposal after it is built, on the web (`SCR-M06-18`): the rep came to see what happened and do
 * the one next thing — share, call, make a version, confirm the win — and could be frustrated by a
 * screen that claims a delivery it never saw, or an act they must hunt for. What is read and sent is
 * `useProposalTrackScreen`'s, the phone's too; the web's own parts are the router, the chat opened
 * in a tab, the clipboard and the PDF's tab.
 */
export function ProposalTrackScreen({
  proposalId,
  share,
}: {
  proposalId: string;
  /** The address asked for the share sheet — the document's and the versions' *Share*. */
  share: boolean;
}) {
  const { t, locale, format, formats } = useProposalFormats();
  const said = proposalScreenSaid(t);
  const moves = useProposalMoves();
  const screen = useProposalTrackScreen(proposalId, trackMovesOf(moves));
  useShareOnArrival(share, proposalId, screen, moves);
  const [room, width] = useOwnWidth<HTMLDivElement>();
  const wide = width !== null && width >= PROPOSAL_WIDE_FROM;
  const detail = screen.read.kind === 'ready' ? screen.read.value : null;
  const head = proposalPageHeadWords(t, formats);
  const shown = screen.shown.kind === 'ready' ? screen.shown.value : null;
  const pages = useProposalPages(shown);
  const { taxName } = useProposalMarketNames();
  const customer = detail?.document.deal.clientName ?? null;
  const sheetWords = (kind: 'share' | 'thank' | 'crew') =>
    messageSheetWords(t, kind, {
      name: customer,
      segment: detail?.document.deal.segment ?? null,
      language:
        new Intl.DisplayNames([locale], { type: 'language' }).of(
          detail?.document.language ?? locale,
        ) ?? '',
      withoutTaxNumber: kind === 'share' && screen.withoutTaxNumber,
    });
  const menu =
    detail === null ? null : (
      <TrackMenu
        detail={detail}
        withdraw={screen.withdraw}
        label={head.more}
        words={head}
        focusAfter={room}
      />
    );
  return (
    <div
      ref={room}
      tabIndex={-1}
      className="hg-shell-page hg-focus-target hg-proposal-page"
      data-narrow="true"
    >
      <ProposalPageHead
        wide={wide}
        trail={[{ label: destinationLabel(t, 'proposals'), onOpen: moves.toList }]}
        here={head.name(detail?.document.number ?? null)}
        label={head.trail}
        title={head.name(detail?.document.number ?? null)}
        summary={
          shown === null
            ? undefined
            : head.summary({
                customerName: customer,
                capacityKw: shown.fields.system.capacityKw,
                payable: shown.money?.payable.amount ?? null,
              })
        }
        mono={detail?.document.number != null}
        acts={menu}
        barActs={menu}
      />
      <ProposalTrack
        read={screen.read}
        words={proposalTrackWords(t, formats)}
        cover={
          pages === null ? undefined : (
            <ScaledProposalPage
              page="cover"
              {...pages}
              width={wide ? TRACK_COVER_WIDTH.wide : TRACK_COVER_WIDTH.narrow}
              still
            />
          )
        }
        shown={pages}
        crewMessageDue={screen.crewMessageDue}
        pending={null}
        failure={null}
        onAct={(act) => screen.acts[act]()}
        onOpenDocument={screen.openDocument}
        onOpenVersions={screen.openVersions}
        onOpenLinks={screen.openLinks}
        onOpenFollowUp={screen.openFollowUp}
        onThank={() => screen.open('thank')}
        onCrewMessage={() => screen.open('crew')}
        focusAfter={room}
      />
      {(['share', 'thank', 'crew'] as const).map((kind) => (
        <MessageSheet
          key={kind}
          open={screen.sheet === kind}
          onClose={screen.close}
          words={sheetWords(kind)}
          message={screen.message}
          notice={
            kind === 'share' && screen.withoutTaxNumber && detail !== null && taxName !== null
              ? taxNumberNoticeOf(t, taxName, detail, screen)
              : null
          }
          pending={screen.sheet === kind ? screen.pending : null}
          failure={screen.sheet === kind ? proposalActFailureWords(t, screen.failure) : null}
          onShare={screen.share}
          onCopy={screen.copy}
          {...(kind === 'share' ? { onPdf: screen.getPdf } : {})}
        />
      ))}
      <OneToast
        fact={screen.said ?? pdfSaid(screen) ?? (screen.withdraw.done ? WITHDRAWN : null)}
        line={(fact) => {
          if (fact.kind === 'withdrawn') return { tone: 'success', title: said.withdrawn };
          if (fact.kind === 'pdf') {
            return { tone: 'warning', title: fact.late ? said.pdfLate : said.pdfFailed };
          }
          if (fact.kind === 'message_copied') {
            return { tone: 'success', title: shareToastWords(t, '').messageCopied };
          }
          if (fact.kind === 'not_copied') return { tone: 'warning', title: said.notCopied };
          const toast = shareToastWords(
            t,
            fact.followUpOn === null ? null : format.date(fact.followUpOn),
          );
          return { tone: 'success', title: fact.kind === 'shared' ? toast.shared : toast.copied };
        }}
        onDismiss={screen.dismissSaid}
        focusAfter={room}
      />
    </div>
  );
}

type T = ReturnType<typeof useProposalFormats>['t'];

/** The first send with no tax number: who may add it is offered *Add it* (`M01-24`, `M06-17`). */
function taxNumberNoticeOf(
  t: T,
  taxName: string,
  detail: NonNullable<Extract<TrackView['read'], { kind: 'ready' }>['value']>,
  screen: TrackView,
) {
  const mayAdd = detail.rights.writesCompanyFacts;
  const notice = taxNumberNoticeWords(t, {
    taxName,
    mayAdd,
    ownerName: detail.companyFactsBy?.name ?? null,
  });
  return {
    title: notice.title,
    line: notice.line,
    ...(mayAdd ? { act: { label: notice.add, onPress: screen.addTaxNumber } } : {}),
  };
}

const WITHDRAWN = { kind: 'withdrawn' } as const;

/** A PDF that is late or did not come says so once, where the toast is. */
function pdfSaid(screen: TrackView): { readonly kind: 'pdf'; readonly late: boolean } | null {
  const { kind } = screen.pdf.file;
  if (kind === 'late') return { kind: 'pdf', late: true };
  if (kind === 'unread') return { kind: 'pdf', late: false };
  return null;
}

/** The view model's moves, performed by the web. */
function trackMovesOf(moves: ProposalMoves) {
  return {
    toBuilder: moves.toBuilder,
    toDocument: (proposalId: string) => moves.toDocument(proposalId),
    toVersions: moves.toVersions,
    toLinks: moves.toLinks,
    toLead: moves.toLeadWon,
    toProject: moves.toProject,
    callLead: moves.callLead,
    dial: moves.dial,
    openChat: moves.openChat,
    copy: moves.copy,
    openFile: moves.openFile,
    toTaxNumber: moves.toTaxNumber,
  };
}

/**
 * `?share=1` opens the share sheet once the proposal is read and the reader may share — only once.
 * The mark leaves the address once the proposal is read either way.
 */
function useShareOnArrival(
  share: boolean,
  proposalId: string,
  screen: TrackView,
  moves: ProposalMoves,
) {
  const handled = useRef(false);
  const read = screen.read.kind === 'ready';
  const mayShare = read && screen.read.value.rights.share;
  const open = useRef(screen.open);
  open.current = screen.open;
  const drop = useRef(moves.dropShareMark);
  drop.current = moves.dropShareMark;
  useEffect(() => {
    if (!share || !read || handled.current) return;
    handled.current = true;
    if (mayShare) open.current('share');
    // The link has done its job: a reload shows the page, not the sheet again.
    drop.current(proposalId);
  }, [share, read, mayShare, proposalId]);
}
