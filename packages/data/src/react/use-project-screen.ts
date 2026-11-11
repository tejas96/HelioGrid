'use client';
import { type ProjectDetail, uuidSchema } from '@heliogrid/contracts';
import {
  CANCELLED_STAGE,
  isProjectStage,
  type NextStep,
  type ProjectDetailView,
  projectDetailViewOf,
  type Read,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import {
  type ProjectActSend,
  type ProjectToast,
  sendAct,
  toastOf,
} from '../projects/project-act-send';
import { ProjectActRefusedError } from '../projects/projects-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import type { PickedFile } from './picked-file';
import { type FilePlace, type NextAnswer, nextOf, type ProjectSheet } from './project-hero-act';
import { recordReadOf } from './read';
import type { ProjectAsk } from './use-project-board-screen';
import { useProjectPeople } from './use-project-people';
import { useProjectUpload } from './use-project-upload';
import { useTenantId } from './use-tenant-id';

export type { ProjectActSend, ProjectToast } from '../projects/project-act-send';
export type { FilePlace, NextAnswer, ProjectSheet } from './project-hero-act';

/** The project as the screen draws it: the read, and domain's view of it. */
export interface ProjectShown {
  readonly project: ProjectDetail;
  readonly view: ProjectDetailView;
}

/** The project read — never empty — or `unavailable` when it answered 404: out of reach, or gone. */
export type ProjectRead =
  | Exclude<Read<ProjectShown>, { readonly kind: 'empty' }>
  | { readonly kind: 'unavailable' };

export interface ProjectScreen {
  readonly read: ProjectRead;
  readonly sheet: ProjectSheet | null;
  /** Who the open sheet picks from: the installation team at *Dispatched*, the managers for a new one. */
  readonly people: ReturnType<typeof useProjectPeople>;
  open(sheet: ProjectSheet): void;
  /** Every way out of the sheet — refused while its send is out. */
  close(): void;
  readonly sending: boolean;
  /** Why the last act came back refused, worded by the screen; `null` once a new act starts. */
  readonly refusal: string | null;
  readonly failed: boolean;
  send(act: ProjectActSend): void;
  readonly toast: ProjectToast | null;
  /** A toast the screen itself raises — a line copied for the person to send. */
  say(toast: ProjectToast): void;
  /**
   * The project's last move as the read now holds it — who made it and where it went — so a move a
   * second person made first is told with their name (ruling 16).
   */
  readonly lastMove: { readonly by: string | null; readonly stage: string } | null;
  dismissToast(): void;
  undo(): void;
  /**
   * A picked file into its place: a row's document or a step's photo goes up at once; another
   * file opens its name first (`naming`), and goes up under the name the person gives it.
   */
  upload(file: PickedFile, place: FilePlace): void;
  /** The other file waiting for its name, while its sheet is open. */
  readonly naming: { readonly name: string } | null;
  nameFile(name: string): void;
  /** The last upload, sent again — the *Retry* of a file that did not reach the project. */
  retryUpload(): void;
  /**
   * The hero's act: a move, a proof confirmed, a sheet opened — or what the screen does itself:
   * pick the document the step waits for, or open the handover.
   */
  next(step: NextStep): NextAnswer;
  /** A file's short-lived link, to open it. */
  fileLink(fileId: string): Promise<string>;
  /** The place whose file is uploading, and the one whose upload came back undone. */
  readonly uploading: FilePlace | null;
  readonly uploadFailed: FilePlace | null;
}

const now = () => new Date().toISOString();

/**
 * One project (`SCR-M08-02`…`04`) as both screens draw it, assembled once (Law 11): the read and
 * `projectDetailViewOf`'s view, every act in its sheet or its row, the toast each act leaves with its
 * *Undo* where a person's own move can be taken back, and a picked file stored then put in place.
 */
export function useProjectScreen(projectId: string, ask: ProjectAsk | null = null): ProjectScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const key = queryKeys.projects.detail(tenantId, projectId);
  const [sheet, setSheet] = useState<ProjectSheet | null>(firstSheetOf(ask));
  const [toast, setToast] = useState<ProjectToast | null>(null);
  const [naming, setNaming] = useState<PickedFile | null>(null);
  const people = useProjectPeople(peopleFor(sheet));
  // An address that names no project — a typed or cut-off link — is gone, never a read to retry.
  const wellFormed = uuidSchema.safeParse(projectId).success;
  const project = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.projects.detail(projectId, signal),
    enabled: tenantId !== '' && wellFormed,
  });
  const landed = async (detail: ProjectDetail) => {
    queryClient.setQueryData(key, detail);
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects.board(tenantId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects.jobs(tenantId) });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.projects.handover(tenantId, projectId),
    });
  };
  const acts = repositories.projects.acts;
  const action = useAction(
    async (send: ProjectActSend): Promise<{ detail: ProjectDetail; toast: ProjectToast }> => {
      const capturedAt = now();
      const was = project.data;
      // A stage this build does not know is no stage the person saw: the move back is refused.
      const seen = was !== undefined && isProjectStage(was.stage) ? was.stage : CANCELLED_STAGE;
      const detail = await sendAct(acts, projectId, send, capturedAt, seen);
      return { detail, toast: toastOf(send, detail, was) };
    },
    {
      onDone: async ({ detail, toast: said }) => {
        await landed(detail);
        setSheet(null);
        setToast(said);
      },
      // A refusal means the project is not as the page drew it — another person moved it, ticked a
      // step, closed it: it is read again, so the page shows where it stands now.
      onFailed: (error) => {
        if (error instanceof ProjectActRefusedError) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      },
    },
  );
  const upload = useProjectUpload(projectId, landed, (said) => {
    setSheet(null);
    setNaming(null);
    setToast(said);
  });
  // A refusal answers the act that drew it; a sheet opened after it starts a new act.
  const openSheet = (next: ProjectSheet) => {
    if (action.pending) return;
    action.clear();
    setSheet(next);
  };
  const read = recordReadOf(project);
  const shown =
    read.kind === 'ready'
      ? {
          kind: 'ready' as const,
          value: { project: read.value, view: projectDetailViewOf(read.value) },
        }
      : read;
  const view = shown.kind === 'ready' ? shown.value.view : null;
  const unavailable = !wellFormed || isGone(project);
  return {
    read: unavailable ? { kind: 'unavailable' } : shown,
    sheet: askedOf(sheet, view),
    people,
    open: openSheet,
    close: () => {
      if (!action.isOut()) {
        setSheet(null);
        setNaming(null);
        action.clear();
      }
    },
    // The name sheet sends the file it names: it is busy while that file goes up, and a file that
    // did not go up is said in it, where the person acted, until it goes up or the sheet closes.
    sending: action.pending || (naming !== null && upload.uploading !== null),
    refusal: action.failure instanceof ProjectActRefusedError ? action.failure.refusal : null,
    failed:
      (action.failure !== null && !(action.failure instanceof ProjectActRefusedError)) ||
      (naming !== null && upload.uploadFailed !== null),
    send: (send) => void action.run(send),
    toast,
    say: setToast,
    lastMove: lastMoveOf(project.data),
    dismissToast: () => setToast(null),
    undo: () => {
      setToast(null);
      void action.run({ kind: 'undo' });
    },
    upload: (file, place) => {
      if (place.slot !== 'other') return upload.store(file, place);
      setNaming(file);
      setSheet({ kind: 'file' });
    },
    naming: naming === null ? null : { name: naming.name },
    nameFile: (name) => {
      if (naming !== null) upload.store({ ...naming, name }, { slot: 'other', slotKey: null });
    },
    next: (step) => nextOf(step, { send: (act) => void action.run(act), open: openSheet }),
    fileLink: (fileId) => repositories.file.downloadUrl(fileId).then((link) => link.url),
    retryUpload: upload.retry,
    uploading: upload.uploading,
    uploadFailed: upload.uploadFailed,
  };
}

/** Opened from the board's early proof, the page asks in that proof's own sheet first. */
function firstSheetOf(ask: ProjectAsk | null): ProjectSheet | null {
  return ask === 'earlyProof' ? { kind: 'earlyProof' } : null;
}

/** Who the open sheet picks from: the installation team at *Dispatched*, the managers for a new one. */
function peopleFor(sheet: ProjectSheet | null): 'crew' | 'manager' | null {
  if (sheet?.kind === 'dispatch') return 'crew';
  return sheet?.kind === 'manager' ? 'manager' : null;
}

/**
 * The sheet shown: the early-proof sheet asks only while the proof is still early — never over a
 * page still loading, or one another person has already moved.
 */
function askedOf(sheet: ProjectSheet | null, view: ProjectDetailView | null): ProjectSheet | null {
  if (sheet?.kind !== 'earlyProof') return sheet;
  return view?.next.kind === 'confirm_proof' ? sheet : null;
}

/** The project answered 404 with nothing read before: out of reach, or gone. */
function isGone(project: { data: unknown; error: unknown }): boolean {
  return (
    project.data === undefined && project.error instanceof ApiError && project.error.status === 404
  );
}

/** Who made the project's last move, and the stage it stands at now. */
function lastMoveOf(detail: ProjectDetail | undefined): ProjectScreen['lastMove'] {
  if (detail === undefined) return null;
  const last = detail.journey.at(-1);
  return { by: last?.movedBy?.name ?? null, stage: detail.stage };
}
