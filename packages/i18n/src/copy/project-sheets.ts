/**
 * The project's sheets and moments (rulings 2026-11-10): *Mark won*, *Dispatched* with its crew, a
 * wait, *Not needed*, cancel, a new install date, a new manager, how to get in, where a file comes
 * from; and the toasts each act leaves with its *Undo*.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { datePickerWords } from './date-picker';
import { numberFieldWords } from './number-field';
import { CANCEL_REASON_WORDS } from './project-cancel';
import type { PackWord } from './projects';
import { SHELL } from './shell';

export * from './project-toast';

type T = Translator['t'];

const WON = {
  title: /*i18n*/ { id: 'Mark won' },
  line: /*i18n*/ { id: 'The project starts at Won — nothing is typed twice.' },
  finalValue: /*i18n*/ { id: 'Final value' },
  installDate: /*i18n*/ { id: 'Expected install date' },
  manager: /*i18n*/ { id: 'Project manager' },
  managerOnly: /*i18n*/ { id: 'Your only project manager is picked for you.' },
  managersLoading: /*i18n*/ { id: 'Finding your project managers…' },
  managersFailed: /*i18n*/ { id: 'The project managers did not load.' },
  send: /*i18n*/ { id: 'Mark won · start the project' },
  started: /*i18n*/ { id: 'Project {number} started' },
  openProject: /*i18n*/ { id: 'Open project' },
  alreadyWon: /*i18n*/ { id: 'This lead is already won. Its project is on the board.' },
  closedLead: /*i18n*/ { id: 'A closed lead cannot be won. Reopen it first.' },
  notManager: /*i18n*/ { id: 'That person can no longer manage projects. Pick someone else.' },
  finerThanCurrency: /*i18n*/ { id: 'Too many decimal places for your currency.' },
  valueNeeded: /*i18n*/ { id: 'Write the final value.' },
  managerNeeded: /*i18n*/ { id: 'Pick who manages the project' },
  failed: /*i18n*/ { id: 'The project did not start. Check the connection and try again.' },
  dateNeeded: /*i18n*/ { id: 'Pick the install date.' },
  dateInPast: /*i18n*/ { id: 'Pick today or a later day.' },
  liveProjects: /*i18n*/ {
    id: '{count, plural, =0 {free} one {# live project} other {# live projects}}',
  },
} satisfies Record<string, MessageRef>;

const SHEET = {
  lead: /*i18n*/ { id: '{name} · {place}' },
  crewLabel: /*i18n*/ { id: 'Which crew goes?' },
  crewNeeded: /*i18n*/ { id: 'Pick who goes to site.' },
  addCrew: /*i18n*/ { id: 'Add a crew' },
  leftOn: /*i18n*/ { id: 'Left the warehouse' },
  dispatchHelp: /*i18n*/ { id: 'The crew sees this job on their Home.' },
  dispatchHelpWait: /*i18n*/ {
    id: 'The crew sees this job on their Home. The open wait on {party} closes.',
  },
  noInstallers: /*i18n*/ { id: 'No one is on the installation team yet. Invite them from Team.' },
  crewLoading: /*i18n*/ { id: 'Finding your installers…' },
  crewFailed: /*i18n*/ { id: 'The installers did not load.' },
  dispatchSend: /*i18n*/ { id: 'Move to Dispatched' },
  waitTitle: /*i18n*/ { id: 'Who are we waiting on?' },
  waitLine: /*i18n*/ { id: '{name} · the days are counted from the date below.' },
  sinceDay: /*i18n*/ { id: 'Since {date}' },
  sinceToday: /*i18n*/ { id: 'Since today, {date}' },
  teamNote: /*i18n*/ { id: 'Team note' },
  why: /*i18n*/ { id: 'Why' },
  since: /*i18n*/ { id: 'Since' },
  note: /*i18n*/ { id: 'Team note (optional)' },
  notePlaceholder: /*i18n*/ { id: 'Only your team sees this' },
  customerSees: /*i18n*/ { id: 'The customer will see' },
  customerSeesLine: /*i18n*/ { id: 'Waiting on {party} · {reason} · since {date}' },
  waitSend: /*i18n*/ { id: 'Save the wait' },
  partyHint: {
    company: /*i18n*/ { id: 'Our team or our crew' },
    customer: /*i18n*/ { id: 'Access, papers, payment' },
    utility: /*i18n*/ { id: 'Approval, inspection, meter' },
    material: /*i18n*/ { id: 'Supplier, stock, transport' },
  },
  notNeededTitle: /*i18n*/ { id: 'Not needed' },
  notNeededLine: /*i18n*/ { id: 'Say why {row} does not apply. It counts as done for handover.' },
  reason: /*i18n*/ { id: 'Reason' },
  notNeededSend: /*i18n*/ { id: 'Mark not needed' },
  cancelTitle: /*i18n*/ { id: 'Cancel this project?' },
  cancelLine: /*i18n*/ {
    id: '{name}. Nothing is deleted: its timeline and documents stay. It stops counting as revenue now.',
  },
  cancelNote: /*i18n*/ { id: 'Note' },
  cancelNoteNeeded: /*i18n*/ { id: 'Say what happened.' },
  earlyRow: /*i18n*/ { id: '{row} came early' },
  earlyProof: /*i18n*/ { id: 'Proof came early' },
  earlyLine: /*i18n*/ { id: '{name} is at {stage}. Move it to {to}?' },
  earlyNow: /*i18n*/ { id: 'now' },
  earlyPassed: /*i18n*/ { id: 'counts as passed' },
  earlyWith: /*i18n*/ { id: 'with this file' },
  earlySend: /*i18n*/ { id: 'Move to {stage}' },
  earlyKeep: /*i18n*/ { id: 'Not now · keep the file' },
  cancelReason: /*i18n*/ { id: 'Reason (needed)' },
  cancelSend: /*i18n*/ { id: 'Cancel project' },
  keep: /*i18n*/ { id: 'Keep it' },
  dateTitle: /*i18n*/ { id: 'New install date' },
  dateLine: /*i18n*/ { id: 'The date you promise the customer.' },
  dateSend: /*i18n*/ { id: 'Save date' },
  managerTitle: /*i18n*/ { id: 'Change manager' },
  managerSend: /*i18n*/ { id: 'Save manager' },
  managerPick: /*i18n*/ { id: 'Pick a manager' },
  managerNone: /*i18n*/ {
    id: 'No one can manage a project yet. Invite a project manager from Team.',
  },
  accessTitle: /*i18n*/ { id: 'How to get in' },
  accessLine: /*i18n*/ { id: 'Keys, gate, dogs, ladder, who to call — the crew reads this.' },
  accessSend: /*i18n*/ { id: 'Save' },
  fileName: /*i18n*/ { id: 'File name' },
  fileSend: /*i18n*/ { id: 'Add file' },
} satisfies Record<string, MessageRef | Record<string, MessageRef>>;

/** Where a file comes from on the phone: the camera, the photos, or a PDF from the files. */
/** Where a file comes from — the phone's chooser, and the add that opens it. */
export const FILE_PICK = {
  title: /*i18n*/ { id: 'Add a file' },
  photoTitle: /*i18n*/ { id: 'Add a photo' },
  /** A photo's name, from the moment it was taken or chosen — never the camera's own temp name. */
  photoName: /*i18n*/ { id: 'Photo {day}, {time}' },
  camera: /*i18n*/ { id: 'Take a photo' },
  photos: /*i18n*/ { id: 'Choose a photo' },
  pdf: /*i18n*/ { id: 'Choose a PDF' },
  cancel: /*i18n*/ { id: 'Cancel' },
} satisfies Record<string, MessageRef>;

/** *Mark won*'s words. */
export function markWonWords(t: T, who: string) {
  return {
    title: t(WON.title),
    /** Whose deal it is — the lead's name, else its number: the page under the sheet is hidden. */
    who: shownAsSent(who),
    line: t(WON.line),
    finalValue: t(WON.finalValue),
    installDate: t(WON.installDate),
    manager: t(WON.manager),
    managerOnly: t(WON.managerOnly),
    managersLoading: t(WON.managersLoading),
    managersFailed: t(WON.managersFailed),
    send: t(WON.send),
    started: (number: string) => t(WON.started, { number }),
    openProject: t(WON.openProject),
    alreadyWon: t(WON.alreadyWon),
    closedLead: t(WON.closedLead),
    notManager: t(WON.notManager),
    finerThanCurrency: t(WON.finerThanCurrency),
    valueNeeded: t(WON.valueNeeded),
    dateNeeded: t(WON.dateNeeded),
    dateInPast: t(WON.dateInPast),
    managerNeeded: t(WON.managerNeeded),
    failed: t(WON.failed),
    liveProjects: (count: number) => t(WON.liveProjects, { count }),
    retry: t(SHELL.tryAgain),
    close: t(SHELL.close),
    date: datePickerWords(t),
    numberField: numberFieldWords(t),
  };
}
export type MarkWonCopy = ReturnType<typeof markWonWords>;

/** The project sheets' words. */
export function projectSheetWords(t: T, word: PackWord, day: (date: string) => string) {
  const stage = (key: string) => word('stage', key);
  return {
    /** The project a sheet acts on, under its title: its name, and its place where known. */
    lead: (name: string, place: string | null) =>
      place === null ? (name as TranslatedText) : t(SHEET.lead, { name, place }),
    dispatch: {
      // The pack's own word for the stage — the board and the journey say the same.
      title: stage('dispatched'),
      crew: t(SHEET.crewLabel),
      crewNeeded: t(SHEET.crewNeeded),
      addCrew: t(SHEET.addCrew),
      leftOn: t(SHEET.leftOn),
      /** What the move does: the crew's job, and the open wait it closes — named by its party. */
      help: (waitingOn: string | null) =>
        waitingOn === null
          ? t(SHEET.dispatchHelp)
          : t(SHEET.dispatchHelpWait, { party: word('party', waitingOn) }),
      none: t(SHEET.noInstallers),
      loading: t(SHEET.crewLoading),
      failed: t(SHEET.crewFailed),
      send: t(SHEET.dispatchSend),
      liveProjects: (count: number) => t(WON.liveProjects, { count }),
    },
    wait: {
      title: t(SHEET.waitTitle),
      line: (name: string) => t(SHEET.waitLine, { name }),
      why: t(SHEET.why),
      since: t(SHEET.since),
      sinceDay: (date: string, today: boolean) =>
        t(today ? SHEET.sinceToday : SHEET.sinceDay, { date: day(date) }),
      teamNote: t(SHEET.teamNote),
      note: t(SHEET.note),
      notePlaceholder: t(SHEET.notePlaceholder),
      customerSees: t(SHEET.customerSees),
      customerSeesLine: (party: string, reason: string, date: string) =>
        t(SHEET.customerSeesLine, {
          party: word('party', party),
          reason: word('reason', reason),
          date: day(date),
        }),
      send: t(SHEET.waitSend),
      party: (party: string) => word('party', party),
      partyHint: {
        company: t(SHEET.partyHint.company),
        customer: t(SHEET.partyHint.customer),
        utility: t(SHEET.partyHint.utility),
        material: t(SHEET.partyHint.material),
      },
      reason: (reason: string) => word('reason', reason),
    },
    notNeeded: {
      title: t(SHEET.notNeededTitle),
      line: (row: string) => t(SHEET.notNeededLine, { row: word('row', row) }),
      reason: t(SHEET.reason),
      send: t(SHEET.notNeededSend),
    },
    cancel: {
      title: t(SHEET.cancelTitle),
      line: (name: string) => t(SHEET.cancelLine, { name }),
      reason: t(SHEET.cancelReason),
      reasonWord: (reason: string) => {
        const known = CANCEL_REASON_WORDS[reason as keyof typeof CANCEL_REASON_WORDS];
        return known === undefined ? (reason as TranslatedText) : t(known);
      },
      note: t(SHEET.cancelNote),
      noteNeeded: t(SHEET.cancelNoteNeeded),
      send: t(SHEET.cancelSend),
      keep: t(SHEET.keep),
    },
    early: {
      title: (row: string | null) =>
        row === null ? t(SHEET.earlyProof) : t(SHEET.earlyRow, { row: word('row', row) }),
      line: (name: string, at: string, to: string) =>
        t(SHEET.earlyLine, { name, stage: stage(at), to: stage(to) }),
      stage,
      now: t(SHEET.earlyNow),
      passed: t(SHEET.earlyPassed),
      with: t(SHEET.earlyWith),
      send: (to: string) => t(SHEET.earlySend, { stage: stage(to) }),
      keep: t(SHEET.earlyKeep),
    },
    date: { title: t(SHEET.dateTitle), line: t(SHEET.dateLine), send: t(SHEET.dateSend) },
    manager: {
      title: t(SHEET.managerTitle),
      send: t(SHEET.managerSend),
      pick: t(SHEET.managerPick),
      loading: t(WON.managersLoading),
      failed: t(WON.managersFailed),
      none: t(SHEET.managerNone),
    },
    access: { title: t(SHEET.accessTitle), line: t(SHEET.accessLine), send: t(SHEET.accessSend) },
    file: { name: t(SHEET.fileName), send: t(SHEET.fileSend) },
    fields: { date: datePickerWords(t) },
    close: t(SHELL.close),
    retry: t(SHELL.tryAgain),
  };
}
export type ProjectSheetCopy = ReturnType<typeof projectSheetWords>;

/** The phone's choice of where a file comes from — a lead's paper or a project's. */
export function filePickWords(t: T) {
  return {
    title: t(FILE_PICK.title),
    photoTitle: t(FILE_PICK.photoTitle),
    photoName: (day: string, time: string) => t(FILE_PICK.photoName, { day, time }),
    camera: t(FILE_PICK.camera),
    photos: t(FILE_PICK.photos),
    pdf: t(FILE_PICK.pdf),
    cancel: t(FILE_PICK.cancel),
  };
}
export type FilePickCopy = ReturnType<typeof filePickWords>;
