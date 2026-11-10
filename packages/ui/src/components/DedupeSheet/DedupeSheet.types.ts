import type { TranslatedText } from '@heliogrid/contracts';
import type { DedupeChoice, LeadStage } from '@heliogrid/domain';
import type { StageTrackWords } from '../StageTrack/StageTrack.types';

/**
 * The record a number already belongs to, as the sheet may show it (`M02-08`): one the person may
 * open shows who it is; one outside their scope shows nothing of itself — only the three facts.
 */
export type DedupeSheetRecord =
  | {
      readonly kind: 'visible';
      /** The customer's name and city as typed — facts; `null` draws its named gap. */
      readonly name: string | null;
      readonly city: string | null;
    }
  | { readonly kind: 'out_of_scope' };

/**
 * The choice the caller sent and is waiting on, or that came back undone with the sentence saying
 * so — drawn under that choice. While one waits, every choice and every way out waits.
 */
export type DedupeSheetAct =
  | { readonly state: 'waiting'; readonly choice: DedupeChoice }
  | { readonly state: 'failed'; readonly choice: DedupeChoice; readonly reason: TranslatedText };

/** A choice's title and the one line under it (each act carries one line). */
export interface DedupeChoiceWords {
  title: TranslatedText;
  line: TranslatedText;
}

/** Every word the sheet says, built in `@heliogrid/i18n` (`dedupeSheetWords`) over its facts. */
export interface DedupeSheetWords {
  /** "This number is already here". */
  heading: TranslatedText;
  /** "+91 98220 41234 matches a lead. Nothing is saved yet." */
  intro: TranslatedText;
  close: TranslatedText;
  /** The record outside the person's scope — "A lead outside your list" and why nothing shows. */
  outsideTitle: TranslatedText;
  outsideLine: TranslatedText;
  noName: TranslatedText;
  noCity: TranslatedText;
  ownerLabel: TranslatedText;
  stageLabel: TranslatedText;
  lastContactLabel: TranslatedText;
  /** The owner fact while the lead waits unassigned — "No owner yet". */
  noOwner: TranslatedText;
  /** The stage's word (`M02-41`). */
  stage: TranslatedText;
  /** "4 days ago", or "Not contacted yet". */
  lastContact: TranslatedText;
  stageTrack: StageTrackWords;
  /** Open existing — or, outside the person's scope, "Ask Rajesh to share it" (`M02-08`). */
  openExisting: DedupeChoiceWords;
  logEnquiry: DedupeChoiceWords;
  keepBoth: DedupeChoiceWords;
  /** "Why keep both?" and its example. */
  reasonLabel: TranslatedText;
  reasonPlaceholder: TranslatedText;
  /** The reason box's confirm — asleep until a reason is typed. */
  keepBothConfirm: TranslatedText;
  /** "Close this and nothing is created." (`M02-09`). */
  nothingCreated: TranslatedText;
  /** The line under a choice while its act waits — "Logging the enquiry…". */
  waiting: Readonly<Record<DedupeChoice, TranslatedText>>;
}

/**
 * The duplicate sheet (`M02-08`, `M02-09`, `M02-66`): the record a typed number already belongs
 * to, its three facts — owner, stage, last contact — and exactly three choices, each with one line
 * under it: *Open existing* (an ask to the owner when the record is outside the person's scope),
 * *Log enquiry on it*, and *Keep both leads*, which opens a reason box whose confirm sleeps until
 * a reason is typed. Dismissing it creates nothing. Whether *Keep both* is offered is the caller's
 * (`crm.dedupe_override`); so is whether an act is out and how it came back.
 */
export interface DedupeSheetProps {
  open: boolean;
  /** Backdrop, Esc, close or drag: nothing is created. Refused while an act waits. */
  onClose: () => void;
  record: DedupeSheetRecord;
  /** The existing lead's owner by name — a fact; `null` while it waits unassigned. */
  ownerName: string | null;
  stage: LeadStage;
  /** The person holds `crm.dedupe_override`; without it the third choice is not drawn. */
  canKeepBoth: boolean;
  act: DedupeSheetAct | null;
  /** Opens the record — or asks its owner, when `record` is outside the person's scope. */
  onOpenExisting: () => void;
  onLogEnquiry: () => void;
  /** The reason as typed, trimmed and never empty. */
  onKeepBoth: (reason: string) => void;
  words: DedupeSheetWords;
}

/** One of the sheet's choices as both halves draw it (`DedupeChoice`). */
export interface DedupeChoiceProps extends Pick<DedupeSheetProps, 'record' | 'words'> {
  choice: DedupeChoice;
  choiceWords: DedupeChoiceWords;
  act: DedupeSheetAct | null;
  onPress: () => void;
  /** *Keep both* opens its reason box: the row says whether it is open. */
  expanded?: boolean;
}

/** *Keep both*'s reason box as both halves draw it (`DedupeKeepBoth`). */
export interface DedupeKeepBothProps {
  // biome-ignore lint/plugin/copy-prop-type: the reason as the person typed it — a fact, never copy
  reason: string;
  onReason: (typed: string) => void;
  onConfirm: (reason: string) => void;
  act: DedupeSheetAct | null;
  words: DedupeSheetWords;
}
