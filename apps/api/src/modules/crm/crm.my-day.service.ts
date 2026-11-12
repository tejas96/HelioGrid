import type { MyDay } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.public';
import { CrmMyDayRepository } from './crm.my-day.repository';
import { moneyOf } from './internal/lead-wire';
import type { LeadReader } from './internal/reader';

/** My Day (`SCR-M07-01`): the reader's open tasks, read in the tenant's currency and on its clock. */
@Injectable()
export class CrmMyDayService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmMyDayRepository) private readonly myDay: CrmMyDayRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async read(reader: LeadReader, now: number): Promise<MyDay> {
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    const read = await this.myDay.read(reader, now, money);
    return { ...read, currencyCode: money.currencyCode };
  }
}
