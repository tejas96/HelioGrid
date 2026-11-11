import {
  type createTranslator,
  handoverWords,
  projectBoardWords,
  projectDetailWords,
  projectSheetWords,
  projectToastWords,
} from '@heliogrid/i18n';
import {
  FIRST_PERSON_ROW,
  FIRST_STEP,
  LAST_ROW,
  NEXT_WAITING_ROW,
  PACK,
  packDay,
  packWord,
  RESIDENTIAL_ROWS,
} from './project-facts.ts';

/*
 * The projects' words for their phone flows (`SCR-M08-01`…`04`, `SCR-M08-06`;
 * `mobile/projects-board.yaml`, `project-detail.yaml`, `project-handover.yaml`), handed to Maestro
 * by `mobile-cli.ts`, which reads no file mid-flow. The project is the one the company step started
 * at Won, from a residential lead, so its next step, its rows and its steps are the India pack's.
 */
export function projectFlowWords(
  t: Awaited<ReturnType<typeof createTranslator>>,
): Record<string, string> {
  const board = projectBoardWords(t.t, PACK, 'en');
  const detail = projectDetailWords(t.t, packWord, packDay);
  const sheets = projectSheetWords(t.t, packWord, packDay);
  const toast = projectToastWords(t.t, packWord, packDay);
  const handover = handoverWords(t.t, packWord);
  const move = { kind: 'move', to: 'material_ordered' } as const;
  return {
    /** The board: the day's hero — nothing needs the owner yet — the Won stage and its days figure. */
    PROJECTS_ALL_CLEAR: board.allClearTitle,
    STAGE_WON: board.stage('won'),
    DAYS_TODAY: board.days(0),
    /** The project at Won: its next step, the act that moves it and the toast's way back. */
    NEXT_MOVE_TITLE: detail.nextTitle(move, null),
    MOVE_ACT: detail.nextAct(move),
    PROJECT_UNDO: toast.undo,
    MOVE_UNDONE: toast.title({ kind: 'undone' }),
    /** Not needed on the first row a person fills — spoken with its row — its sheet and its toast. */
    NOT_NEEDED_ACT: detail.notNeededRow(FIRST_PERSON_ROW),
    NOT_NEEDED_LINE: sheets.notNeeded.line(FIRST_PERSON_ROW),
    REASON_LABEL: sheets.notNeeded.reason,
    MARK_NOT_NEEDED: sheets.notNeeded.send,
    ROW_NOT_NEEDED: toast.title({ kind: 'notNeeded', row: FIRST_PERSON_ROW }),
    /** The whole checklist: the way to it, the marked row's way back, and the row handover makes. */
    SEE_ALL_DOCUMENTS: detail.seeAllDocuments(RESIDENTIAL_ROWS.length),
    NEEDED_AFTER_ALL: detail.reopenRow(FIRST_PERSON_ROW),
    LAST_ROW: detail.row(LAST_ROW),
    MADE_AT_HANDOVER: detail.madeAtHandover,
    /** The install steps' own page: no crew picked yet, no way in written, the first step to tick. */
    INSTALL_STEPS: detail.steps,
    NO_CREW: detail.noCrew,
    NO_ACCESS_NOTE: detail.noAccessNote,
    FIRST_STEP: packWord('step', FIRST_STEP),
    /** The handover: what still waits, the row marked not needed and the next one, and its act. */
    HANDOVER_WAITING_TITLE: handover.waitingTitle,
    HANDOVER_WAITING_LINE: handover.waitingLine,
    FIRST_PERSON_ROW: handover.row(FIRST_PERSON_ROW),
    NEXT_WAITING_ROW: handover.row(NEXT_WAITING_ROW),
    HAND_OVER: handover.send,
    /** The pack's tile: no row has a file yet, so there is nothing to put in one. */
    HANDOVER_PACK: handover.packTitle,
    HANDOVER_PACK_EMPTY: handover.packEmpty,
  };
}
