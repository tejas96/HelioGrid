import { billingUsageContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { tenantIdOf } from '../../common/auth/session-context';
import { BillingUsageService } from './billing-usage.service';

@Controller()
export class BillingUsageController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(BillingUsageService) private readonly usage: BillingUsageService) {}

  @TsRestHandler(billingUsageContract)
  // Which meter is at its cap is everyone's; the figures and the events are the Owner's
  // (`M12-36`, `M12-56`). Every route is a read, so no billing state refuses one (`BM-32`).
  @RouteAccessMap(billingUsageContract, {
    usage: { capability: 'billing.view_usage_and_invoices' },
    signals: 'member',
    events: { capability: 'billing.view_usage_and_invoices' },
  })
  handler(@Req() req: Request) {
    return tsRestHandler(billingUsageContract, {
      usage: async () => ({
        status: 200,
        body: await this.usage.usageOf(tenantIdOf(req), Date.now()),
      }),
      signals: async () => ({
        status: 200,
        body: await this.usage.signalsOf(tenantIdOf(req), Date.now()),
      }),
      events: async ({ query }) => ({
        status: 200,
        body: await this.usage.eventsOf(tenantIdOf(req), query, Date.now()),
      }),
    });
  }
}
