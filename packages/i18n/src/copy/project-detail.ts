/**
 * One project (`SCR-M08-02`…`04`): every word its page, its checklist and its steps say, for both
 * platforms. A stage, a party, a reason, a row and a step are the market pack's words.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { ProjectActRefusal } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { ACTIVITY_STREAM, activityStreamWords } from './activity-stream';
import { actorClassWords } from './actor-class';
import { shownAsSent } from './assembled';
import { crmVocabularyWords } from './crm-vocabulary';
import { projectNextWords } from './project-next';
import { alreadyMovedWords, projectPageWords } from './project-page';
import { type PackWord, PROJECT_DAYS, PROJECT_FAILED_MESSAGE } from './projects';
import { SHELL } from './shell';

export * from './project-next';
export * from './project-page';

type T = Translator['t'];

const BACK = /*i18n*/ { id: 'Back' };
const DAYS_HERE = /*i18n*/ { id: '{count, plural, one {day here} other {days here}}' };

/** A project's own words; the installer's job and the handover say some of them too. */
export const PROJECT_DETAIL = {
  notSent: /*i18n*/ { id: 'Not sent · Retry' },
  now: /*i18n*/ { id: 'Now' },
  next: /*i18n*/ { id: 'Next' },
  since: /*i18n*/ { id: 'since {date}' },
  manager: /*i18n*/ { id: '{name} · manager' },
  installBy: /*i18n*/ { id: 'Install by {date}' },
  noInstallDate: /*i18n*/ { id: 'No install date yet' },
  viewOnly: /*i18n*/ { id: 'View only · you sold this project' },
  journey: /*i18n*/ { id: 'Journey' },
  journeyNote: /*i18n*/ { id: 'dates, never a % bar' },
  movedBy: /*i18n*/ { id: 'by {name}' },
  movedByProof: /*i18n*/ { id: 'Moved by HelioGrid · {proof}' },
  firstStep: /*i18n*/ { id: 'the first install step was ticked' },
  lastStep: /*i18n*/ { id: 'the last install step was ticked' },
  passedOver: /*i18n*/ { id: 'passed over' },
  passedOverLine: /*i18n*/ { id: 'This deal claims no subsidy' },
  movesOnTap: /*i18n*/ { id: 'moves on: one tap' },
  movesOnCrew: /*i18n*/ { id: 'moves on: one tap, with the crew' },
  movesOnFirstStep: /*i18n*/ { id: 'moves on: the first install step ticked' },
  movesOnLastStep: /*i18n*/ { id: 'moves on: the last install step ticked' },
  movesOnRow: /*i18n*/ { id: 'moves on: {row}' },
  movesOnHandover: /*i18n*/ { id: 'moves on: handover' },
  documents: /*i18n*/ { id: 'Documents' },
  documentsCount: /*i18n*/ { id: '{done} of {total} done' },
  seeAllDocuments: /*i18n*/ { id: 'See all {count}' },
  nothingWaiting: /*i18n*/ { id: 'Nothing is waiting' },
  done: /*i18n*/ { id: 'Done' },
  notNeeded: /*i18n*/ { id: 'Not needed' },
  madeAtHandover: /*i18n*/ { id: 'Made at handover' },
  upload: /*i18n*/ { id: 'Upload' },
  notNeededAct: /*i18n*/ { id: 'Not needed' },
  undoNotNeeded: /*i18n*/ { id: 'Needed after all' },
  movesProject: /*i18n*/ { id: 'Moves the project to {stage}' },
  steps: /*i18n*/ { id: 'Install steps' },
  photo: /*i18n*/ { id: 'Photo' },
  tickedBy: /*i18n*/ { id: '{name} · {time}' },
  crew: /*i18n*/ { id: 'Crew' },
  noCrew: /*i18n*/ { id: 'No crew yet — it is picked at Dispatched' },
  otherFiles: /*i18n*/ { id: 'Other files' },
  addFile: /*i18n*/ { id: 'Add' },
  addFileSpoken: /*i18n*/ { id: 'Add a file' },
  fromLead: /*i18n*/ { id: 'From the lead' },
  addedBy: /*i18n*/ { id: 'Added by {name}' },
  showToCustomer: /*i18n*/ { id: 'Show to customer' },
  noFiles: /*i18n*/ { id: 'No other files' },
  deal: /*i18n*/ { id: 'Deal' },
  customer: /*i18n*/ { id: 'Customer' },
  design: /*i18n*/ { id: 'Design' },
  proposal: /*i18n*/ { id: 'Proposal' },
  noneLinked: /*i18n*/ { id: 'None linked yet' },
  accessNote: /*i18n*/ { id: 'How to get in' },
  noAccessNote: /*i18n*/ { id: 'Not written yet' },
  activity: /*i18n*/ { id: 'Activity' },
  waitTitle: /*i18n*/ { id: 'Waiting on {party}' },
  waitLine: /*i18n*/ { id: '{reason} · since {date}' },
  waitOver: /*i18n*/ { id: 'Wait is over' },
  noWaitTitle: /*i18n*/ { id: 'Waiting on someone?' },
  noWaitLine: /*i18n*/ { id: 'Say who. The days are counted for you.' },
  menu: /*i18n*/ { id: 'More acts on this project' },
  changeDate: /*i18n*/ { id: 'Change install date' },
  changeManager: /*i18n*/ { id: 'Change manager' },
  changeAccess: /*i18n*/ { id: 'Change how to get in' },
  moveBack: /*i18n*/ { id: 'Move back a stage' },
  cancel: /*i18n*/ { id: 'Cancel project' },
  call: /*i18n*/ { id: 'Call {name}' },
  cancelledTitle: /*i18n*/ { id: 'Cancelled' },
  handedOverTitle: /*i18n*/ { id: 'Handed over' },
  failedTitle: /*i18n*/ { id: 'The project did not load' },
  loading: /*i18n*/ { id: 'Loading the project' },
  actFailed: /*i18n*/ { id: 'Not saved. Check the connection and try again.' },
  numberPlace: /*i18n*/ { id: '{number} · {place}' },
  goneTitle: /*i18n*/ { id: 'This project is not yours to see' },
  goneBody: /*i18n*/ { id: 'It may have moved to another manager.' },
} satisfies Record<string, MessageRef>;

const REFUSAL: Record<ProjectActRefusal, MessageRef> = {
  project_closed: /*i18n*/ { id: 'This project is closed. Nothing more moves it.' },
  not_next_stage: /*i18n*/ { id: 'A project moves one stage at a time.' },
  needs_handover: /*i18n*/ { id: 'Handover is its own step. Start it from the project.' },
  nothing_behind: /*i18n*/ { id: 'There is no stage behind this one.' },
  no_proof_ahead: /*i18n*/ { id: 'No file on the project proves that stage yet.' },
  already_moved: /*i18n*/ { id: 'Someone already moved it. Nothing changed twice.' },
  not_undoable: /*i18n*/ { id: 'That move can no longer be undone. Use Move back.' },
  documents_pending: /*i18n*/ { id: 'Some documents are still waiting.' },
  wait_open: /*i18n*/ { id: 'A wait is already open. End it first.' },
  no_open_wait: /*i18n*/ { id: 'There is no open wait.' },
  reason_not_of_party: /*i18n*/ { id: 'That reason does not fit who we wait on.' },
  date_in_future: /*i18n*/ { id: 'A wait cannot start after today.' },
  reason_needed: /*i18n*/ { id: 'Say why.' },
  step_ticked: /*i18n*/ { id: 'That step is already ticked.' },
  step_not_ticked: /*i18n*/ { id: 'That step is not ticked.' },
  file_not_ready: /*i18n*/ { id: 'The file has not finished uploading. Try again.' },
  row_unknown: /*i18n*/ { id: 'That document is not on this project.' },
  step_unknown: /*i18n*/ { id: 'That step is not on this project.' },
  not_a_manager: /*i18n*/ { id: 'Pick a project manager or the owner.' },
  not_on_crew: /*i18n*/ { id: 'Pick people from the installation team.' },
  needs_crew: /*i18n*/ { id: 'Dispatched names its crew — use Move to Dispatched.' },
  date_in_past: /*i18n*/ { id: 'Pick today or a later day.' },
  date_before_stage: /*i18n*/ { id: 'That day is before the material was ordered.' },
  file_unknown: /*i18n*/ { id: 'That file is not on this project.' },
  made_at_handover: /*i18n*/ { id: 'Handover makes this one. Nothing to upload.' },
};

/** The proofs a move names by a word of its own; a checklist row is named by the pack. */
const PROOF_NAME: Readonly<Record<string, MessageRef>> = {
  first_install_step: PROJECT_DETAIL.firstStep,
  last_install_step: PROJECT_DETAIL.lastStep,
};

/** What moves a stage on, where it is not one tap or a checklist row. */
const MOVES_ON: Readonly<Record<string, MessageRef>> = {
  dispatched: PROJECT_DETAIL.movesOnCrew,
  installation: PROJECT_DETAIL.movesOnFirstStep,
  electrical_metering: PROJECT_DETAIL.movesOnLastStep,
  handed_over: PROJECT_DETAIL.movesOnHandover,
};

/** A project's words — the hero, its next step, the cards, the menu and every refusal. */
export function projectDetailWords(t: T, word: PackWord, day: (date: string) => string) {
  // A cancelled project stands at no stage of the pack's chain: its word is the copy's own.
  const stageOf = (stage: string) =>
    stage === 'cancelled' ? t(PROJECT_DETAIL.cancelledTitle) : word('stage', stage);
  const proofNameOf = (proof: string | null): TranslatedText => {
    const named = proof === null ? undefined : PROOF_NAME[proof];
    return named ? t(named) : word('row', proof ?? '');
  };
  const refusalOf = (refusal: string) => {
    const known = REFUSAL[refusal as ProjectActRefusal];
    return known === undefined ? t(PROJECT_DETAIL.actFailed) : t(known);
  };
  return {
    ...projectPageWords(t, word, day),
    ...projectNextWords(t, word, stageOf),
    now: t(PROJECT_DETAIL.now),
    next: t(PROJECT_DETAIL.next),
    since: (date: string) => t(PROJECT_DETAIL.since, { date: day(date) }),
    days: (count: number) => t(PROJECT_DAYS, { count }),
    daysHere: (count: number) => t(DAYS_HERE, { count }),
    stage: stageOf,
    manager: (name: string) => t(PROJECT_DETAIL.manager, { name }),
    installBy: (date: string | null) =>
      date === null
        ? t(PROJECT_DETAIL.noInstallDate)
        : t(PROJECT_DETAIL.installBy, { date: day(date) }),
    viewOnly: t(PROJECT_DETAIL.viewOnly),
    journey: t(PROJECT_DETAIL.journey),
    journeyNote: t(PROJECT_DETAIL.journeyNote),
    movedBy: (name: string) => t(PROJECT_DETAIL.movedBy, { name }),
    movedByProof: (proof: string | null) =>
      t(PROJECT_DETAIL.movedByProof, { proof: proofNameOf(proof) }),
    /** The proof that moved a stage, in its own words — a tick, or the checklist row's name. */
    proofName: proofNameOf,
    passedOver: t(PROJECT_DETAIL.passedOver),
    passedOverLine: t(PROJECT_DETAIL.passedOverLine),
    /** What moves a stage on: one tap, the crew, a tick, a document or the handover. */
    movesOn: (stage: string, row: string | null) =>
      row !== null
        ? t(PROJECT_DETAIL.movesOnRow, { row: word('row', row) })
        : t(MOVES_ON[stage] ?? PROJECT_DETAIL.movesOnTap),
    documents: t(PROJECT_DETAIL.documents),
    documentsCount: (done: number, total: number) =>
      t(PROJECT_DETAIL.documentsCount, { done, total }),
    seeAllDocuments: (count: number) => t(PROJECT_DETAIL.seeAllDocuments, { count }),
    nothingWaiting: t(PROJECT_DETAIL.nothingWaiting),
    row: (row: string) => word('row', row),
    done: t(PROJECT_DETAIL.done),
    notNeeded: t(PROJECT_DETAIL.notNeeded),
    madeAtHandover: t(PROJECT_DETAIL.madeAtHandover),
    upload: t(PROJECT_DETAIL.upload),
    notSent: t(PROJECT_DETAIL.notSent),
    notNeededAct: t(PROJECT_DETAIL.notNeededAct),
    undoNotNeeded: t(PROJECT_DETAIL.undoNotNeeded),
    movesProject: (stage: string) => t(PROJECT_DETAIL.movesProject, { stage: stageOf(stage) }),
    steps: t(PROJECT_DETAIL.steps),
    crew: t(PROJECT_DETAIL.crew),
    noCrew: t(PROJECT_DETAIL.noCrew),
    otherFiles: t(PROJECT_DETAIL.otherFiles),
    addFile: t(PROJECT_DETAIL.addFile),
    addFileSpoken: t(PROJECT_DETAIL.addFileSpoken),
    stream: activityStreamWords(t, actorClassWords(t)),
    streamFrame: {
      todayLabel: t(ACTIVITY_STREAM.today),
      yesterdayLabel: t(ACTIVITY_STREAM.yesterday),
      countLabel: t(ACTIVITY_STREAM.countLabel),
    },
    activityKind: crmVocabularyWords(t).activityKind,
    fromLead: t(PROJECT_DETAIL.fromLead),
    addedBy: (name: string) => t(PROJECT_DETAIL.addedBy, { name }),
    showToCustomer: t(PROJECT_DETAIL.showToCustomer),
    noFiles: t(PROJECT_DETAIL.noFiles),
    deal: t(PROJECT_DETAIL.deal),
    customer: t(PROJECT_DETAIL.customer),
    design: t(PROJECT_DETAIL.design),
    proposal: t(PROJECT_DETAIL.proposal),
    noneLinked: t(PROJECT_DETAIL.noneLinked),
    accessNote: t(PROJECT_DETAIL.accessNote),
    noAccessNote: t(PROJECT_DETAIL.noAccessNote),
    activity: t(PROJECT_DETAIL.activity),
    waitTitle: (party: string) => t(PROJECT_DETAIL.waitTitle, { party: word('party', party) }),
    waitLine: (reason: string, startedOn: string) =>
      t(PROJECT_DETAIL.waitLine, { reason: word('reason', reason), date: day(startedOn) }),
    waitOver: t(PROJECT_DETAIL.waitOver),
    noWaitTitle: t(PROJECT_DETAIL.noWaitTitle),
    noWaitLine: t(PROJECT_DETAIL.noWaitLine),
    menu: t(PROJECT_DETAIL.menu),
    changeDate: t(PROJECT_DETAIL.changeDate),
    changeManager: t(PROJECT_DETAIL.changeManager),
    changeAccess: t(PROJECT_DETAIL.changeAccess),
    moveBack: t(PROJECT_DETAIL.moveBack),
    cancel: t(PROJECT_DETAIL.cancel),
    call: (name: string) => t(PROJECT_DETAIL.call, { name }),
    refusal: refusalOf,
    /**
     * Why the last act did not land — its refusal, or the network — said where it was taken. A move
     * a second person made first names them and where it went, from the project read again.
     */
    said: (
      refusal: string | null,
      failed: boolean,
      moved?: { readonly by: string | null; readonly stage: string },
    ): TranslatedText | null => {
      if (refusal === 'already_moved' && moved !== undefined) {
        return alreadyMovedWords(t, word, moved);
      }
      return refusal !== null ? refusalOf(refusal) : failed ? t(PROJECT_DETAIL.actFailed) : null;
    },
    failedTitle: t(PROJECT_DETAIL.failedTitle),
    failedMessage: t(PROJECT_FAILED_MESSAGE),
    loading: t(PROJECT_DETAIL.loading),
    goneTitle: t(PROJECT_DETAIL.goneTitle),
    goneBody: t(PROJECT_DETAIL.goneBody),
    retry: t(SHELL.tryAgain),
    back: t(BACK),
  };
}
export type ProjectDetailCopy = ReturnType<typeof projectDetailWords>;

/** A project page's large title: the customer's name as written, and its number and place under it. */
export function projectTitleWords(
  t: T,
  facts: { readonly name: string | null; readonly number: string; readonly place: string | null },
) {
  return {
    title: shownAsSent(facts.name ?? facts.number),
    summary:
      facts.place === null
        ? shownAsSent(facts.number)
        : t(PROJECT_DETAIL.numberPlace, { number: facts.number, place: facts.place }),
  };
}
