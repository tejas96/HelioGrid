import type { ProjectDetail } from '@heliogrid/contracts';
import type {
  BlockerParty,
  BlockerReason,
  CancelReason,
  ProjectChainStage,
  ProjectStage,
} from '@heliogrid/domain';
import type { ProjectsRepository } from './projects-repository';

/** One act on the project, as the screen sends it. */
export type ProjectActSend =
  | { readonly kind: 'move'; readonly to: ProjectChainStage }
  | { readonly kind: 'dispatch'; readonly crew: readonly string[]; readonly leftOn: string }
  | { readonly kind: 'moveBack' }
  /** The person's own last move taken back, while its toast shows. */
  | { readonly kind: 'undo' }
  | { readonly kind: 'confirmProof'; readonly to: ProjectChainStage }
  | {
      readonly kind: 'startWait';
      readonly party: BlockerParty;
      readonly reason: BlockerReason;
      readonly startedOn: string;
      readonly note: string | null;
    }
  | { readonly kind: 'endWait' }
  | { readonly kind: 'notNeeded'; readonly row: string; readonly reason: string }
  | { readonly kind: 'reopen'; readonly row: string }
  | { readonly kind: 'tick'; readonly step: string; readonly doneBy: string | null }
  | { readonly kind: 'untick'; readonly step: string }
  | { readonly kind: 'date'; readonly expectedInstallOn: string }
  | { readonly kind: 'manager'; readonly managerId: string }
  | { readonly kind: 'access'; readonly accessNote: string | null }
  | { readonly kind: 'showFile'; readonly projectFileId: string; readonly shown: boolean }
  | { readonly kind: 'cancel'; readonly reason: CancelReason; readonly note: string | null }
  | { readonly kind: 'handover' };

/** What an act's toast says, and whether its *Undo* takes it back (a person's own move). */
export type ProjectToast =
  | { readonly kind: 'moved' | 'movedBack'; readonly stage: string; readonly undoable: boolean }
  | { readonly kind: 'undone' | 'waitEnded' | 'saved' | 'cancelled' | 'handedOver' }
  /** A line the person copied to send themselves — *Remind* on the web — or the copy refused. */
  | { readonly kind: 'copied' | 'notCopied' }
  | { readonly kind: 'waitSaved'; readonly party: string; readonly date: string }
  | { readonly kind: 'documentDone' | 'notNeeded'; readonly row: string }
  | { readonly kind: 'stepTicked'; readonly step: string };

type Acts = ProjectsRepository['acts'];

/** Each act's route and body; a move back names the stage the person saw (`stageSeen`). */
export function sendAct(
  acts: Acts,
  id: string,
  send: ProjectActSend,
  capturedAt: string,
  stageSeen: ProjectStage,
) {
  switch (send.kind) {
    case 'move':
      return acts.move(id, { to: send.to, capturedAt });
    case 'dispatch':
      return acts.dispatch(id, { crew: [...send.crew], leftOn: send.leftOn, capturedAt });
    case 'moveBack':
      return acts.moveBack(id, { from: stageSeen, capturedAt });
    case 'undo':
      return acts.undo(id, { capturedAt });
    case 'confirmProof':
      return acts.confirmProof(id, { to: send.to, capturedAt });
    case 'startWait':
      return acts.startWait(id, {
        party: send.party,
        reason: send.reason,
        startedOn: send.startedOn,
        note: send.note,
        capturedAt,
      });
    case 'endWait':
      return acts.endWait(id, { capturedAt });
    case 'notNeeded':
      return acts.documentNotNeeded(id, { row: send.row, reason: send.reason, capturedAt });
    case 'reopen':
      return acts.documentReopen(id, { row: send.row, capturedAt });
    case 'tick':
      return acts.tickStep(id, { step: send.step, doneBy: send.doneBy, capturedAt });
    case 'untick':
      return acts.untickStep(id, { step: send.step, capturedAt });
    case 'date':
      return acts.change(id, { expectedInstallOn: send.expectedInstallOn, capturedAt });
    case 'manager':
      return acts.change(id, { managerId: send.managerId, capturedAt });
    case 'access':
      return acts.change(id, { accessNote: send.accessNote, capturedAt });
    case 'showFile':
      return acts.showFile(id, {
        projectFileId: send.projectFileId,
        shown: send.shown,
        capturedAt,
      });
    case 'cancel':
      return acts.cancel(id, { reason: send.reason, note: send.note, capturedAt });
    case 'handover':
      return acts.handover(id, { capturedAt });
  }
}

/** What the act's toast says once it landed. */
export function toastOf(
  send: ProjectActSend,
  detail: ProjectDetail,
  was: ProjectDetail | undefined,
): ProjectToast {
  switch (send.kind) {
    case 'move':
    case 'dispatch':
      return { kind: 'moved', stage: detail.stage, undoable: true };
    case 'confirmProof':
      return { kind: 'moved', stage: detail.stage, undoable: false };
    case 'moveBack':
      return { kind: 'movedBack', stage: detail.stage, undoable: true };
    case 'undo':
      return { kind: 'undone' };
    case 'startWait':
      return { kind: 'waitSaved', party: send.party, date: send.startedOn };
    case 'endWait':
      return { kind: 'waitEnded' };
    case 'notNeeded':
      return { kind: 'notNeeded', row: send.row };
    case 'tick':
      // A tick that moved the project says where it went; the stage it moved to is the news.
      return was !== undefined && was.stage !== detail.stage
        ? { kind: 'moved', stage: detail.stage, undoable: false }
        : { kind: 'stepTicked', step: send.step };
    case 'cancel':
      return { kind: 'cancelled' };
    case 'handover':
      return { kind: 'handedOver' };
    default:
      return { kind: 'saved' };
  }
}
