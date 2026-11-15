import { projectsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { readerOf } from '../crm/crm.public';
import { projectReaderOf } from './internal/reader';
import { ProjectsHandoffService } from './projects.handoff.service';
import { ProjectsService } from './projects.service';

/**
 * The projects' reads (`SCR-M08-01`…`SCR-M08-06`). Every member may ask; the projects they reach
 * are their scope's (`F2-14`) — a preset that reaches none reads an empty board, and a project out
 * of reach answers 404. What Mark won opens on is the seller's; a version in force is confirmed by
 * the two people the customer deals with; the crew message is the manager's to send.
 */
@Controller()
export class ProjectsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsService) private readonly projects: ProjectsService,
    @Inject(ProjectsHandoffService) private readonly handoff: ProjectsHandoffService,
  ) {}

  @TsRestHandler(projectsContract)
  @RouteAccessMap(projectsContract, {
    board: 'member',
    closed: 'member',
    detail: 'member',
    handoverPreview: { capability: 'projects.update_stages' },
    people: 'member',
    jobs: 'member',
    wonBasis: { capability: 'sales.mark_won_lost' },
    // Every member may ask; only the lead's owner or the project's manager is answered (`M08-50`).
    versionInForcePreview: 'member',
    crewMessage: { capability: 'projects.update_stages' },
  })
  handler(@Req() req: Request) {
    const reader = projectReaderOf(req);
    return tsRestHandler(projectsContract, {
      board: async () => ({ status: 200, body: await this.projects.board(reader) }),
      closed: async ({ query }) => ({
        status: 200,
        body: await this.projects.closed(reader, query),
      }),
      detail: async ({ params }) => ({
        status: 200,
        body: await this.projects.detail(reader, params.id),
      }),
      handoverPreview: async ({ params }) => ({
        status: 200,
        body: await this.projects.handoverPreview(reader, params.id),
      }),
      people: async ({ query }) => ({
        status: 200,
        body: await this.projects.people(reader, query.role),
      }),
      jobs: async () => ({ status: 200, body: await this.projects.jobs(reader) }),
      wonBasis: async ({ params }) => ({
        status: 200,
        body: await this.handoff.wonBasis(readerOf(req), params.id),
      }),
      versionInForcePreview: async ({ params }) => ({
        status: 200,
        body: await this.handoff.preview(reader, params.id, params.version),
      }),
      crewMessage: async ({ params }) => ({
        status: 200,
        body: await this.handoff.crewMessage(reader, params.id),
      }),
    });
  }
}
