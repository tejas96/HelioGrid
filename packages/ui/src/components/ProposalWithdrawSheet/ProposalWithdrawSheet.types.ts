import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { AfterSummaryRow } from '../ProposalAfterParts/ProposalAfterParts.types';

/** The Withdraw sheet's words for one proposal — `proposalWithdrawWords`, by shape. */
export interface ProposalWithdrawWords {
  /** "Withdraw PRP-0040?" */
  readonly title: TranslatedText;
  /** Who made it, its size and price, and where it stands. */
  readonly summary: readonly AfterSummaryRow[];
  /** What its link will show, and who is told. */
  readonly hint: TranslatedText;
  readonly confirm: TranslatedText;
  /** "Nothing is deleted. It stays in the lead's history." */
  readonly note: TranslatedText;
}

/**
 * **Withdraw one of two proposals** (`M06-58`, `T-M06-031`): the sheet shows that proposal's maker,
 * size, price and state, says what its link will show, and withdraws on confirm. A person does
 * this; nothing withdraws by itself.
 */
export interface ProposalWithdrawSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** The sheet's close, spoken — "Close". */
  readonly close: TranslatedText;
  /** `null` while no proposal is chosen: the sheet is then closed. */
  readonly words: ProposalWithdrawWords | null;
  readonly sending: boolean;
  readonly failure: TranslatedText | null;
  readonly onConfirm: () => void;
  /**
   * Where focus lands once the withdraw has gone through: the sheet closes, and the act that opened
   * it may go with the proposal (two live proposals become one).
   */
  readonly focusAfter: FocusAfter;
}
