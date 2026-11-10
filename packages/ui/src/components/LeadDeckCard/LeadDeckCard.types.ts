import type { TranslatedText } from '@heliogrid/contracts';
import type { InboxActReturn, InboxActState, LeadSource, ProvenanceTier } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { LeadAgeWords } from '../LeadAge/LeadAge.types';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';

/**
 * A lead waiting in the inbox, as triage needs it and nothing more (`M02-24`): its name, its city,
 * where it came from, how long it has waited and its bill when known.
 */
export interface WaitingLead {
  readonly id: string;
  /** The customer's name as typed — a fact; `null` is drawn as the named gap. */
  readonly name: string | null;
  readonly city: string | null;
  readonly source: LeadSource | (string & {});
  /** Wall-clock milliseconds since capture — the caller's clock, never a ticking interval. */
  readonly elapsedMs: number;
  /** The monthly bill already in the tenant's currency, with its tier; `null` while unknown. */
  readonly bill: { readonly money: string; readonly tier: ProvenanceTier } | null;
}

/** The words every waiting lead says when a fact is missing, and its age. */
export interface WaitingLeadWords {
  /** "No name yet". */
  noName: TranslatedText;
  /** "No city yet". */
  noCity: TranslatedText;
  /** "No bill yet". */
  noBill: TranslatedText;
  age: LeadAgeWords;
}

/** Every word the card says, built in `@heliogrid/i18n` (`leadInboxWords`). */
export interface LeadDeckCardWords extends WaitingLeadWords {
  /** The card's name for a screen reader: the lead's name as typed, or "No name yet". */
  region: (name: string | null) => TranslatedText;
  /** "Monthly bill". */
  bill: TranslatedText;
  /** Under a known bill on the stage — "The customer's word". */
  billNote: TranslatedText;
  /** Under a missing bill on the stage — "Ask on the first call". */
  noBillNote: TranslatedText;
  /** The stage's junk button — "Junk". */
  junk: TranslatedText;
  /** The deck's junk mark, spoken — "Junk this lead". */
  junkThis: TranslatedText;
  /** The faces' overline — "Give to". */
  give: TranslatedText;
  /** Beside it on the stage — "One click assigns. No confirm." */
  giveHint: TranslatedText;
  /** The stage's three keys, each said after its key: "give", "junk", "next". */
  keys: { give: TranslatedText; junk: TranslatedText; next: TranslatedText };
  /** The stage's place — "1 of 148". */
  place: (place: number, total: number) => TranslatedText;
  previous: TranslatedText;
  next: TranslatedText;
  /** Under the age in the ring — "waiting". */
  waiting: TranslatedText;
  /** Under the ring before the escalation — "Owner alert at 24 h". */
  alertAt: TranslatedText;
  /** Under the ring past it — "Past 24 h". */
  pastDay: TranslatedText;
}

/** `deck`: the phone's card with the faces under it · `stage`: the desktop's wide card, the team docked. */
export type LeadDeckCardLayout = 'deck' | 'stage';

/** The stage's place in the queue and its two moves. */
export interface LeadDeckPlace {
  /** From 0. */
  readonly index: number;
  readonly total: number;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * **The deck** (`SCR-M02-02`, Look A): the newest waiting lead, big, on the solar glass, the team
 * under it — one tap on a face gives it away, one tap bins it. Until the server confirms, the act's
 * line sits in the card and its acts wait (`M02-67`); when the lead leaves, it flies off as the
 * next rises into its place, and the keyboard's focus lands on the new lead's name.
 */
export interface LeadDeckCardProps {
  lead: WaitingLead;
  /** The source's word (`leadSourceWord`). */
  sourceLabel: TranslatedText;
  layout: LeadDeckCardLayout;
  /** How many leads wait under this one; up to two peek out beneath the card. */
  behind: number;
  /** The stage's place and moves; the deck has none. */
  place?: LeadDeckPlace;
  /** Bins the lead; absent when the reader may not. */
  onJunk?: () => void;
  /** The act out on this lead, or back undone with its reason (`PendingAction`). */
  pending?: PendingActionSpec;
  /** An act on this lead is out: junk waits, and the faces with it. */
  waiting: boolean;
  /** The faces the lead can go to (`TeamDock`); absent when the reader may not assign. */
  team?: ReactNode;
  /** The lead that just left the deck, drawn flying away; `null` when none did. */
  departed: { readonly lead: WaitingLead; readonly sourceLabel: TranslatedText } | null;
  words: LeadDeckCardWords;
}

/** The words an inbox act's line says, built in `@heliogrid/i18n` (`inboxActWords`). */
export interface InboxActLineWords {
  /** "Assigning to Rajesh Jadhav…", "Binning as junk…". */
  out: (act: InboxActState) => TranslatedText;
  /** The whole sentence an undone act comes back with. */
  returned: (act: InboxActState, why: InboxActReturn) => TranslatedText;
  retry: TranslatedText;
  dismiss: TranslatedText;
}
