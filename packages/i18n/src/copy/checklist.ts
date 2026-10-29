/**
 * `Checklist`'s own words (`packages/ui`'s `ChecklistWords`): its loading and region names, the
 * count in words, a phase's count, the materials label, the proof link and each tick box's name —
 * plus the usual sentences of its empty, failed and unavailable faces, which a checklist draws
 * only when given.
 */
import type { Translator } from '../runtime';
import { SHELL } from './shell';

export const CHECKLIST = {
  loading: /*i18n*/ { id: 'Loading checklist' },
  name: /*i18n*/ { id: 'Checklist' },
  stepsDone: /*i18n*/ { id: '{done} of {total} steps done' },
  itemsDone: /*i18n*/ { id: '{done} of {total} {noun} done' },
  phaseCount: SHELL.markCount,
  materials: /*i18n*/ { id: 'Materials' },
  evidence: /*i18n*/ { id: 'See the evidence' },
  done: /*i18n*/ { id: '{title}, done' },
  notDone: /*i18n*/ { id: '{title}, not done' },
  noSteps: /*i18n*/ { id: 'No steps yet' },
  builtFromDesign: /*i18n*/ {
    id: 'This checklist is built from the design. Generate one and the steps appear here.',
  },
  couldNotLoad: /*i18n*/ { id: "Couldn't load the checklist" },
  noTickLost: /*i18n*/ { id: 'Try again — no tick is lost while this fails.' },
  noChecklist: /*i18n*/ { id: 'No checklist for this job' },
} as const;

/** Every word `Checklist` says itself, in the reader's language. */
export function checklistWords(t: Translator['t']) {
  return {
    loading: t(CHECKLIST.loading),
    name: t(CHECKLIST.name),
    count: (done: number, total: number, noun?: string) =>
      noun === undefined
        ? t(CHECKLIST.stepsDone, { done, total })
        : t(CHECKLIST.itemsDone, { done, total, noun }),
    phaseCount: (done: number, total: number) => t(CHECKLIST.phaseCount, { step: done, total }),
    materials: t(CHECKLIST.materials),
    evidence: t(CHECKLIST.evidence),
    tick: (title: string, done: boolean) => t(done ? CHECKLIST.done : CHECKLIST.notDone, { title }),
  };
}
