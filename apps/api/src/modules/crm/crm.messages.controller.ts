import { leadMessagesContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmMessagesService } from './crm.messages.service';
import { readerOf } from './internal/reader';

/**
 * Compose message (`SCR-M02-04`): the add-and-edit grant's. Composing writes a timeline entry, so
 * it is a record edit in the billing matrix.
 */
@Controller()
export class CrmMessagesController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmMessagesService) private readonly messages: CrmMessagesService) {}

  @TsRestHandler(leadMessagesContract)
  @RouteBillingMap(leadMessagesContract, { compose: 'create_edit_records' })
  @RouteAccessMap(leadMessagesContract, { compose: { capability: 'crm.add_edit_leads' } })
  handler(@Req() req: Request) {
    return tsRestHandler(leadMessagesContract, {
      compose: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.messages.compose(readerOf(req), params.id, body, headers, actOf(req)),
      }),
    });
  }
}
