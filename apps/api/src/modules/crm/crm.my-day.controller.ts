import { myDayContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { CrmMyDayService } from './crm.my-day.service';
import { readerOf } from './internal/reader';

/**
 * My Day (`SCR-M07-01`): every member reads their own tasks through their lead scope — a preset
 * that reaches no lead reads an empty day — and no read is billing-gated (`M12-23`).
 */
@Controller()
export class CrmMyDayController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmMyDayService) private readonly myDay: CrmMyDayService) {}

  @TsRestHandler(myDayContract)
  @RouteAccessMap(myDayContract, { read: 'member' })
  handler(@Req() req: Request) {
    return tsRestHandler(myDayContract, {
      read: async () => ({ status: 200, body: await this.myDay.read(readerOf(req), Date.now()) }),
    });
  }
}
