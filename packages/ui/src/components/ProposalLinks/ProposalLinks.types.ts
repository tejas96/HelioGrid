import type { CustomerLink, CustomerLinks, TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';

/** A link's act: copy its address, give it a new address, or turn it off. */
export type ProposalLinkAct = 'copy' | 'remint' | 'revoke';

/** The links screen's words — `@heliogrid/i18n`'s `proposalLinksWords`, by shape. */
export interface ProposalLinksWords {
  /** "Active" or "Off": a mark and a word, never a tint alone. */
  readonly status: (link: CustomerLink) => TranslatedText;
  /** Who the link is for — the contact's name, or that nobody was named. */
  readonly who: (link: CustomerLink) => TranslatedText;
  /** What happened on it: opened how often and when last, not opened yet, or turned off when. */
  readonly line: (link: CustomerLink) => TranslatedText;
  /** Each act's spoken name, with the link's label — "Copy the link for Sunita". */
  readonly act: (act: ProposalLinkAct, label: string) => TranslatedText;
  /** "The customer's page shows none of this…" (`F5-30`). */
  readonly hint: TranslatedText;
  readonly noneTitle: TranslatedText;
  readonly noneLine: TranslatedText;
  /** Turn off asks once: its title with the label, what happens, and the two answers. */
  readonly confirmTitle: (label: string) => TranslatedText;
  readonly confirmLine: TranslatedText;
  readonly confirmYes: TranslatedText;
  readonly confirmNo: TranslatedText;
  readonly close: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/**
 * **The deal's named links** (`SCR-M06-20`, `F5-30`): one card per link with its label, who it is
 * for, its state and its last open; a live link offers Copy, a new address and Turn off — which
 * asks once and then stops the link at once, with no way back — and a line says the customer's page
 * shows none of this.
 */
export interface ProposalLinksProps {
  readonly read: Exclude<Read<CustomerLinks>, { readonly kind: 'empty' }>;
  readonly words: ProposalLinksWords;
  /** The act that is out, on which link. */
  readonly pending: { readonly linkId: string; readonly act: ProposalLinkAct } | null;
  /** Why an act did not land, said on its own card. */
  readonly failure: { readonly linkId: string; readonly reason: TranslatedText } | null;
  /** The link whose Turn off is being asked about. */
  readonly confirming: string | null;
  readonly onCopy: (linkId: string) => void;
  readonly onRemint: (linkId: string) => void;
  readonly onAskRevoke: (linkId: string) => void;
  readonly onRevoke: (linkId: string) => void;
  readonly onCancelRevoke: () => void;
  readonly focusAfter: FocusAfter;
}

export interface NewLinkWords {
  readonly title: TranslatedText;
  readonly close: TranslatedText;
  readonly who: TranslatedText;
  readonly whoPlaceholder: TranslatedText;
  /** The choice that names nobody — "Someone else". */
  readonly nobody: TranslatedText;
  readonly label: TranslatedText;
  /** "Only you see it". */
  readonly labelHelper: TranslatedText;
  readonly labelNeeded: TranslatedText;
  /** "When this person accepts, the record says which link was used." */
  readonly hint: TranslatedText;
  /** "Make link and copy". */
  readonly make: TranslatedText;
}

/** What *New link* sends: who it is for, where known, and the name only the company sees. */
export interface NewLinkDraft {
  readonly contactId: string | null;
  // biome-ignore lint/plugin/copy-prop-type: the link's own name as the person types it, a fact
  readonly label: string;
}

/**
 * **A named link for another person on the deal** (`F5-26`): who it is for, and the name of the
 * link, which only the company sees; its address is copied once it is made.
 */
export interface NewLinkSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: NewLinkWords;
  readonly contacts: CustomerLinks['contacts'];
  readonly draft: NewLinkDraft;
  readonly onChange: (draft: NewLinkDraft) => void;
  readonly sending: boolean;
  readonly failure: TranslatedText | null;
  readonly onMake: (draft: NewLinkDraft) => void;
}
