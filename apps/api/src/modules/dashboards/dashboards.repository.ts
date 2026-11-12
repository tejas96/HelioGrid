import type { TenantPool } from '@heliogrid/db';
import { type LeadStage, type LostReason, type MinorUnits, moneyScopeOf } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { leadScopeWhere } from '../crm/crm.public';
import { collectedIn, projectScopeWhere } from '../projects/projects.public';
import { lostIn, pipelineOf, targetOf, wonIn, wonSince } from './dashboards.figures.repository';
import {
  blockedOnUsOf,
  myOverdueTasksOf,
  unassignedOf,
  waitingLongestOf,
} from './dashboards.needs-you.repository';
import { firstDayOf, type Month, monthBefore, monthSpan, windowStartOf } from './internal/clock';
import type { DashboardReader } from './internal/reader';

/** The dashboard's clock: the instant read, the company's zone and its current month. */
export interface DashboardClock {
  readonly now: number;
  readonly timeZone: string;
  readonly month: Month;
}

/** Every stored figure the owner dashboard reads, in minor units — formatting is the service's. */
export interface OwnerFacts {
  readonly unassigned: { readonly count: number; readonly oldest: Date | null };
  readonly blockedOnUs: Awaited<ReturnType<typeof blockedOnUsOf>>;
  readonly waitingLongest: Awaited<ReturnType<typeof waitingLongestOf>>;
  readonly myOverdueTasks: number;
  readonly collectedLastMonth: number;
  readonly wonThisMonth: { readonly count: number; readonly amountMinor: MinorUnits };
  readonly wonLastMonth: { readonly count: number; readonly amountMinor: MinorUnits };
  readonly wonInWindow: { readonly count: number; readonly medianMinor: MinorUnits | null };
  readonly target: MinorUnits | null;
  readonly pipeline: readonly { stage: LeadStage; count: number }[];
  readonly lostInWindow: readonly { reason: LostReason; count: number }[];
}

/**
 * The owner dashboard's reads (`SCR-M13-01`) in ONE tenant transaction, so every figure is of the
 * same moment: leads under the reader's lead scope, projects under their project scope, money under
 * the money scope (`M11-56`), and the target the company's own.
 */
@Injectable()
export class DashboardsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  ownerFacts(reader: DashboardReader, clock: DashboardClock): Promise<OwnerFacts> {
    const { tenantId, actorId } = reader.leads;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const leads = leadScopeWhere(reader.leads.scope, actorId);
      const projects = projectScopeWhere(reader.projects.scope, actorId);
      const money = projectScopeWhere(moneyScopeOf(reader.projects.scope), actorId);
      const lastMonth = monthBefore(clock.month);
      const windowStart = windowStartOf(clock.now, clock.timeZone);
      return {
        unassigned: await unassignedOf(tx, tenantId, leads, clock.now),
        blockedOnUs: await blockedOnUsOf(tx, tenantId, projects),
        waitingLongest: await waitingLongestOf(tx, tenantId, leads),
        myOverdueTasks: await myOverdueTasksOf(tx, tenantId, actorId, leads, clock.now),
        collectedLastMonth: await collectedIn(tx, tenantId, money, lastMonth),
        wonThisMonth: await wonIn(tx, tenantId, money, monthSpan(clock.month, clock.timeZone)),
        wonLastMonth: await wonIn(tx, tenantId, money, monthSpan(lastMonth, clock.timeZone)),
        wonInWindow: await wonSince(tx, tenantId, money, windowStart),
        target: await targetOf(tx, tenantId, firstDayOf(clock.month)),
        pipeline: await pipelineOf(tx, tenantId, leads),
        lostInWindow: await lostIn(tx, tenantId, leads, { from: windowStart }),
      };
    });
  }
}
