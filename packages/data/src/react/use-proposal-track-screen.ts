'use client';
import type { ComposedMessage, ProposalDocument } from '@heliogrid/contracts';
import { type Read, versionAwaitingShare, versionsOnLink } from '@heliogrid/domain';
import { useEffect, useRef, useState } from 'react';
import { chatOrCopy } from './chat-or-copy';
import type { ProposalActFailure } from './proposal-cache';
import { useCrewMessageDue } from './use-crew-message-due';
import type { MadeFileRead } from './use-made-file';
import { type ProposalRead, useProposal } from './use-proposal';
import { useCrewMessage } from './use-proposal-hand-off';
import { documentRead } from './use-proposal-reader-screen';
import { type ShareChannel, useProposalShare } from './use-proposal-share';
import { useProposalVersions } from './use-proposal-versions';

/** The sheet standing over the track screen. */
export type TrackSheet = 'share' | 'thank' | 'crew';

/**
 * Where the track screen leads and what the device does for it — the app's adapter (the router,
 * the dialler, the chat picker, the clipboard, a file opened). The hook decides WHEN; the adapter
 * only performs.
 */
export interface ProposalTrackMoves {
  toBuilder(proposalId: string): void;
  toDocument(proposalId: string): void;
  toVersions(proposalId: string): void;
  toLinks(proposalId: string): void;
  /** The lead, where its open task is worked and *Mark won* stands. */
  toLead(leadId: string): void;
  toProject(projectId: string): void;
  /** The lead's page, whose dialler answers a customer who may not be dialled here. */
  callLead(leadId: string): void;
  /** Hands the customer's number to the device's dialler — the shipped `tel:` move. */
  dial(phoneE164: string): void;
  /**
   * Opens the customer's chat with the words typed — the person picks the chat and sends. Called
   * only with a chat address; a market with no chat app copies the words (`chatOrCopy`).
   */
  openChat(message: ComposedMessage): void;
  /** Copies the text; `copied` runs once it is on the clipboard, `notCopied` when the device refuses. */
  copy(text: string, copied: () => void, notCopied: () => void): void;
  /** Opens a stored file — the PDF — where the device opens one. */
  openFile(url: string): void;
  /** The company profile's tax part, for the first send's *Add it* (`M01-24`). */
  toTaxNumber(): void;
}

/** What the last hand-off left to say: a toast, said once. */
export type TrackSaid =
  | { readonly kind: 'shared'; readonly followUpOn: string | null }
  | { readonly kind: 'link_copied'; readonly followUpOn: string | null }
  | { readonly kind: 'message_copied' }
  /** The device refused the clipboard: the person copies it by hand. */
  | { readonly kind: 'not_copied' };

type MessageRead = Exclude<Read<ComposedMessage>, { readonly kind: 'empty' }>;

export interface ProposalTrackScreen {
  /** The proposal, its four-step line dated for the version shown. */
  readonly read: ProposalRead;
  /**
   * The document the cover and the summary show: what the customer's link serves — the latest
   * shared version — else the latest generated, so a later draft edit never moves them; a draft
   * never generated shows its own (`M06-45`).
   */
  readonly shown: Exclude<Read<ProposalDocument>, { readonly kind: 'empty' }>;
  /** A newer version generated and not yet shared, offered with its own act; `null` when none waits. */
  readonly awaitingShare: number | null;
  /** The evening-before installation message is due on the project (`F5-68`). */
  readonly crewMessageDue: boolean;
  /** The first send goes out with no tax number (`M01-24`): the share sheet says so. */
  readonly withoutTaxNumber: boolean;
  /** The hero's acts, by name: each does the one thing its standing offers. */
  readonly acts: {
    readonly continue: () => void;
    readonly share: () => void;
    readonly share_again: () => void;
    /** Shares the version that waits (`awaitingShare`). */
    readonly share_ready: () => void;
    readonly call: () => void;
    readonly new_version: () => void;
    readonly confirm_won: () => void;
    readonly open_project: () => void;
  };
  readonly sheet: TrackSheet | null;
  open(sheet: TrackSheet): void;
  close(): void;
  /** The share sheet's own state: the composed words, the act out, why the last did not land. */
  readonly message: MessageRead;
  readonly pending: 'share' | 'copy' | 'pdf' | null;
  readonly failure: ProposalActFailure | null;
  /** Share on WhatsApp: the first one mints the link, so the chat opens on its answer. */
  share(message: ComposedMessage): void;
  /** Copy link on a share; copy the words on a thank-you or a crew message. */
  copy(message: ComposedMessage): void;
  /** The latest version's PDF: asked for, then opened once it is made. */
  readonly pdf: MadeFileRead;
  getPdf(): void;
  readonly said: TrackSaid | null;
  dismissSaid(): void;
  openDocument(): void;
  openVersions(): void;
  openLinks(): void;
  openFollowUp(): void;
  addTaxNumber(): void;
  /** *Withdraw* (`M06-58`): asked once in its sheet; its link then says it is no longer active. */
  readonly withdraw: {
    readonly asking: boolean;
    ask(): void;
    close(): void;
    confirm(): void;
    readonly sending: boolean;
    readonly failure: ProposalActFailure | null;
    /** The proposal was withdrawn in this visit: the screen says so once. */
    readonly done: boolean;
  };
}

const NO_VERSION = null;

/**
 * A proposal after it is built (`SCR-M06-18`, `T-M06-018`): the one read, the share sheet with its
 * hand-off, the thank-you after an Accept and the evening-before crew message. A share is recorded
 * by the act itself — the first Share on WhatsApp or Copy link — and nothing claims a delivery
 * (`M06-53`, `F5-28`).
 */
export function useProposalTrackScreen(
  proposalId: string,
  moves: ProposalTrackMoves,
): ProposalTrackScreen {
  const read = useProposal(proposalId);
  const detail = read.kind === 'ready' ? read.value : null;
  const [sheet, setSheet] = useState<TrackSheet | null>(null);
  const [said, setSaid] = useState<TrackSaid | null>(null);
  const [asksWithdraw, setAsksWithdraw] = useState(false);
  const share = useProposalShare(proposalId, {
    share: sheet === 'share',
    acceptance: sheet === 'thank',
  });
  const projectId = detail?.project?.id ?? '';
  const crew = useCrewMessage(projectId, sheet === 'crew');
  const crewDue = useCrewMessageDue(projectId);
  const latest = detail?.versions[0]?.version ?? NO_VERSION;
  const versions = useProposalVersions(proposalId, latest);
  const onLink = onLinkOf(read);
  const shownRead = useProposalVersions(proposalId, onLink.shown);
  /* A first share has no link until its answer: the hand-off waits for it. */
  const waiting = useRef<ShareChannel | null>(null);
  const latestMoves = useRef(moves);
  latestMoves.current = moves;

  const { shared } = share;
  useEffect(() => {
    const channel = waiting.current;
    if (shared === null || channel === null) return;
    waiting.current = null;
    const { message, followUpOn } = shared;
    if (channel === 'whatsapp') {
      chatOrCopy(latestMoves.current, message, {
        chatted: () => setSaid({ kind: 'shared', followUpOn }),
        copied: () => setSaid({ kind: 'message_copied' }),
        notCopied: () => setSaid({ kind: 'not_copied' }),
      });
    } else {
      latestMoves.current.copy(
        message.link ?? message.text,
        () => setSaid({ kind: 'link_copied', followUpOn }),
        () => setSaid({ kind: 'not_copied' }),
      );
    }
    setSheet(null);
  }, [shared]);

  const { withdrawn } = share;
  useEffect(() => {
    if (withdrawn) setAsksWithdraw(false);
  }, [withdrawn]);

  const record = (channel: ShareChannel) => {
    waiting.current = channel;
    share.share(channel);
  };
  const message: MessageRead =
    sheet === 'crew'
      ? crew
      : ((sheet === 'thank' ? share.acceptance : share.message) ?? { kind: 'loading' });
  const leadId = detail?.lead.id ?? '';
  const openSheet = (next: TrackSheet) => {
    share.clear();
    setSheet(next);
  };
  return {
    read: datedFor(read, onLink.shown),
    shown: documentRead(read, onLink.shown, shownRead.version),
    awaitingShare: onLink.awaitingShare,
    crewMessageDue: crewDue,
    withoutTaxNumber: detail?.missingCompanyFacts.includes('tax_registration') === true,
    acts: {
      continue: () => moves.toBuilder(proposalId),
      share: () => openSheet('share'),
      share_again: () => openSheet('share'),
      share_ready: () => openSheet('share'),
      call: () => {
        const phone = detail?.lead.customerPhoneE164 ?? null;
        // A do-not-call or wrong-number customer gets no dial offer anywhere (`M02-44`).
        if (phone !== null && detail?.lead.canDial === true) moves.dial(phone);
        else moves.callLead(leadId);
      },
      new_version: () => moves.toBuilder(proposalId),
      confirm_won: () => moves.toLead(leadId),
      open_project: () => {
        if (projectId !== '') moves.toProject(projectId);
      },
    },
    sheet,
    open: openSheet,
    close: () => {
      if (share.sharing) return;
      setSheet(null);
    },
    message,
    pending: share.sharing
      ? waiting.current === 'copy_link'
        ? 'copy'
        : 'share'
      : versions.pdf.file.kind === 'making'
        ? 'pdf'
        : null,
    failure: asksWithdraw ? null : share.failure,
    share: (composed) => {
      if (sheet !== 'share') {
        chatOrCopy(moves, composed, {
          chatted: () => undefined,
          copied: () => setSaid({ kind: 'message_copied' }),
          notCopied: () => setSaid({ kind: 'not_copied' }),
        });
        return;
      }
      record('whatsapp');
    },
    copy: (composed) => {
      if (sheet !== 'share') {
        moves.copy(
          composed.text,
          () => setSaid({ kind: 'message_copied' }),
          () => setSaid({ kind: 'not_copied' }),
        );
        return;
      }
      record('copy_link');
    },
    pdf: versions.pdf,
    getPdf: () => versions.pdf.get(moves.openFile),
    said,
    dismissSaid: () => setSaid(null),
    /* A draft never generated has no document of its own yet: its pages are the builder's stage. */
    openDocument: () =>
      latest === NO_VERSION ? moves.toBuilder(proposalId) : moves.toDocument(proposalId),
    openVersions: () => moves.toVersions(proposalId),
    openLinks: () => moves.toLinks(proposalId),
    openFollowUp: () => moves.toLead(leadId),
    addTaxNumber: moves.toTaxNumber,
    withdraw: {
      asking: asksWithdraw,
      ask: () => {
        share.clear();
        setAsksWithdraw(true);
      },
      close: () => {
        if (share.withdrawing) return;
        setAsksWithdraw(false);
      },
      confirm: share.withdraw,
      sending: share.withdrawing,
      failure: asksWithdraw ? share.failure : null,
      done: share.withdrawn,
    },
  };
}

/** What the customer's link serves of the proposal read, and the newer version waiting behind it. */
function onLinkOf(read: ProposalRead) {
  if (read.kind !== 'ready') return { shown: null, awaitingShare: null };
  const { standing, versions } = read.value;
  return {
    shown: versionsOnLink(versions).shown,
    awaitingShare: versionAwaitingShare(standing, versions),
  };
}

/** The proposal with its Generated time taken from the version shown, never a newer one not yet sent. */
function datedFor(read: ProposalRead, version: number | null): ProposalRead {
  const generatedAt =
    read.kind === 'ready'
      ? read.value.versions.find((one) => one.version === version)?.generatedAt
      : undefined;
  if (read.kind !== 'ready' || generatedAt === undefined) return read;
  return { ...read, value: { ...read.value, tracking: { ...read.value.tracking, generatedAt } } };
}
