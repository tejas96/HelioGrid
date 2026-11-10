import type { TranslatedText } from '@heliogrid/contracts';
import type { WaitingLead, WaitingLeadWords } from '../LeadDeckCard/LeadDeckCard.types';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';

/** Every word a queued lead says, built in `@heliogrid/i18n` (`leadInboxWords`). */
export interface LeadTileWords extends WaitingLeadWords {
  /** "Assign Priya Sharma", or "Assign this lead" with no name. */
  assign: (name: string | null) => TranslatedText;
  /** "Junk Priya Sharma". */
  junk: (name: string | null) => TranslatedText;
  /** "Select Priya Sharma". */
  select: (name: string | null) => TranslatedText;
  /** "Open Priya Sharma". */
  open: (name: string | null) => TranslatedText;
}

/** `row`: one row of the phone's Up next card (`CardRows`) · `tile`: one tile of the desktop's grid. */
export type LeadTileForm = 'row' | 'tile';

/**
 * **A lead waiting under the deck** (`SCR-M02-02`, `M02-24`): only what the decision needs — name,
 * city, source, age and the bill when known — and the two decisions, each one tap: assign (the
 * picker) and junk. Its act's line sits in it while out or when back undone (`M02-67`); every
 * other lead stays operable. In a selection it carries the tick a bulk assign reads (`M02-29`).
 */
export interface LeadTileProps {
  lead: WaitingLead;
  /** The source's word (`leadSourceWord`). */
  sourceLabel: TranslatedText;
  form: LeadTileForm;
  /** A row's place in its card: the first draws no hairline above it. */
  first: boolean;
  /** The tick shows instead of the acts — always on a tile, in Select on a row. */
  selecting: boolean;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  /** Opens the lead's detail; absent, nothing opens. */
  onOpen?: () => void;
  /** Opens the picker for this lead; absent when the reader may not assign. */
  onAssign?: () => void;
  /** Bins the lead; absent when the reader may not. */
  onJunk?: () => void;
  /** The act out on this lead, or back undone with its reason. */
  pending?: PendingActionSpec;
  /** This lead's act is out: its own acts and tick wait. */
  waiting: boolean;
  words: LeadTileWords;
}

/** The bar a selection raises: how many, and the one act a selection takes — assign (`M02-29`). */
export interface LeadSelectionBarProps {
  count: number;
  onAssign: () => void;
  onClear: () => void;
  words: {
    /** "3 selected". */
    selected: (count: number) => TranslatedText;
    /** "Assign". */
    assign: TranslatedText;
    /** "Clear selection". */
    clear: TranslatedText;
  };
}
