import { leadsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { CrmLeadsService } from './crm.leads.service';
import { readerOf } from './internal/reader';

/**
 * The leads reads (`SCR-M02-02` … `04`). Every member reads through their lead scope — a preset
 * that reaches no lead reads an empty list and 404s — and no read is billing-gated (`M12-23`).
 */
@Controller()
export class CrmLeadsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmLeadsService) private readonly leads: CrmLeadsService) {}

  @TsRestHandler(leadsContract)
  @RouteAccessMap(leadsContract, { list: 'member', inbox: 'member', detail: 'member' })
  handler(@Req() req: Request) {
    return tsRestHandler(leadsContract, {
      list: async ({ query }) => ({
        status: 200,
        body: await this.leads.list(readerOf(req), query),
      }),
      inbox: async ({ query }) => ({
        status: 200,
        body: await this.leads.inbox(readerOf(req), query, Date.now()),
      }),
      detail: async ({ params }) => ({
        status: 200,
        body: await this.leads.detail(readerOf(req), params.id),
      }),
    });
  }
}
