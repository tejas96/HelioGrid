/**
 * The line each project act leaves in its toast, with its *Undo* where a person's own move can be
 * taken back (ruling 16) — the project page, the steps and the handover say them.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';
import type { PackWord } from './projects';

type T = Translator['t'];

const TOAST = {
  moved: /*i18n*/ { id: 'Project moved to {stage}' },
  movedBack: /*i18n*/ { id: 'Moved back to {stage}' },
  undone: /*i18n*/ { id: 'Move undone' },
  undo: /*i18n*/ { id: 'Undo' },
  waitSaved: /*i18n*/ { id: 'Waiting on {party} · since {date}' },
  waitEnded: /*i18n*/ { id: 'Wait closed · on the timeline' },
  documentDone: /*i18n*/ { id: '{row} done' },
  notNeeded: /*i18n*/ { id: '{row} not needed' },
  stepTicked: /*i18n*/ { id: '{step} ticked' },
  saved: /*i18n*/ { id: 'Saved' },
  cancelled: /*i18n*/ { id: 'Project cancelled' },
  handedOver: /*i18n*/ { id: 'Handed over' },
  uploading: /*i18n*/ { id: 'Uploading…' },
  notSent: /*i18n*/ { id: 'Not sent · Retry' },
  copied: /*i18n*/ { id: 'Copied — paste it in your chat' },
  notCopied: /*i18n*/ { id: 'Not copied. Try again.' },
} satisfies Record<string, MessageRef>;

/** What an act's toast says, with its *Undo* where the move can be taken back. */
/** An act's news, as `useProjectScreen` hands it over — by shape. */
export type ProjectToastFacts =
  | { readonly kind: 'moved' | 'movedBack'; readonly stage: string; readonly undoable: boolean }
  | {
      readonly kind:
        | 'undone'
        | 'waitEnded'
        | 'saved'
        | 'cancelled'
        | 'handedOver'
        | 'copied'
        | 'notCopied';
    }
  | { readonly kind: 'waitSaved'; readonly party: string; readonly date: string }
  | { readonly kind: 'documentDone' | 'notNeeded'; readonly row: string }
  | { readonly kind: 'stepTicked'; readonly step: string };

/** What an act's toast says, with its *Undo* where the move can be taken back. */
export function projectToastWords(t: T, word: PackWord, day: (date: string) => string) {
  return {
    /** The toast's one line, for whichever act it follows. */
    title: (toast: ProjectToastFacts): TranslatedText => {
      switch (toast.kind) {
        case 'moved':
        case 'movedBack':
          return t(toast.kind === 'moved' ? TOAST.moved : TOAST.movedBack, {
            stage: word('stage', toast.stage),
          });
        case 'waitSaved':
          return t(TOAST.waitSaved, { party: word('party', toast.party), date: day(toast.date) });
        case 'documentDone':
        case 'notNeeded':
          return t(toast.kind === 'documentDone' ? TOAST.documentDone : TOAST.notNeeded, {
            row: word('row', toast.row),
          });
        case 'stepTicked':
          return t(TOAST.stepTicked, { step: word('step', toast.step) });
        default:
          return t(TOAST[toast.kind]);
      }
    },
    undo: t(TOAST.undo),
    uploading: t(TOAST.uploading),
    notSent: t(TOAST.notSent),
  };
}
export type ProjectToastCopy = ReturnType<typeof projectToastWords>;
