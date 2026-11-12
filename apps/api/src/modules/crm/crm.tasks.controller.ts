import { tasksContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmTasksService } from './crm.tasks.service';
import { readerOf } from './internal/reader';

/**
 * Follow-up tasks (`M07-05`): adding one to a lead is the add-and-edit grant's. Done, move and
 * reopen are any member's whose task it is or who may work its lead — a surveyor closes the site
 * visit they hold — and the service judges which. Each is a record edit in the billing matrix.
 */
@Controller()
export class CrmTasksController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmTasksService) private readonly tasks: CrmTasksService) {}

  @TsRestHandler(tasksContract)
  @RouteBillingMap(tasksContract, {
    create: 'create_edit_records',
    done: 'create_edit_records',
    move: 'create_edit_records',
    reopen: 'create_edit_records',
  })
  @RouteAccessMap(tasksContract, {
    create: { capability: 'crm.add_edit_leads' },
    done: 'member',
    move: 'member',
    reopen: 'member',
  })
  handler(@Req() req: Request) {
    return tsRestHandler(tasksContract, {
      create: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.tasks.create(readerOf(req), params.id, body, headers, actOf(req)),
      }),
      done: async ({ params, body }) => ({
        status: 200,
        body: await this.tasks.done(readerOf(req), params.id, body, actOf(req)),
      }),
      move: async ({ params, body }) => ({
        status: 200,
        body: await this.tasks.move(readerOf(req), params.id, body),
      }),
      reopen: async ({ params }) => ({
        status: 200,
        body: await this.tasks.reopen(readerOf(req), params.id),
      }),
    });
  }
}
