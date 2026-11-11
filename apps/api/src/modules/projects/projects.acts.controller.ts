import { projectActsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { actorNameOf, readerOf } from '../crm/crm.public';
import { projectReaderOf } from './internal/reader';
import {
  cancelWith,
  confirmProof,
  dispatchWith,
  handOver,
  moveBack,
  moveTo,
  undoLast,
} from './projects.acts.repository';
import { type ProjectStep, ProjectsActsService } from './projects.acts.service';
import {
  attachFile,
  documentNotNeeded,
  documentReopen,
  showFile,
  tickStep,
  untickStep,
} from './projects.files.repository';
import { changeDetails, endWait, startWait } from './projects.waits.repository';
import { ProjectsWonService } from './projects.won.service';

const STAGES = { capability: 'projects.update_stages' } as const;
const DOCUMENTS = { capability: 'projects.project_documents' } as const;
const STEPS = { capability: 'projects.installation_checklist' } as const;

/**
 * The project acts and *Mark won* (`M07-62`, `M08-14`…`M08-46`). The stage, the wait, the
 * manager's facts, cancel and handover are the update-stages grant's; the checklist is the
 * documents grant's; the ticks are the installation checklist's. A file is either a document or a
 * step's photo, so its route admits every member and the act names the grant it takes. Every act
 * is a project update in the billing matrix (`sell_and_deliver`).
 */
@Controller()
export class ProjectsActsController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsActsService) private readonly acts: ProjectsActsService,
    @Inject(ProjectsWonService) private readonly won: ProjectsWonService,
  ) {}

  @TsRestHandler(projectActsContract)
  @RouteBillingMap(projectActsContract, {
    markWon: 'sell_and_deliver',
    move: 'sell_and_deliver',
    dispatch: 'sell_and_deliver',
    moveBack: 'sell_and_deliver',
    undo: 'sell_and_deliver',
    confirmProof: 'sell_and_deliver',
    startWait: 'sell_and_deliver',
    endWait: 'sell_and_deliver',
    documentNotNeeded: 'sell_and_deliver',
    documentReopen: 'sell_and_deliver',
    attachFile: 'sell_and_deliver',
    showFile: 'sell_and_deliver',
    tickStep: 'sell_and_deliver',
    untickStep: 'sell_and_deliver',
    change: 'sell_and_deliver',
    cancel: 'sell_and_deliver',
    handover: 'sell_and_deliver',
  })
  @RouteAccessMap(projectActsContract, {
    markWon: { capability: 'sales.mark_won_lost' },
    move: STAGES,
    dispatch: STAGES,
    moveBack: STAGES,
    undo: STAGES,
    confirmProof: STAGES,
    startWait: STAGES,
    endWait: STAGES,
    documentNotNeeded: DOCUMENTS,
    documentReopen: DOCUMENTS,
    attachFile: 'member',
    showFile: DOCUMENTS,
    tickStep: STEPS,
    untickStep: STEPS,
    change: STAGES,
    cancel: STAGES,
    handover: STAGES,
  })
  handler(@Req() req: Request) {
    const reader = projectReaderOf(req);
    const act = actOf(req);
    const name = actorNameOf(req);
    const run = (
      id: string,
      capturedAt: string,
      step: ProjectStep,
      needs?: Parameters<ProjectsActsService['run']>[6],
    ) =>
      this.acts
        .run(reader, id, capturedAt, act, name, step, needs)
        .then((body) => ({ status: 200 as const, body }));
    return tsRestHandler(projectActsContract, {
      markWon: async ({ params, body, headers }) => {
        const made = await this.won.markWon(readerOf(req), params.id, body, headers, act);
        return { status: 201, body: { projectId: made.projectId, number: made.number } };
      },
      move: ({ params, body }) => run(params.id, body.capturedAt, (c) => moveTo(c, body.to)),
      dispatch: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => dispatchWith(c, body.crew, body.leftOn)),
      moveBack: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => moveBack(c, body.from)),
      undo: ({ params, body }) => run(params.id, body.capturedAt, (c) => undoLast(c)),
      confirmProof: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => confirmProof(c, body.to)),
      startWait: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) =>
          startWait(
            c,
            { party: body.party, reason: body.reason, startedOn: body.startedOn },
            body.note,
          ),
        ),
      endWait: ({ params, body }) => run(params.id, body.capturedAt, (c) => endWait(c)),
      documentNotNeeded: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => documentNotNeeded(c, body.row, body.reason)),
      documentReopen: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => documentReopen(c, body.row)),
      attachFile: ({ params, body }) =>
        run(
          params.id,
          body.capturedAt,
          (c) => attachFile(c, body),
          body.slot === 'step' ? 'projects.installation_checklist' : 'projects.project_documents',
        ),
      showFile: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => showFile(c, body.projectFileId, body.shown)),
      tickStep: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => tickStep(c, body.step, body.doneBy)),
      untickStep: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) => untickStep(c, body.step)),
      change: ({ params, body }) => run(params.id, body.capturedAt, (c) => changeDetails(c, body)),
      cancel: ({ params, body }) =>
        run(params.id, body.capturedAt, (c) =>
          cancelWith(c, { reason: body.reason, note: body.note }),
        ),
      handover: ({ params, body }) => run(params.id, body.capturedAt, (c) => handOver(c)),
    });
  }
}
