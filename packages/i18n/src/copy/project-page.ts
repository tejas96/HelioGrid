/**
 * The project page's own lines (`SCR-M08-02`…`04`, the picked design): the facts under its title, the
 * closed hero, the documents' rows and their spoken names, the activity, the checklist's own screen,
 * the install steps' screen, and the kind line *Remind* hands the person to send the customer.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import { type UiLanguage, uiLanguageOrSource } from '@heliogrid/domain';
import { createTranslator, type MessageRef, type Translator } from '../runtime';
import { CANCEL_REASON_WORDS } from './project-cancel';
import type { PackWord } from './projects';

type T = Translator['t'];

const PAGE = {
  installing: /*i18n*/ { id: 'Installing · {ticked} of {total} steps' },
  installedOn: /*i18n*/ { id: 'Installed {date}' },
  remind: /*i18n*/ { id: 'Remind' },
  handedOverOn: /*i18n*/ { id: 'On {date}. The pack stays here.' },
  handoverPack: /*i18n*/ { id: 'Handover pack' },
  countsAsPassed: /*i18n*/ { id: 'counts as passed' },
  byWithCrew: /*i18n*/ { id: 'by {name} · {crew}' },
  notNeededBecause: /*i18n*/ { id: 'Not needed · {reason}' },
  uploadedBy: /*i18n*/ { id: 'Uploaded by {name} · {date}' },
  uploadRow: /*i18n*/ { id: 'Upload {row}' },
  notNeededRow: /*i18n*/ { id: 'Not needed: {row}' },
  reopenRow: /*i18n*/ { id: 'Needed after all: {row}' },
  showFile: /*i18n*/ { id: 'Show to customer: {name}' },
  activityNote: /*i18n*/ { id: 'nothing edits after the fact' },
  managerLabel: /*i18n*/ { id: 'Manager' },
  started: /*i18n*/ { id: 'Project started · {stage}' },
  moved: /*i18n*/ { id: 'Stage moved · {stage}' },
  movedAuto: /*i18n*/ { id: 'Moved by HelioGrid · {stage}' },
  movedBack: /*i18n*/ { id: 'Moved back · {stage}' },
  undone: /*i18n*/ { id: 'Move undone · {stage}' },
  waitStarted: /*i18n*/ { id: 'Wait started · {party}' },
  cancelled: /*i18n*/ { id: 'Project cancelled' },
  byMarkWon: /*i18n*/ { id: 'by {name} · Mark won' },
  docsSummary: /*i18n*/ { id: '{name} · {done} of {total} done' },
  movesTheStage: /*i18n*/ { id: 'Moves the stage' },
  movesByItself: /*i18n*/ { id: 'Upload it — the project moves to {stage} by itself.' },
  photoOrFile: /*i18n*/ { id: 'Photo or file' },
  docsCaption: /*i18n*/ { id: 'Handover opens when no row is waiting.' },
  stepsSummary: /*i18n*/ { id: '{name} · {ticked} of {total} done' },
  alreadyMovedBy: /*i18n*/ { id: '{name} already moved it to {stage}. Nothing changed twice.' },
  alreadyMovedTo: /*i18n*/ { id: 'It already moved to {stage}. Nothing changed twice.' },
  cancelledLine: /*i18n*/ { id: '{reason} · nothing was deleted' },
} satisfies Record<string, MessageRef>;

/**
 * *Remind*'s kind line, one per thing a customer can hold a project up on (`BLOCKER_REASONS_BY_PARTY`
 * `customer`) — words the person sends themselves, so no delivery is ever claimed.
 */
const REMIND: Readonly<Record<string, MessageRef>> = {
  site_access: /*i18n*/ {
    id: 'We need to reach your site to carry on with your solar installation. Please tell us when we can come.',
  },
  customer_documents: /*i18n*/ {
    id: 'We are waiting for a few documents from you to carry on with your solar project. Please share them when you can.',
  },
  customer_payment: /*i18n*/ {
    id: 'Your solar project is waiting on a payment from you. Please let us know once it is done.',
  },
  customer_decision: /*i18n*/ {
    id: 'Your solar project is waiting on your decision. Please reply when you are ready.',
  },
  other: /*i18n*/ { id: 'Your solar project is waiting on you. Please reply when you can.' },
};
const REMIND_HELLO = /*i18n*/ { id: 'Hello {name}!' };
const REMIND_HELLO_NO_NAME = /*i18n*/ { id: 'Hello!' };

/** A move on the journey as the activity names it: its kind, read off the move itself. */
export type ProjectEventKind =
  | 'started'
  | 'moved'
  | 'movedAuto'
  | 'movedBack'
  | 'undone'
  | 'cancelled'
  | 'wait';

/** The page's own words — `projectDetailWords` carries them. */
export function projectPageWords(t: T, word: PackWord, day: (date: string) => string) {
  const stage = (key: string) => word('stage', key);
  return {
    installing: (ticked: number, total: number) => t(PAGE.installing, { ticked, total }),
    installedOn: (date: string) => t(PAGE.installedOn, { date: day(date) }),
    remind: t(PAGE.remind),
    handedOverOn: (date: string) => t(PAGE.handedOverOn, { date: day(date) }),
    handoverPack: t(PAGE.handoverPack),
    cancelledLine: (reason: string) => {
      const known = CANCEL_REASON_WORDS[reason as keyof typeof CANCEL_REASON_WORDS];
      return t(PAGE.cancelledLine, { reason: known === undefined ? reason : t(known) });
    },
    countsAsPassed: t(PAGE.countsAsPassed),
    byWithCrew: (name: string, crew: readonly string[]) =>
      t(PAGE.byWithCrew, { name, crew: crew.join(', ') }),
    notNeededBecause: (reason: string) => t(PAGE.notNeededBecause, { reason }),
    uploadedBy: (name: string, date: string) => t(PAGE.uploadedBy, { name, date: day(date) }),
    uploadRow: (row: string) => t(PAGE.uploadRow, { row: word('row', row) }),
    notNeededRow: (row: string) => t(PAGE.notNeededRow, { row: word('row', row) }),
    reopenRow: (row: string) => t(PAGE.reopenRow, { row: word('row', row) }),
    showFile: (name: string) => t(PAGE.showFile, { name }),
    activityNote: t(PAGE.activityNote),
    managerLabel: t(PAGE.managerLabel),
    event: (kind: ProjectEventKind, key: string): TranslatedText => {
      if (kind === 'wait') return t(PAGE.waitStarted, { party: word('party', key) });
      if (kind === 'cancelled') return t(PAGE.cancelled);
      return t(PAGE[kind], { stage: stage(key) });
    },
    byMarkWon: (name: string) => t(PAGE.byMarkWon, { name }),
    reason: (key: string) => word('reason', key),
    docsSummary: (name: string, done: number, total: number) =>
      t(PAGE.docsSummary, { name, done, total }),
    movesTheStage: t(PAGE.movesTheStage),
    movesByItself: (to: string) => t(PAGE.movesByItself, { stage: stage(to) }),
    photoOrFile: t(PAGE.photoOrFile),
    docsCaption: t(PAGE.docsCaption),
    stepsSummary: (name: string, ticked: number, total: number) =>
      t(PAGE.stepsSummary, { name, ticked, total }),
  };
}

/** A second person's move, said with who made it and where it went (ruling 16). */
export function alreadyMovedWords(
  t: T,
  word: PackWord,
  moved: { readonly by: string | null; readonly stage: string },
): TranslatedText {
  const stage = moved.stage === 'cancelled' ? moved.stage : word('stage', moved.stage);
  return moved.by === null
    ? t(PAGE.alreadyMovedTo, { stage })
    : t(PAGE.alreadyMovedBy, { name: moved.by, stage });
}

/**
 * *Remind*'s words in the CUSTOMER's language — the translator the screen made for that language, so
 * a Marathi customer reads Marathi whatever the manager reads (`F3-06`). The person sends it
 * themselves, from the share sheet or a copy.
 */
export function projectRemindMessage(
  t: T,
  facts: { readonly name: string | null; readonly reason: string },
): string {
  const hello =
    facts.name === null ? t(REMIND_HELLO_NO_NAME) : t(REMIND_HELLO, { name: facts.name });
  const line = REMIND[facts.reason] ?? REMIND.other;
  return line === undefined ? hello : `${hello} ${t(line)}`;
}

/**
 * *Remind*'s line for a customer's wait, made in the customer's own language — else the reader's —
 * for the person to send from their own phone; the screen copies it or opens the share sheet.
 */
export async function projectRemindLine(
  facts: {
    readonly name: string | null;
    readonly reason: string;
    readonly language: string | null;
  },
  reader: UiLanguage,
): Promise<string> {
  const { t } = await createTranslator(uiLanguageOrSource(facts.language ?? reader));
  return projectRemindMessage(t, facts);
}
