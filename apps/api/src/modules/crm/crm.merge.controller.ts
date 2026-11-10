import { customerMergeContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmMergeService } from './crm.merge.service';
import { readerOf } from './internal/reader';

const MERGE = { capability: 'crm.merge_customers' } as const;

/**
 * Customer merge (`M02-59`…`M02-63`): the Owner's and the Sales Manager's grant, both the compare
 * read and the merge; the merge is a record edit in the billing matrix.
 */
@Controller()
export class CrmMergeController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmMergeService) private readonly merges: CrmMergeService) {}

  @TsRestHandler(customerMergeContract)
  @RouteBillingMap(customerMergeContract, { merge: 'create_edit_records' })
  @RouteAccessMap(customerMergeContract, { preview: MERGE, merge: MERGE })
  handler(@Req() req: Request) {
    return tsRestHandler(customerMergeContract, {
      preview: async ({ query }) => ({
        status: 200,
        body: await this.merges.preview(readerOf(req), query),
      }),
      merge: async ({ body }) => ({
        status: 200,
        body: await this.merges.merge(readerOf(req), body, actOf(req)),
      }),
    });
  }
}
