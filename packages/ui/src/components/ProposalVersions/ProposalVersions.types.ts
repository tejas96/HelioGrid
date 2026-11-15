import type {
  ProposalVersion,
  ProposalVersionSummary,
  TranslatedText,
  VersionInForcePreview,
} from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { AfterSummaryRow } from '../ProposalAfterParts/ProposalAfterParts.types';

/** One fact that moved between two versions, as its row prints it. */
export interface VersionChangeWords {
  readonly name: TranslatedText;
  /** The old and the new value, in the reader's form — a figure, or words. */
  // biome-ignore lint/plugin/copy-prop-type: a value — a figure the market format printed, or the server's own name
  readonly from: string;
  // biome-ignore lint/plugin/copy-prop-type: a value — a figure the market format printed, or the server's own name
  readonly to: string;
}

/** The versions screen's words — `@heliogrid/i18n`'s `proposalVersionsWords`, by shape. */
export interface ProposalVersionsWords {
  /** "What changed in version 2". */
  readonly changedTitle: (version: number) => TranslatedText;
  /** The change note in the person's own words, quoted — "“Anil asked for 5 kW.”". */
  readonly note: (note: string) => TranslatedText;
  /** Who made it, when, and what the customer sees of it — the plan in force once `won`. */
  readonly whoLine: (version: ProposalVersionSummary, won: boolean) => TranslatedText;
  readonly change: (
    change: NonNullable<ProposalVersion['diff']>['changes'][number],
  ) => VersionChangeWords;
  /** "7 other pages did not change". */
  readonly unchanged: (pages: number) => TranslatedText;
  /** "v2" — a version's short mark. */
  readonly mark: (version: number) => TranslatedText;
  readonly versionTitle: (version: ProposalVersionSummary) => TranslatedText;
  readonly versionLine: (version: ProposalVersionSummary) => TranslatedText;
  readonly share: TranslatedText;
  readonly view: TranslatedText;
  readonly putInForce: TranslatedText;
  /** A version that was sent never changes — or, after Won, how a newer one is agreed. */
  readonly hint: (won: boolean) => TranslatedText;
  readonly none: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/** What the screen reads: every version newest first, and the newest one with what moved in it. */
export interface ProposalVersionsView {
  readonly versions: readonly ProposalVersionSummary[];
  /** The newest version, frozen, with its change note and its diff against the one before. */
  readonly latest: ProposalVersion | null;
}

/**
 * **A proposal's versions** (`SCR-M06-16`, `M06-42`): the change note first, in the words the
 * person wrote; then only the facts that moved, each old value → new value, and one line for the
 * pages that did not change; then a row per version with its state, and Share or View — or, on a
 * won deal, *Put in force* for a newer version the customer agreed to (`M08-50`).
 */
export interface ProposalVersionsProps {
  readonly read: Exclude<Read<ProposalVersionsView>, { readonly kind: 'empty' }>;
  readonly words: ProposalVersionsWords;
  /** The deal is won: the link takes no new answer, so a newer version is put in force by a person. */
  readonly won: boolean;
  readonly mayShare: boolean;
  readonly mayPutInForce: boolean;
  readonly onShare: (version: number) => void;
  readonly onView: (version: number) => void;
  readonly onPutInForce: (version: number) => void;
  readonly focusAfter: FocusAfter;
}

/** *Put version N in force*'s words, the preview's figures already printed in them. */
export interface PutInForceWords {
  readonly title: TranslatedText;
  readonly close: TranslatedText;
  /** New total, already paid, still to collect — and a surplus where more was collected. */
  readonly summary: (preview: VersionInForcePreview) => readonly AfterSummaryRow[];
  /** "New plan for what is left". */
  readonly planTitle: TranslatedText;
  /** One part's words; `plan` is the whole column, whose amounts share one form. */
  readonly part: (
    part: VersionInForcePreview['plan'][number],
    plan: VersionInForcePreview['plan'],
  ) => {
    readonly name: TranslatedText;
    /** When it falls: "Paid 14 Nov · receipt kept", "Before dispatch · 60% of what is left". */
    readonly line: TranslatedText | null;
    readonly state: TranslatedText | null;
    // biome-ignore lint/plugin/copy-prop-type: a figure, printed by the market format
    readonly amount: string;
  };
  readonly hint: TranslatedText;
  /** "Yes, Anil agreed". */
  readonly confirm: TranslatedText;
  /** "Your name and the time are recorded". */
  readonly recorded: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/**
 * **Put a version in force** (`M08-50`, `M11-14`): before the person confirms that the customer
 * agreed, the sheet shows the new total, what is already paid and stays, what is left, and the new
 * plan for what is left. Every receipt is kept; a surplus is stated, never hidden.
 */
export interface PutInForceSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: PutInForceWords;
  readonly preview: Exclude<Read<VersionInForcePreview>, { readonly kind: 'empty' }>;
  readonly sending: boolean;
  readonly failure: TranslatedText | null;
  readonly onConfirm: () => void;
}
