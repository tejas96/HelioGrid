import type { TranslatedText } from '@heliogrid/contracts';
import type { CancelReason } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { CANCEL_REASON_WORDS } from './project-cancel';

/**
 * The project notice (ruling 2026-11-10): a project moved by its proof or by someone other than
 * its manager tells the manager what moved it, so nothing moves in silence. The api renders it in
 * the RECIPIENT's language when it emits and stores it as written (`F6-08`).
 */

/** The centre groups a day's moves of one kind by these words (`F6-12`). */
export const PROJECTS_MOVED_COUNT: MessageRef = /*i18n*/ {
  id: '{count, plural, one {# project moved} other {# projects moved}}',
};

const PROJECT_NOTICES = {
  movedTitle: /*i18n*/ { id: '{name} moved to {stage}' },
  movedByProofBody: /*i18n*/ { id: 'The proof moved it: {proof}.' },
  movedByPersonBody: /*i18n*/ { id: '{mover} moved it.' },
  movedBackBody: /*i18n*/ { id: '{mover} moved it back.' },
  cancelledTitle: /*i18n*/ { id: '{name} was cancelled' },
  cancelledBody: /*i18n*/ { id: '{mover} cancelled it: {reason}' },
  cancelledNoteBody: /*i18n*/ { id: '{mover} cancelled it: {reason} · {note}' },
  handedOverTitle: /*i18n*/ { id: '{name} was handed over' },
  handedOverBody: /*i18n*/ { id: '{mover} handed it over.' },
  firstStepProof: /*i18n*/ { id: 'the first install step was ticked' },
  lastStepProof: /*i18n*/ { id: 'the last install step was ticked' },
} satisfies Record<string, MessageRef>;

interface NoticeText {
  title: TranslatedText;
  body: TranslatedText;
}

/** What moved the project, as the notice says it. */
export type ProjectMoveWhy =
  | { readonly by: 'proof'; readonly proof: 'first_step' | 'last_step' | { readonly row: string } }
  | { readonly by: 'person'; readonly mover: string; readonly back: boolean }
  | {
      readonly by: 'cancel';
      readonly mover: string;
      readonly reason: CancelReason;
      readonly note: string | null;
    }
  | { readonly by: 'handover'; readonly mover: string };

/**
 * The manager's notice. `name` is how the project reads in a list; `stage` and a checklist row are
 * the market pack's labels in the recipient's language, handed in by the caller.
 */
export function projectMovedNotice(
  translate: Translator['t'],
  moved: { readonly name: string; readonly stage: string; readonly why: ProjectMoveWhy },
): NoticeText {
  const { why } = moved;
  if (why.by === 'cancel') {
    return {
      title: translate(PROJECT_NOTICES.cancelledTitle, { name: moved.name }),
      body: translate(
        why.note === null ? PROJECT_NOTICES.cancelledBody : PROJECT_NOTICES.cancelledNoteBody,
        {
          mover: why.mover,
          reason: translate(CANCEL_REASON_WORDS[why.reason]),
          note: why.note ?? '',
        },
      ),
    };
  }
  if (why.by === 'handover') {
    return {
      title: translate(PROJECT_NOTICES.handedOverTitle, { name: moved.name }),
      body: translate(PROJECT_NOTICES.handedOverBody, { mover: why.mover }),
    };
  }
  const title = translate(PROJECT_NOTICES.movedTitle, { name: moved.name, stage: moved.stage });
  if (why.by === 'person') {
    const body = why.back ? PROJECT_NOTICES.movedBackBody : PROJECT_NOTICES.movedByPersonBody;
    return { title, body: translate(body, { mover: why.mover }) };
  }
  const proof =
    why.proof === 'first_step'
      ? translate(PROJECT_NOTICES.firstStepProof)
      : why.proof === 'last_step'
        ? translate(PROJECT_NOTICES.lastStepProof)
        : why.proof.row;
  return { title, body: translate(PROJECT_NOTICES.movedByProofBody, { proof }) };
}
