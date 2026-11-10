import { visitsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, tenantIdOf } from '../../common/auth/session-context';
import { CrmVisitsService } from './crm.visits.service';
import { readerOf } from './internal/reader';

const BOOK_VISIT = { capability: 'crm.book_site_visit' } as const;

/**
 * Book visit (`SCR-M02-04`): the book-site-visit grant's — the surveyor list included, since only a
 * booker opens it. A booking is a record in the billing matrix; the list is a read, never paused.
 */
@Controller()
export class CrmVisitsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmVisitsService) private readonly visits: CrmVisitsService) {}

  @TsRestHandler(visitsContract)
  @RouteBillingMap(visitsContract, {
    book: 'create_edit_records',
    reschedule: 'create_edit_records',
  })
  @RouteAccessMap(visitsContract, {
    surveyors: BOOK_VISIT,
    book: BOOK_VISIT,
    reschedule: BOOK_VISIT,
  })
  handler(@Req() req: Request) {
    return tsRestHandler(visitsContract, {
      surveyors: async () => ({ status: 200, body: await this.visits.surveyors(tenantIdOf(req)) }),
      book: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.visits.book(readerOf(req), params.id, body, headers, actOf(req)),
      }),
      reschedule: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.visits.reschedule(readerOf(req), params.id, body, headers, actOf(req)),
      }),
    });
  }
}
