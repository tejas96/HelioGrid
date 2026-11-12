import { leadLifecycleContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmLifecycleService } from './crm.lifecycle.service';
import { readerOf } from './internal/reader';

const STATE_CHANGES = { capability: 'crm.lead_state_changes' } as const;

/**
 * The lead's acts (`SCR-M02-04`): *Mark qualified* is the add-and-edit grant's, since the qualify
 * card is the lead's own edit; snooze, wake, disqualify, junk and reopen are the state-change
 * grant's (`F2.M02.lead-state-changes`); Mark lost is the close grant's (`F2.M07.mark-won-lost`).
 * Each is a record edit in the billing matrix.
 */
@Controller()
export class CrmLifecycleController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmLifecycleService) private readonly lifecycle: CrmLifecycleService) {}

  @TsRestHandler(leadLifecycleContract)
  @RouteBillingMap(leadLifecycleContract, {
    markQualified: 'create_edit_records',
    snooze: 'create_edit_records',
    wake: 'create_edit_records',
    disqualify: 'create_edit_records',
    junk: 'create_edit_records',
    lost: 'create_edit_records',
    reopen: 'create_edit_records',
  })
  @RouteAccessMap(leadLifecycleContract, {
    markQualified: { capability: 'crm.add_edit_leads' },
    snooze: STATE_CHANGES,
    wake: STATE_CHANGES,
    disqualify: STATE_CHANGES,
    junk: STATE_CHANGES,
    lost: { capability: 'sales.mark_won_lost' },
    reopen: STATE_CHANGES,
  })
  handler(@Req() req: Request) {
    const answer = async (detail: ReturnType<CrmLifecycleService['wake']>) => ({
      status: 200 as const,
      body: await detail,
    });
    return tsRestHandler(leadLifecycleContract, {
      markQualified: ({ params, body }) =>
        answer(this.lifecycle.markQualified(readerOf(req), params.id, body, actOf(req))),
      snooze: ({ params, body }) =>
        answer(this.lifecycle.snooze(readerOf(req), params.id, body, actOf(req))),
      wake: ({ params, body }) =>
        answer(this.lifecycle.wake(readerOf(req), params.id, body, actOf(req))),
      disqualify: ({ params, body }) =>
        answer(this.lifecycle.disqualify(readerOf(req), params.id, body, actOf(req))),
      lost: ({ params, body }) =>
        answer(this.lifecycle.lost(readerOf(req), params.id, body, actOf(req))),
      junk: ({ params, body }) =>
        answer(this.lifecycle.junk(readerOf(req), params.id, body, actOf(req))),
      reopen: ({ params, body }) =>
        answer(this.lifecycle.reopen(readerOf(req), params.id, body, actOf(req))),
    });
  }
}
