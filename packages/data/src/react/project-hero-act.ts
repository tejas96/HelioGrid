import type { NextStep, ProjectFileSlot } from '@heliogrid/domain';
import type { ProjectActSend } from '../projects/project-act-send';

/** The sheet open over the project. */
export type ProjectSheet =
  | { readonly kind: 'dispatch' }
  | { readonly kind: 'wait' }
  | { readonly kind: 'notNeeded'; readonly row: string }
  | { readonly kind: 'cancel' }
  | { readonly kind: 'date' }
  | { readonly kind: 'manager' }
  | { readonly kind: 'access' }
  | { readonly kind: 'file' }
  /** A proof that came early: move the project on, or keep the file and wait (ruling 1). */
  | { readonly kind: 'earlyProof' };

/** Where a picked file goes on the project. */
export interface FilePlace {
  readonly slot: ProjectFileSlot;
  readonly slotKey: string | null;
}

/** What the hero's act leaves to the screen: a document to pick, the steps or the handover to open. */
export type NextAnswer =
  | { readonly kind: 'pick'; readonly place: FilePlace }
  | { readonly kind: 'steps' }
  | { readonly kind: 'handover' }
  | null;

/** The hero's act, as each next step takes it. */
export function nextOf(
  step: NextStep,
  screen: { send: (act: ProjectActSend) => void; open: (sheet: ProjectSheet) => void },
): NextAnswer {
  switch (step.kind) {
    case 'confirm_proof':
      screen.open({ kind: 'earlyProof' });
      return null;
    case 'move':
      screen.send({ kind: 'move', to: step.to });
      return null;
    case 'dispatch':
      screen.open({ kind: 'dispatch' });
      return null;
    case 'install_date_passed':
      screen.open({ kind: 'date' });
      return null;
    case 'upload_missing':
    case 'upload_proof':
      return { kind: 'pick', place: { slot: 'document', slotKey: step.row } };
    case 'steps':
      return { kind: 'steps' };
    case 'handover':
      return { kind: 'handover' };
    default:
      return null;
  }
}
