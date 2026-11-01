import { billingHomeContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { tenantIdOf } from '../../common/auth/session-context';
import { BillingHomeService } from './billing-home.service';

@Controller()
export class BillingHomeController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(BillingHomeService) private readonly home: BillingHomeService) {}

  @TsRestHandler(billingHomeContract)
  // Seeing the state is everyone's; money and the records are the Owner's (`M12-56`). Every route
  // is a read, so no billing state refuses one (`BM-32`).
  @RouteAccessMap(billingHomeContract, {
    standing: 'member',
    home: { capability: 'billing.view_usage_and_invoices' },
    documents: { capability: 'billing.view_usage_and_invoices' },
    reminders: { capability: 'billing.view_usage_and_invoices' },
    history: { capability: 'billing.view_usage_and_invoices' },
  })
  handler(@Req() req: Request) {
    return tsRestHandler(billingHomeContract, {
      standing: async () => ({
        status: 200,
        body: await this.home.standing(tenantIdOf(req), Date.now()),
      }),
      home: async () => ({ status: 200, body: await this.home.home(tenantIdOf(req), Date.now()) }),
      documents: async ({ query }) => ({
        status: 200,
        body: await this.home.documents(tenantIdOf(req), query),
      }),
      reminders: async ({ query }) => ({
        status: 200,
        body: await this.home.reminders(tenantIdOf(req), query, Date.now()),
      }),
      history: async ({ query }) => ({
        status: 200,
        body: await this.home.history(tenantIdOf(req), query),
      }),
    });
  }
}
