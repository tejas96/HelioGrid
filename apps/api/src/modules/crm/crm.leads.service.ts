import type {
  LeadDetail,
  LeadInbox,
  LeadList,
  LeadListQuery,
  PaginationQuery,
} from '@heliogrid/contracts';
import { searchQueryOf } from '@heliogrid/domain';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { minorUnitsOnField } from '../../common/errors/minor-units-on-field';
import { SettingsService } from '../settings/settings.public';
import { CrmLeadsRepository, type LeadListFilters } from './crm.leads.repository';
import { moneyOf } from './internal/lead-wire';
import { pageOf } from './internal/page';
import type { LeadReader } from './internal/reader';

/**
 * A bill bound typed in the tenant's currency, as minor units — refused on the field when it is
 * finer than the currency's smallest unit, never rounded.
 */
function boundOf(amount: string | undefined, digits: number, path: string): number | undefined {
  return amount === undefined ? undefined : minorUnitsOnField(amount, digits, path);
}

/** The leads reads (`SCR-M02-02` … `04`): the list, the inbox and one lead, in the reader's scope. */
@Injectable()
export class CrmLeadsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmLeadsRepository) private readonly leads: CrmLeadsRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async list(reader: LeadReader, query: LeadListQuery): Promise<LeadList> {
    const { formats } = await this.settings.packOf(reader.tenantId);
    const money = moneyOf(formats);
    const asked = query.q === undefined ? null : searchQueryOf(formats, query.q);
    const filters: LeadListFilters = {
      stage: query.stage,
      state: query.state,
      source: query.source,
      ownerId: query.ownerId,
      unassigned: query.unassigned,
      billMinMinor: boundOf(query.billMin, money.minorUnitDigits, 'billMin'),
      billMaxMinor: boundOf(query.billMax, money.minorUnitDigits, 'billMax'),
      sort: query.sort,
      order: query.order,
      words: asked?.terms ?? [],
      phonePrefix: asked?.phone?.e164Prefix ?? null,
    };
    const page = await this.leads.list(reader, filters, pageOf(query), money);
    return { ...page, currencyCode: money.currencyCode };
  }

  async inbox(reader: LeadReader, query: PaginationQuery, now: number): Promise<LeadInbox> {
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    const inbox = await this.leads.inbox(reader, pageOf(query), money, now);
    return { ...inbox, currencyCode: money.currencyCode };
  }

  async detail(reader: LeadReader, leadId: string): Promise<LeadDetail> {
    const money = moneyOf((await this.settings.packOf(reader.tenantId)).formats);
    const detail = await this.leads.detail(reader, leadId, money);
    if (detail === null) throw new NotFoundException('No such lead.');
    return detail;
  }
}
