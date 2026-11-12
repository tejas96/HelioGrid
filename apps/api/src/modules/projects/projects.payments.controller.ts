import { paymentsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { creationKeyOf } from '../../common/creation-key';
import { actorNameOf } from '../crm/crm.public';
import { projectReaderOf } from './internal/reader';
import { ProjectsPaymentsService } from './projects.payments.service';

const RECORD = { capability: 'payments.record_payments' } as const;

/**
 * A project's money (`M11`): the reads are every member's within the projects whose money they
 * may see — never the crew's (`M11-56`); recording and reversing are `F2.M11.record-payments`,
 * waiving `F2.M11.waive-tranche`, sharing a request `F2.M11.send-request-message`.
 */
@Controller()
export class ProjectsPaymentsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsPaymentsService) private readonly payments: ProjectsPaymentsService,
  ) {}

  @TsRestHandler(paymentsContract)
  @RouteBillingMap(paymentsContract, {
    record: 'sell_and_deliver',
    reverse: 'sell_and_deliver',
    waive: 'sell_and_deliver',
    shared: 'sell_and_deliver',
  })
  @RouteAccessMap(paymentsContract, {
    moneyDue: 'member',
    payments: 'member',
    receipt: 'member',
    record: RECORD,
    reverse: RECORD,
    waive: { capability: 'payments.waive_tranche' },
    shared: { capability: 'payments.send_request_message' },
  })
  handler(@Req() req: Request) {
    const reader = projectReaderOf(req);
    const actor = () => ({ act: actOf(req), name: actorNameOf(req) });
    return tsRestHandler(paymentsContract, {
      moneyDue: async ({ query }) => ({
        status: 200,
        body: await this.payments.moneyDue(reader, query, Date.now()),
      }),
      payments: async ({ params }) => ({
        status: 200,
        body: await this.payments.payments(reader, params.id, Date.now()),
      }),
      receipt: async ({ params }) => ({
        status: 200,
        body: await this.payments.receipt(reader, params.id, params.entryId),
      }),
      record: async ({ params, body, headers }) => {
        const act = actOf(req);
        const key = creationKeyOf(headers, act.actorUserId, paymentsContract.record, {
          projectId: params.id,
          ...body,
        });
        return {
          status: 201,
          body: await this.payments.record(reader, params.id, body, {
            act,
            name: actorNameOf(req),
            key,
          }),
        };
      },
      reverse: async ({ params, body }) => ({
        status: 200,
        body: await this.payments.reverse(reader, params.id, params.entryId, body.reason, actor()),
      }),
      waive: async ({ params, body }) => ({
        status: 200,
        body: await this.payments.waive(reader, params.id, params.partId, body.reason, actor()),
      }),
      shared: async ({ params }) => ({
        status: 200,
        body: await this.payments.shared(reader, params.id, params.partId, actor()),
      }),
    });
  }
}
