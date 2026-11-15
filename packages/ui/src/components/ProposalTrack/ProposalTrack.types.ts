import type { ProposalDetail, ProposalTracking, TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ProposalReaderDocument } from '../ProposalReader/ProposalReader.types';

/** The one next act a standing offers (`T-M06-018`), and the second some standings add. */
export type TrackAct =
  | 'continue'
  | 'share'
  | 'share_again'
  /** Shares the newer version generated while the link still serves an older one. */
  | 'share_ready'
  | 'call'
  | 'new_version'
  | 'confirm_won'
  | 'open_project';

/** A row under the hero: what it is about. */
export type TrackRowKind = 'follow_up' | 'thank' | 'crew' | 'version' | 'links' | 'document';

export interface TrackLineWords {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
}

/** One step of Generated → Shared → Opened → Answered: its name and when, or "Not yet". */
export interface TrackNodeWords {
  readonly name: TranslatedText;
  readonly when: TranslatedText;
}

/** The track screen's words — `@heliogrid/i18n`'s `proposalTrackWords`, by shape. */
export interface ProposalTrackWords {
  /** The hero's spoken name — "Proposal status". */
  readonly heroName: TranslatedText;
  readonly standing: (standing: string) => TranslatedText;
  /** One sentence that says what happened, and one that says what to do. */
  readonly story: (detail: ProposalDetail) => TrackLineWords;
  readonly act: (act: TrackAct, detail: ProposalDetail) => TranslatedText;
  /** The cover's spoken name — "Open the document". */
  readonly openDocument: TranslatedText;
  /** The four steps' spoken name — "What happened". */
  readonly trackName: TranslatedText;
  readonly nodes: (tracking: ProposalTracking) => readonly TrackNodeWords[];
  /** "HelioGrid shows when the link is opened. It never claims that a message was delivered." */
  readonly neverDelivered: TranslatedText;
  readonly row: (
    kind: TrackRowKind,
    detail: ProposalDetail,
    sheets: number | null,
  ) => TrackLineWords;
  /** Sharing is refused: the title over the server's own reason, and the act that corrects it. */
  readonly blockedTitle: TranslatedText;
  /** The server's reason (`shareBlockedBy`: stale, recomputing, unchecked) in words. */
  readonly blockedLine: (kind: string) => TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/**
 * **A proposal after it is built** (`SCR-M06-18`, `T-M06-018`): a hero with its standing as a mark
 * and a word, one sentence that says what happened, the one next act for that standing and the
 * cover, which opens the document; under it Generated → Shared → Opened → Answered, each with its
 * time, and the line that only opens are shown; then rows for the open task, the version, the links
 * and the document. Nothing here claims a delivery (`F5-28`).
 */
export interface ProposalTrackProps {
  readonly read: Exclude<Read<ProposalDetail>, { readonly kind: 'empty' }>;
  readonly words: ProposalTrackWords;
  /** The version Track shows — the one on the customer's link — whose sheets the document row counts. */
  readonly shown: ProposalReaderDocument | null;
  /** The cover page, drawn by the caller (`ScaledProposalPage`) at the width `coverWidth` names. */
  readonly cover?: ReactNode;
  /** The evening-before installation message is due on the project (`F5-68`). */
  readonly crewMessageDue: boolean;
  /** The act that is out: every act is inert until it answers. */
  readonly pending: TrackAct | null;
  /** Why the last act did not land, said under the acts. */
  readonly failure: TranslatedText | null;
  readonly onAct: (act: TrackAct) => void;
  readonly onOpenDocument: () => void;
  readonly onOpenVersions: () => void;
  readonly onOpenLinks: () => void;
  /** Opens the open proposal task where the person works it (My Day, or the lead). */
  readonly onOpenFollowUp: () => void;
  readonly onThank: () => void;
  readonly onCrewMessage: () => void;
  readonly focusAfter: FocusAfter;
}
