import type { TranslatedText } from '@heliogrid/contracts';
import type { BlockerParty, BlockerReason, CancelReason, Read } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { DatePickerWords, ISODate } from '../DatePicker/DatePicker.types';

/** A person a project sheet can pick — a manager, an installer — as the wire names them. */
export interface ProjectPersonChoice {
  readonly userId: string;
  /** The person's name as they wrote it — a fact. */
  readonly name: string;
  /** The live projects they manage or crew, so the pick shows who is free. */
  readonly liveProjects: number;
}

/** A wait as the sheet sends it (`M08-21`): who, why, since when, and the team's own note. */
export interface ProjectWaitDraft {
  readonly party: BlockerParty;
  readonly reason: BlockerReason;
  readonly startedOn: ISODate;
  // biome-ignore lint/plugin/copy-prop-type: the team's own note, sent as typed — a fact
  readonly note: string | null;
}

/** The sheets' words — `@heliogrid/i18n`'s `projectSheetWords`, by shape. */
export interface ProjectActSheetWords {
  /** The project a sheet acts on, under its title: its name, and its place where known. */
  readonly lead: (name: string, place: string | null) => TranslatedText;
  readonly dispatch: {
    readonly title: TranslatedText;
    readonly crew: TranslatedText;
    /** Why the send stopped: no one is picked to go. */
    readonly crewNeeded: TranslatedText;
    readonly addCrew: TranslatedText;
    readonly leftOn: TranslatedText;
    /** What the move does: the crew's job, and the open wait it closes, by its party. */
    readonly help: (waitingOn: string | null) => TranslatedText;
    readonly none: TranslatedText;
    readonly loading: TranslatedText;
    readonly failed: TranslatedText;
    readonly send: TranslatedText;
    readonly liveProjects: (count: number) => TranslatedText;
  };
  readonly wait: {
    readonly title: TranslatedText;
    readonly line: (name: string) => TranslatedText;
    readonly why: TranslatedText;
    readonly since: TranslatedText;
    /** The day the wait is counted from, said inline — *Since today, 11 Nov*. */
    readonly sinceDay: (date: string, today: boolean) => TranslatedText;
    /** The ghost that opens the team's note. */
    readonly teamNote: TranslatedText;
    readonly note: TranslatedText;
    readonly notePlaceholder: TranslatedText;
    readonly customerSees: TranslatedText;
    readonly customerSeesLine: (party: string, reason: string, date: string) => TranslatedText;
    readonly send: TranslatedText;
    readonly party: (party: string) => TranslatedText;
    readonly partyHint: Readonly<Record<BlockerParty, TranslatedText>>;
    readonly reason: (reason: string) => TranslatedText;
  };
  readonly notNeeded: {
    readonly title: TranslatedText;
    readonly line: (row: string) => TranslatedText;
    readonly reason: TranslatedText;
    readonly send: TranslatedText;
  };
  readonly cancel: {
    readonly title: TranslatedText;
    readonly line: (name: string) => TranslatedText;
    readonly reason: TranslatedText;
    readonly reasonWord: (reason: string) => TranslatedText;
    readonly note: TranslatedText;
    /** *Something else* says what happened in its note. */
    readonly noteNeeded: TranslatedText;
    readonly send: TranslatedText;
    readonly keep: TranslatedText;
  };
  readonly early: {
    readonly title: (row: string | null) => TranslatedText;
    readonly line: (name: string, at: string, to: string) => TranslatedText;
    readonly stage: (stage: string) => TranslatedText;
    readonly now: TranslatedText;
    readonly passed: TranslatedText;
    readonly with: TranslatedText;
    readonly send: (to: string) => TranslatedText;
    readonly keep: TranslatedText;
  };
  readonly date: {
    readonly title: TranslatedText;
    readonly line: TranslatedText;
    readonly send: TranslatedText;
  };
  readonly manager: {
    readonly title: TranslatedText;
    readonly send: TranslatedText;
    /** The pick's words while no one is picked — *Pick a manager*. */
    readonly pick: TranslatedText;
    readonly loading: TranslatedText;
    readonly failed: TranslatedText;
    /** No one may manage a project yet. */
    readonly none: TranslatedText;
  };
  readonly access: {
    readonly title: TranslatedText;
    readonly line: TranslatedText;
    readonly send: TranslatedText;
  };
  readonly file: {
    readonly name: TranslatedText;
    readonly send: TranslatedText;
  };
  readonly fields: { readonly date: DatePickerWords };
  readonly close: TranslatedText;
  readonly retry: TranslatedText;
}

/** Each act's form — the one the sheet draws, what it starts with, and its send. */
export type ProjectActForm =
  | {
      /** *Dispatched* names its crew and the day it left the warehouse (ruling 6). */
      readonly kind: 'dispatch';
      readonly name: string;
      readonly place: string | null;
      /** Who is on the installation team. */
      readonly people: Read<readonly ProjectPersonChoice[]>;
      /** The crew picked last time, ticked to start with. */
      readonly start: readonly string[];
      /** The first day it can have left: the day Material ordered began. */
      readonly firstDay: ISODate;
      /** The company's today: the day it left by default, and the last it may have left on. */
      readonly today: ISODate;
      /** Who the open wait is on — the move closes it — or null with none open. */
      readonly waitingOn: string | null;
      readonly onSend: (crew: readonly string[], leftOn: ISODate) => void;
      /** A new crew is invited from the team — the sheet's way out to it. */
      readonly onAddCrew: () => void;
    }
  | {
      readonly kind: 'wait';
      readonly name: string;
      /** The company's today: the day a wait starts by default, and the last it may start on. */
      readonly today: ISODate;
      readonly onSend: (wait: ProjectWaitDraft) => void;
    }
  | {
      /** A proof that came early (ruling 1): move the project on, or keep the file and wait. */
      readonly kind: 'earlyProof';
      readonly name: string;
      /** The stage it stands at, the stages the move counts as passed, and where it goes. */
      readonly at: string;
      readonly passed: readonly string[];
      readonly to: string;
      /** The checklist row whose file came, where a row proves the stage. */
      readonly row: string | null;
      readonly onSend: () => void;
    }
  | {
      readonly kind: 'notNeeded';
      /** The checklist row's pack key. */
      readonly row: string;
      readonly onSend: (reason: string) => void;
    }
  | {
      readonly kind: 'cancel';
      readonly name: string;
      readonly onSend: (reason: CancelReason, note: string | null) => void;
    }
  | {
      readonly kind: 'date';
      readonly start: ISODate | null;
      /** The first day the install can be promised for — today on the company's clock. */
      readonly firstDay: ISODate;
      readonly onSend: (date: ISODate) => void;
    }
  | {
      readonly kind: 'manager';
      /** Who may manage a project: the project managers and the owner (ruling 12). */
      readonly people: Read<readonly ProjectPersonChoice[]>;
      /** The manager now. */
      readonly start: string;
      readonly onSend: (managerId: string) => void;
    }
  | {
      readonly kind: 'access';
      /** The note as it stands, as the manager wrote it. */
      readonly start: string | null;
      /** An emptied note clears it. */
      readonly onSend: (note: string | null) => void;
    }
  | {
      /** A picked file's name before it goes up as an other file. */
      readonly kind: 'fileName';
      /** The name the picker gave it. */
      readonly start: string;
      readonly onSend: (name: string) => void;
    };

/**
 * The project's acts, each in one sheet (rulings 2026-11-10): *Dispatched* with its crew, a wait,
 * *Not needed* with its reason, cancel, a new install date, a new manager, how to get in, and a
 * file's name. A send sleeps until its form holds what the act needs; while it is out its fields
 * are inert and every way out waits; a refusal is said inside the sheet, above its send.
 */
export interface ProjectActSheetProps {
  /** The form open; `null` closes the sheet. */
  readonly form: ProjectActForm | null;
  /** Backdrop, Esc, close, drag or *Keep it* — refused while the send is out. */
  readonly onClose: () => void;
  readonly sending: boolean;
  /** Why the send came back undone, worded; or null. */
  readonly refusal: TranslatedText | null;
  readonly words: ProjectActSheetWords;
}

/** What every form draws beside its own fields. */
export interface ProjectFormFrame {
  readonly sending: boolean;
  readonly refusal: TranslatedText | null;
  readonly words: ProjectActSheetWords;
  readonly onClose: () => void;
}

export type ProjectFormOf<K extends ProjectActForm['kind']> = ProjectFormFrame & {
  readonly form: Extract<ProjectActForm, { kind: K }>;
};

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

/** Who can be picked: the list while it is read, its failure with *Try again*, none yet, or the pick. */
export interface ProjectPeopleReadProps {
  readonly read: Read<readonly ProjectPersonChoice[]>;
  readonly words: {
    readonly loading: TranslatedText;
    readonly failed: TranslatedText;
    readonly none: TranslatedText;
    readonly retry: TranslatedText;
  };
  readonly ready: (people: readonly ProjectPersonChoice[]) => ReactNode;
}

/** A sheet's send at its foot: the refusal above it, its glyph, and busy while the send is out. */
export interface ProjectSheetSendProps {
  readonly label: TranslatedText;
  /** The form holds what the act needs; a press before then says what is missing instead. */
  readonly ready: boolean;
  readonly pending: boolean;
  readonly failure: TranslatedText | null;
  readonly onSend: () => void;
  readonly glyph: ShellGlyphName | null;
  /** The send that ends something — cancel — in the danger fill. */
  readonly destructive: boolean;
}
