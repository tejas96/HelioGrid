/**
 * `Kanban`'s own words (`packages/ui`'s `KanbanWords`): its loading name, an empty column's line,
 * the phone form's stage strip and each card's two move buttons — plus the usual sentences of its
 * empty, failed and unavailable faces, which a board draws only when given.
 */
import type { Translator } from '../runtime';
import { TIMELINE } from './timeline';

export const KANBAN = {
  loading: /*i18n*/ { id: 'Loading board' },
  nothingHere: /*i18n*/ { id: 'Nothing here' },
  stage: /*i18n*/ { id: 'Stage' },
  moveBack: /*i18n*/ { id: 'Move back a stage' },
  moveBackTo: /*i18n*/ { id: 'Move back a stage — move to {stage}' },
  moveOn: /*i18n*/ { id: 'Move on a stage' },
  moveOnTo: /*i18n*/ { id: 'Move on a stage — move to {stage}' },
  noJobs: /*i18n*/ { id: 'No jobs in this pipeline' },
  couldNotLoad: /*i18n*/ { id: "Couldn't load the board" },
  keepsFailing: TIMELINE.keepsFailing,
  noPipeline: /*i18n*/ { id: 'No pipeline here' },
} as const;

/** Every word `Kanban` says itself, in the reader's language. */
export function kanbanWords(t: Translator['t']) {
  return {
    loading: t(KANBAN.loading),
    nothingHere: t(KANBAN.nothingHere),
    stage: t(KANBAN.stage),
    moveBack: (stage?: string) =>
      stage === undefined ? t(KANBAN.moveBack) : t(KANBAN.moveBackTo, { stage }),
    moveOn: (stage?: string) =>
      stage === undefined ? t(KANBAN.moveOn) : t(KANBAN.moveOnTo, { stage }),
  };
}
