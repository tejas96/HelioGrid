import type { ProjectDetail } from '@heliogrid/contracts';
import {
  type BlockerParty,
  type BlockerReason,
  type CancelReason,
  chainOf,
  isProjectStage,
  type ProjectChainStage,
  type Read,
} from '@heliogrid/domain';
import type { ProjectActForm, ProjectPersonChoice } from './ProjectActSheet.types';

/** The sheet the project's screen has open — `useProjectScreen`'s, by shape. */
export type ProjectSheetOpen =
  | {
      readonly kind:
        | 'dispatch'
        | 'wait'
        | 'cancel'
        | 'date'
        | 'manager'
        | 'access'
        | 'file'
        | 'earlyProof';
    }
  | { readonly kind: 'notNeeded'; readonly row: string };

/** What a sheet's send hands the screen — `useProjectScreen`'s `send`, by shape. */
export type ProjectSheetAct =
  | { readonly kind: 'dispatch'; readonly crew: readonly string[]; readonly leftOn: string }
  | {
      readonly kind: 'startWait';
      readonly party: BlockerParty;
      readonly reason: BlockerReason;
      readonly startedOn: string;
      // biome-ignore lint/plugin/copy-prop-type: the team's own note, sent as typed — a fact
      readonly note: string | null;
    }
  // biome-ignore lint/plugin/copy-prop-type: a reason the person typed — a fact
  | { readonly kind: 'notNeeded'; readonly row: string; readonly reason: string }
  // biome-ignore lint/plugin/copy-prop-type: the note the person typed — a fact
  | { readonly kind: 'cancel'; readonly reason: CancelReason; readonly note: string | null }
  | { readonly kind: 'confirmProof'; readonly to: ProjectChainStage }
  | { readonly kind: 'date'; readonly expectedInstallOn: string }
  | { readonly kind: 'manager'; readonly managerId: string }
  // biome-ignore lint/plugin/copy-prop-type: the manager's note, sent as typed — a fact
  | { readonly kind: 'access'; readonly accessNote: string | null };

/** What the sheet reads and sends on the project's screen; `useProjectScreen` satisfies it. */
export interface ProjectSheetScreen {
  readonly sheet: ProjectSheetOpen | null;
  readonly people: Read<readonly ProjectPersonChoice[]>;
  send(act: ProjectSheetAct): void;
  /** A picked file waiting for its name, before it goes up as an other file. */
  readonly naming: { readonly name: string } | null;
  nameFile(name: string): void;
}

/** The project's name as a sheet says it: the customer's, else its number. */
function nameOf(project: ProjectDetail): string {
  return project.customer.name ?? project.number;
}

/**
 * The early proof's move: where it stands, the stages of its deal's chain the move counts as passed,
 * and the stage the proof moves it to — none when the project no longer asks it.
 */
function earlyOf(
  project: ProjectDetail,
): { readonly to: ProjectChainStage; readonly passed: readonly string[] } | null {
  const to = project.earlyProofTo;
  if (to === null || !isProjectStage(to) || !isProjectStage(project.stage)) return null;
  const chain = chainOf({ stage: project.stage, incentiveApplies: project.incentiveApplies });
  const from = chain.indexOf(project.stage as ProjectChainStage);
  const until = chain.indexOf(to as ProjectChainStage);
  if (from < 0 || until <= from) return null;
  return { to: to as ProjectChainStage, passed: chain.slice(from + 1, until) };
}

function earlyFormOf(
  project: ProjectDetail,
  send: (act: ProjectSheetAct) => void,
): ProjectActForm | null {
  const early = earlyOf(project);
  if (early === null) return null;
  const { to, passed } = early;
  return {
    kind: 'earlyProof',
    name: nameOf(project),
    at: project.stage,
    passed,
    to,
    row: project.documents.find((document) => document.movesTo === to)?.row ?? null,
    onSend: () => send({ kind: 'confirmProof', to }),
  };
}

/**
 * The open sheet's form, from the project as it stands — the last crew ticked, the date and the
 * note as they are — so both screens open the same form for the same sheet (Law 11).
 */
export function projectActFormOf(
  screen: ProjectSheetScreen,
  project: ProjectDetail,
  addCrew: () => void,
): ProjectActForm | null {
  const { sheet, people } = screen;
  const send = (act: ProjectSheetAct) => screen.send(act);
  const name = nameOf(project);
  switch (sheet?.kind) {
    case undefined:
      return null;
    case 'dispatch':
      return {
        kind: 'dispatch',
        name,
        place: project.customer.city,
        people,
        start: project.crew.map((member) => member.userId),
        firstDay: project.enteredOn,
        today: project.today,
        waitingOn: project.wait?.party ?? null,
        onSend: (crew, leftOn) => send({ kind: 'dispatch', crew, leftOn }),
        onAddCrew: addCrew,
      };
    case 'wait':
      return {
        kind: 'wait',
        name,
        today: project.today,
        onSend: (wait) => send({ kind: 'startWait', ...wait }),
      };
    case 'earlyProof':
      return earlyFormOf(project, send);
    case 'notNeeded': {
      const { row } = sheet;
      return {
        kind: 'notNeeded',
        row,
        onSend: (reason) => send({ kind: 'notNeeded', row, reason }),
      };
    }
    case 'cancel':
      return {
        kind: 'cancel',
        name,
        onSend: (reason, note) => send({ kind: 'cancel', reason, note }),
      };
    case 'date':
      return {
        kind: 'date',
        start: project.expectedInstallOn,
        firstDay: project.today,
        onSend: (date) => send({ kind: 'date', expectedInstallOn: date }),
      };
    case 'manager':
      return {
        kind: 'manager',
        people,
        start: project.manager.userId,
        onSend: (managerId) => send({ kind: 'manager', managerId }),
      };
    case 'access':
      return {
        kind: 'access',
        start: project.accessNote,
        onSend: (accessNote) => send({ kind: 'access', accessNote }),
      };
    case 'file':
      return screen.naming === null
        ? null
        : { kind: 'fileName', start: screen.naming.name, onSend: (name) => screen.nameFile(name) };
  }
}
