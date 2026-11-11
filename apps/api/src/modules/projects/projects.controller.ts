import { projectsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { projectReaderOf } from './internal/reader';
import { ProjectsService } from './projects.service';

/**
 * The projects' reads (`SCR-M08-01`…`SCR-M08-06`). Every member may ask; the projects they reach
 * are their scope's (`F2-14`) — a preset that reaches none reads an empty board, and a project out
 * of reach answers 404.
 */
@Controller()
export class ProjectsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ProjectsService) private readonly projects: ProjectsService) {}

  @TsRestHandler(projectsContract)
  @RouteAccessMap(projectsContract, {
    board: 'member',
    closed: 'member',
    detail: 'member',
    handoverPreview: { capability: 'projects.update_stages' },
    people: 'member',
    jobs: 'member',
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
    });
  }
}
