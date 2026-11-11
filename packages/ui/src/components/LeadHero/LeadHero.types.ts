import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadLifecycleState, LeadStage, ProvenanceTier } from '@heliogrid/domain';
import type { StageTrackWords } from '../StageTrack/StageTrack.types';

/** Every word the hero says, built in `@heliogrid/i18n` (`leadHeroWords`) over this lead's facts. */
export interface LeadHeroWords {
  /** The named gaps of a capture that carried the number alone (`M02-03`). */
  readonly noName: TranslatedText;
  readonly noCity: TranslatedText;
  /** The stage's word (`M02-41`). */
  readonly stage: TranslatedText;
  /** What the deal is — "Residential" — or null while the capture left it out. */
  readonly segment: TranslatedText | null;
  /** The source's word (`M02-13`), drawn when no referrer is named. */
  readonly source: TranslatedText;
  /** "Came from Anil Patil" (`M02-16`); null when the lead was not referred. */
  readonly cameFrom: TranslatedText | null;
  /** The parked or closed state's words — "Snoozed till 2 Dec" (`M02-51`); null on an active lead. */
  readonly state: TranslatedText | null;
  /** "3 tries, no answer" (`M02-43`); null under two. */
  readonly tries: TranslatedText | null;
  /** The owner's chip: their name, or "No owner yet". */
  readonly owner: TranslatedText;
  /** The corner pencil's spoken name — "Edit details": the lead's name and city (`M02-03`). */
  readonly editDetails: TranslatedText;
  /** The narrow hero's owner row act: "Assign" while no one has the lead, "Change" once someone does. */
  readonly ownerAct: TranslatedText;
  /** What the owner chip says to a screen reader — "Owner: Rajesh Jadhav. Give the lead to someone". */
  readonly ownerSpoken: TranslatedText;
  /** The value's overline, and its named gap while no proposal supplies one (`M02-38`). */
  readonly valueLabel: TranslatedText;
  readonly noValue: TranslatedText;
  /** A won lead's overline, and its link's spoken name — "Open project PRJ-0007". */
  readonly projectLabel: TranslatedText;
  readonly openProject: (number: string) => TranslatedText;
  /** A value whose design changed since its proposal was computed reads provisional (`F8-12`). */
  readonly provisional: TranslatedText;
  /** "Step 3 of 8: Qualified", and "Next, Survey" — null at the last stage. */
  readonly stepLine: TranslatedText;
  readonly nextLine: TranslatedText | null;
  readonly stageTrack: StageTrackWords;
  /** The record menu's name — "More actions" — and its acts' words. */
  readonly recordActs: {
    readonly label: TranslatedText;
    readonly snooze: TranslatedText;
    readonly disqualify: TranslatedText;
    readonly markWon: TranslatedText;
    readonly addReferral: TranslatedText;
    readonly merge: TranslatedText;
    readonly junk: TranslatedText;
  };
}

/**
 * An act on the whole record — not today's work — so it waits behind the ⋯ menu. On the narrow
 * page snooze and disqualify join it, out of the action row; the wide page keeps them as pills.
 */
export type LeadRecordAct =
  | 'snooze'
  | 'disqualify'
  | 'mark-won'
  | 'add-referral'
  | 'merge'
  | 'junk';

/**
 * `wide` — the wide web's hero: the name inside it, the facts as chips, the owner chip and the ⋯
 * in its corner. `narrow` — the phone's and the narrow web's: the large title names the lead above
 * it, the stage is the one chip, the other facts one quiet line, the owner a row at its foot with
 * its act, and the ⋯ lives in the page's top bar.
 */
export type LeadHeroForm = 'wide' | 'narrow';

/** One act the record menu offers; `leadRecordMenuOf` puts them in order. */
export interface LeadRecordActPress {
  readonly act: LeadRecordAct;
  readonly onPress: () => void;
}

/** The record's own facts, as the desktop hero draws them under its name. */
export interface LeadHeroIdentity {
  /** As typed — a fact; null draws its named gap. */
  readonly name: string | null;
  /** The number as the market writes it, set in mono (`F7-09`). */
  readonly phone: string;
  readonly city: string | null;
}

/** The lead's value as the server sent it, formatted by the caller in the tenant's currency. */
export interface LeadHeroValue {
  readonly text: string;
  readonly tier: ProvenanceTier;
  readonly provisional: boolean;
}

/**
 * The lead's one hero (`SCR-M02-04`, `M02-32`): solar glass holding the stage, the deal, where it
 * came from and who has it, any parked state and failed tries, the value — a named gap until a
 * proposal supplies one — and the eight-step track with where it goes next. The owner chip opens
 * the assign picker; the ⋯ in its corner holds the acts on the whole record. The phone draws the name, number and city as its large title, so `identity`
 * is the desktop's.
 */
/** A won lead's project: its number (a fact) and the press that opens it. */
export interface LeadHeroProject {
  readonly number: string;
  readonly onOpen: () => void;
}

export interface LeadHeroProps {
  readonly form: LeadHeroForm;
  /** The wide hero's name, number and city; the narrow page's large title holds them instead. */
  readonly identity: LeadHeroIdentity | null;
  readonly stage: LeadStage;
  /** Where the enquiry came from (`M02-13`); a source a newer server learned draws the plain dot. */
  readonly source: string;
  /** The lead's R9 state (`M02-49`) — parked, closed, or null while it is active. */
  readonly lifecycleState: LeadLifecycleState | null;
  /**
   * The corner pencil: opens the lead's name and city to fill or change (`M02-03`: a capture's gaps
   * are filled on first contact). Always offered — a gap shows as its named gap in the title.
   */
  readonly onEditDetails: () => void;
  /** Opens the assign picker (`M02-29`). */
  readonly onOwner: () => void;
  /** The owner by name — a fact — for the chip's face; null while the lead waits unassigned. */
  readonly ownerName: string | null;
  readonly value: LeadHeroValue | null;
  /**
   * The project a won lead became (`M08-02`): the hero names it and opens it in place of the
   * estimate, which stops mattering once the deal is won. Null before the win.
   */
  readonly project: LeadHeroProject | null;
  /** The acts the record menu offers — empty draws no menu; the narrow hero draws none itself. */
  readonly recordActs: readonly LeadRecordActPress[];
  /** Off while a state act is out, as the dock's state acts are. */
  readonly recordActsOff: boolean;
  readonly words: LeadHeroWords;
}
