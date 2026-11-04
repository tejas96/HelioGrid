import { billingPlanChangeContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, tenantIdOf } from '../../common/auth/session-context';
import { PlanChangeService } from './plan-change.service';

@Controller()
export class PlanChangeController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(PlanChangeService) private readonly changes: PlanChangeService) {}

  @TsRestHandler(billingPlanChangeContract)
  // Every plan act is the EPC Owner's (`M12-56`), and the billing screens stay open in every
  // billing state (`BM-32`).
  @RouteBillingMap(billingPlanChangeContract, {
    change: 'billing_screens',
    withdraw: 'billing_screens',
  })
  @RouteAccessMap(billingPlanChangeContract, {
    preview: { capability: 'billing.manage_billing' },
    change: { capability: 'billing.manage_billing' },
    withdraw: { capability: 'billing.manage_billing' },
  })
  handler(@Req() req: Request) {
    return tsRestHandler(billingPlanChangeContract, {
      preview: async ({ query }) => ({
        status: 200,
        body: await this.changes.preview(tenantIdOf(req), query, Date.now()),
      }),
      change: async ({ body }) => ({
        status: 200,
        body: await this.changes.change(tenantIdOf(req), body, actOf(req)),
      }),
      withdraw: async () => ({
        status: 200,
        body: await this.changes.withdraw(tenantIdOf(req), actOf(req)),
      }),
    });
  }
}
