import type { ComposedMessage, TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { AfterSummaryRow } from '../ProposalAfterParts/ProposalAfterParts.types';

/** The sheet's words — the share sheet's, the thank-you's or the crew message's, by shape. */
export interface MessageSheetWords {
  readonly title: TranslatedText;
  readonly close: TranslatedText;
  /** The bubble's spoken name, and the note under the words — "Written for you…". */
  readonly bubbleName: TranslatedText;
  readonly note: TranslatedText;
  /** Where the link goes before the first share makes one; absent where the message has no link. */
  readonly linkToCome?: TranslatedText;
  /** The main act — "Share on WhatsApp". */
  readonly share: TranslatedText;
  /** "Copy link" on a proposal's share, "Copy message" elsewhere. */
  readonly copy: TranslatedText;
  /** "Get PDF"; absent where the message has no document. */
  readonly pdf?: TranslatedText;
  /** What the act does and does not do: the person picks the chat and sends. */
  readonly hint: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/** A warning above the message — the first send with no tax number (`M01-24`, `M01-29`). */
export interface MessageSheetNotice {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  /** *Add it*: only for who may write the company's facts. */
  readonly act?: { readonly label: TranslatedText; readonly onPress: () => void };
}

/** Which act is out. */
export type MessageSheetAct = 'share' | 'copy' | 'pdf';

/**
 * **A composed message, ready for a person to send** (`M06-53`, `F5-48`, `F5-68`): the words as a
 * bubble, *Share on WhatsApp* as the main act, a copy and — for a proposal — its PDF under it, and
 * the line that the person picks the chat and sends. One sheet for the proposal's share, the
 * thank-you after an Accept and the evening-before crew message. It sends nothing itself and
 * claims no delivery: the acts are the caller's hand-off (the web's clipboard, the phone's share).
 */
export interface MessageSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: MessageSheetWords;
  readonly message: Exclude<Read<ComposedMessage>, { readonly kind: 'empty' }>;
  readonly notice?: MessageSheetNotice | null;
  /** Facts drawn above the message — the installation day's four. */
  readonly facts?: readonly AfterSummaryRow[];
  readonly pending: MessageSheetAct | null;
  /** Why the last act did not land, said above the acts. */
  readonly failure: TranslatedText | null;
  readonly onShare: (message: ComposedMessage) => void;
  readonly onCopy: (message: ComposedMessage) => void;
  readonly onPdf?: () => void;
}
