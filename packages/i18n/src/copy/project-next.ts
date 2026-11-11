/**
 * The project hero's next step (`SCR-M08-02`): its title, its line and its act, for each step domain
 * names. A stage in them is the pack's word, as the journey and the board say it.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { NextStep } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import type { PackWord } from './projects';

type T = Translator['t'];

/* The page's own words for these, written again here: the page imports this file, so this file
   importing the page's would run before the page's words exist. */
const HANDED_OVER = /*i18n*/ { id: 'Handed over' };
const CANCELLED = /*i18n*/ { id: 'Cancelled' };
const UPLOAD = /*i18n*/ { id: 'Upload' };

/** A proof that came early, named by its checklist row where one proves the stage. */
const PROOF_EARLY = /*i18n*/ { id: '{row} came early' };

/** The first install tick still to come: the crew has not started yet. */
const STEPS_FIRST = {
  title: /*i18n*/ { id: 'Crew starts on site' },
  line: /*i18n*/ { id: 'The first install tick moves it to {stage}.' },
  act: /*i18n*/ { id: 'See install steps' },
} satisfies Record<string, MessageRef>;

const NEXT_TITLE = {
  confirm_proof: /*i18n*/ { id: 'Proof came early' },
  upload_missing: /*i18n*/ { id: 'Upload {row}' },
  install_date_passed: /*i18n*/ { id: 'The install date has passed' },
  move: /*i18n*/ { id: 'Move to {stage}' },
  dispatch: /*i18n*/ { id: 'Send it to site' },
  steps: /*i18n*/ { id: '{ticked} of {total} steps done' },
  upload_proof: /*i18n*/ { id: 'Upload {row}' },
  handover: /*i18n*/ { id: 'Hand over' },
  handed_over: HANDED_OVER,
  cancelled: CANCELLED,
} satisfies Record<NextStep['kind'], MessageRef>;

/** A closed project's hero says how it closed in its own line; these two never draw. */
const NEXT_LINE = {
  confirm_proof: /*i18n*/ { id: 'Move to {stage}? The stages before it count as passed.' },
  upload_missing: /*i18n*/ { id: 'The stage was reached by hand. Its proof is missing.' },
  install_date_passed: /*i18n*/ { id: 'Set a new date, or say who we are waiting on.' },
  move: /*i18n*/ { id: 'One tap when it is done.' },
  dispatch: /*i18n*/ { id: 'Pick the crew when the material leaves.' },
  steps: /*i18n*/ { id: 'The last tick moves it to {stage}.' },
  upload_proof: /*i18n*/ { id: 'It moves the project to {stage} by itself.' },
  handover: /*i18n*/ { id: 'Every document checked, then the pack to the customer.' },
  handed_over: HANDED_OVER,
  cancelled: CANCELLED,
} satisfies Record<NextStep['kind'], MessageRef>;

const NEXT_ACT = {
  confirm_proof: /*i18n*/ { id: 'Move to {stage}' },
  upload_missing: UPLOAD,
  install_date_passed: /*i18n*/ { id: 'New date' },
  move: /*i18n*/ { id: '{stage}' },
  dispatch: /*i18n*/ { id: '{stage}' },
  steps: /*i18n*/ { id: 'Steps and photos' },
  upload_proof: UPLOAD,
  handover: /*i18n*/ { id: 'Start handover' },
  handed_over: /*i18n*/ { id: 'Documents' },
  cancelled: /*i18n*/ { id: 'Documents' },
} satisfies Record<NextStep['kind'], MessageRef>;

/** The step's words when the crew has not started: what the first tick does, and the way to it. */
function firstTick(step: NextStep): boolean {
  return step.kind === 'steps' && step.to === 'installation';
}

/** The hero's next step in words; `stageOf` is the page's own word for a stage. */
export function projectNextWords(t: T, word: PackWord, stageOf: (stage: string) => TranslatedText) {
  const values = (step: NextStep) => ({
    ...('to' in step && { stage: stageOf(step.to) }),
    // Dispatched names its own stage: the move goes to it, though the step carries no stage.
    ...(step.kind === 'dispatch' && { stage: stageOf('dispatched') }),
    ...('row' in step && { row: word('row', step.row) }),
    ...(step.kind === 'steps' && { ticked: step.ticked, total: step.total }),
  });
  return {
    /** The next step's title; an early proof names the row that came, where a row proves it. */
    nextTitle: (step: NextStep, proofRow: string | null) => {
      if (step.kind === 'confirm_proof' && proofRow !== null) {
        return t(PROOF_EARLY, { row: word('row', proofRow) });
      }
      return t(firstTick(step) ? STEPS_FIRST.title : NEXT_TITLE[step.kind], values(step));
    },
    nextLine: (step: NextStep) =>
      t(firstTick(step) ? STEPS_FIRST.line : NEXT_LINE[step.kind], values(step)),
    nextAct: (step: NextStep) =>
      t(firstTick(step) ? STEPS_FIRST.act : NEXT_ACT[step.kind], values(step)),
  };
}
