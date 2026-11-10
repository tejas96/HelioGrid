import type {
  LeadDetail,
  LeadInbox,
  LeadList,
  LeadListSort,
  LeadListState,
} from '@heliogrid/contracts';
import { customer, lead, type TenantPool } from '@heliogrid/db';
import { type LeadSource, type LeadStage, UNASSIGNED_ESCALATES_AFTER_MS } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, isNull, lte, min, or, type SQL, sql } from 'drizzle-orm';
import { prefixQueryOf } from '../../common/db/prefix-query';
import { TENANT_DB } from '../../common/db/tenant.token';
import { leadCustomerJoin, leadOwner, leadSummaryColumns } from './crm.lead-columns.repository';
import { findLeadInScope, loadLeadDetail } from './crm.lead-detail.repository';
import {
  leadListFactColumns,
  leadListRowOf,
  pipelineStateWhere,
  readPipeline,
} from './crm.lead-list-facts.repository';
import { leadScopeWhere } from './crm.scope.repository';
import { type LeadMoney, leadSummaryOf } from './internal/lead-wire';
import type { Page } from './internal/page';
import type { LeadReader } from './internal/reader';

/** The Leads list's filters as the repository reads them: the bill already in minor units. */
export interface LeadListFilters {
  readonly stage?: LeadStage;
  readonly state?: LeadListState;
  readonly source?: LeadSource;
  readonly ownerId?: string;
  readonly unassigned?: boolean;
  readonly billMinMinor?: number;
  readonly billMaxMinor?: number;
  readonly sort: LeadListSort;
  readonly order: 'asc' | 'desc';
  /** Name or city words, each a prefix (`simple` terms). */
  readonly words: readonly string[];
  /** A number's leading digits as stored — `+91984…` — when the query reads as one. */
  readonly phonePrefix: string | null;
}

/**
 * The state filter: no state is the open work — active and snoozed; `active` is no R9 state; any
 * other names its state. Junk is never listed (`M02-55`): only search finds it.
 */
function stateWhere(state: LeadListState | undefined): SQL | undefined {
  if (state === undefined) {
    return or(isNull(lead.lifecycleState), eq(lead.lifecycleState, 'snoozed'));
  }
  return state === 'active' ? isNull(lead.lifecycleState) : eq(lead.lifecycleState, state);
}

/** A name or city prefix match, or a number's prefix — either one keeps the lead. */
function queryWhere(filters: LeadListFilters): SQL | undefined {
  const words = prefixQueryOf(filters.words);
  const byWords =
    words === null ? undefined : sql`${customer.search} @@ to_tsquery('simple', ${words})`;
  const byPhone =
    filters.phonePrefix === null
      ? undefined
      : sql`${customer.phoneE164} like ${`${filters.phonePrefix}%`}`;
  return byWords === undefined || byPhone === undefined
    ? (byWords ?? byPhone)
    : or(byWords, byPhone);
}

/** The owner filter: `unassigned` wins over a named owner. */
function ownerWhere(filters: LeadListFilters): SQL | undefined {
  if (filters.unassigned === true) return isNull(lead.ownerUserId);
  return filters.ownerId === undefined ? undefined : eq(lead.ownerUserId, filters.ownerId);
}

/** `orderBy(<sort key>, id)`, the id a unique tiebreak in the same direction; an unknown bill sorts last. */
function listOrder(filters: LeadListFilters): SQL[] {
  const direction = filters.order === 'asc' ? asc : desc;
  if (filters.sort === 'monthly_bill') {
    return [sql`${lead.monthlyBillMinor} ${sql.raw(filters.order)} nulls last`, direction(lead.id)];
  }
  const key = filters.sort === 'created_at' ? lead.createdAt : lead.lastActivityAt;
  return [direction(key), direction(lead.id)];
}

/**
 * The leads reads (`SCR-M02-02` … `04`) on the runtime pool, each with the tenant predicate AND the
 * reader's scope in its `where`, and each page counted with that same `where`.
 */
@Injectable()
export class CrmLeadsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async list(
    reader: LeadReader,
    filters: LeadListFilters,
    page: Page,
    money: LeadMoney,
  ): Promise<Omit<LeadList, 'currencyCode'>> {
    const owned = and(
      eq(lead.tenantId, reader.tenantId),
      leadScopeWhere(reader.scope, reader.actorId),
      ownerWhere(filters),
    );
    const where = and(
      owned,
      stateWhere(filters.state),
      filters.stage === undefined ? undefined : eq(lead.stage, filters.stage),
      filters.source === undefined ? undefined : eq(lead.source, filters.source),
      filters.billMinMinor === undefined
        ? undefined
        : gte(lead.monthlyBillMinor, filters.billMinMinor),
      filters.billMaxMinor === undefined
        ? undefined
        : lte(lead.monthlyBillMinor, filters.billMaxMinor),
      queryWhere(filters),
    );
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const rows = await tx
        .select({ ...leadSummaryColumns, ...leadListFactColumns })
        .from(lead)
        .innerJoin(customer, leadCustomerJoin)
        .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
        .where(where)
        .orderBy(...listOrder(filters))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx
        .select({ n: count() })
        .from(lead)
        .innerJoin(customer, leadCustomerJoin)
        .where(where);
      const pipeline = await readPipeline(tx, and(owned, pipelineStateWhere));
      return {
        items: rows.map((row) => leadListRowOf(row, money)),
        totalCount: total?.n ?? 0,
        pipeline,
      };
    });
  }

  /**
   * The one triage queue (`M02-23`): unassigned active leads the reader may see, newest first,
   * with the head's counts over the same rows — of which those waiting MORE than a day, the
   * escalation's own rule (domain's `isUnassignedOverdue`, `M02-50`).
   */
  async inbox(
    reader: LeadReader,
    page: Page,
    money: LeadMoney,
    now: number,
  ): Promise<Omit<LeadInbox, 'currencyCode'>> {
    const where = and(
      eq(lead.tenantId, reader.tenantId),
      leadScopeWhere(reader.scope, reader.actorId),
      isNull(lead.ownerUserId),
      isNull(lead.lifecycleState),
    );
    const waitingSince = new Date(now - UNASSIGNED_ESCALATES_AFTER_MS);
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const rows = await tx
        .select(leadSummaryColumns)
        .from(lead)
        .innerJoin(customer, leadCustomerJoin)
        .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
        .where(where)
        .orderBy(desc(lead.createdAt), desc(lead.id))
        .limit(page.limit)
        .offset(page.offset);
      const bySource = await tx
        .select({
          source: lead.source,
          count: count(),
          pastDay:
            sql<number>`count(*) filter (where ${lead.createdAt} < ${waitingSince.toISOString()})`.mapWith(
              Number,
            ),
          oldest: min(lead.createdAt),
        })
        .from(lead)
        .where(where)
        .groupBy(lead.source)
        .orderBy(asc(lead.source));
      const oldest = bySource
        .map((group) => group.oldest)
        .filter((at): at is Date => at !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      return {
        items: rows.map((row) => leadSummaryOf(row, money)),
        totalCount: bySource.reduce((sum, group) => sum + group.count, 0),
        bySource: bySource.map(({ source, count: n }) => ({ source, count: n })),
        past24Hours: bySource.reduce((sum, group) => sum + group.pastDay, 0),
        oldestAt: oldest?.toISOString() ?? null,
      };
    });
  }

  /** One lead in the reader's scope; `null` for another company's, one outside the scope, or none. */
  async detail(reader: LeadReader, leadId: string, money: LeadMoney): Promise<LeadDetail | null> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      const found = await findLeadInScope(tx, reader, leadId);
      return found === null ? null : loadLeadDetail(tx, reader, leadId, money);
    });
  }
}
