import type { OwnerDashboard } from '@heliogrid/contracts';
import { lead, monthlyTarget, projectPayment, projectStageTransition } from '@heliogrid/db';
import { type LostReason, MS_PER_DAY, minorUnits } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { Act } from '../../src/common/auth/session-context';
import { DashboardsTargetRepository } from '../../src/modules/dashboards/dashboards.target.repository';
import {
  firstDayOf,
  monthAfter,
  monthBefore,
  monthOf,
} from '../../src/modules/dashboards/internal/clock';
import {
  aLead,
  aWin,
  type Caller,
  dayFromToday,
  markWon,
  ownLead,
  type ProjectsWorld,
} from '../projects/support';
import type { openPools } from '../support/fixture';

/*
 * What the dashboard proofs share: deals sold by a chosen person, losses and late parts made on the
 * admin path — their own acts are proven by their slices — and the dashboard as a person reads it.
 */

/** This company month, `YYYY-MM`. */
export const thisMonth = () => monthOf(dayFromToday(0));

/** The month before this one, `YYYY-MM`. */
export const lastMonth = () => monthBefore(thisMonth());

/** The first day of the month after this one: the day this month is summarised. */
export const firstOfNextMonth = () => firstDayOf(monthAfter(thisMonth()));

/** A lead captured by `caller` and handed to `ownerId`. */
export async function aLeadOf(world: ProjectsWorld, caller: Caller, ownerId: string) {
  const leadId = await aLead(caller);
  await ownLead(world, leadId, ownerId);
  return leadId;
}

/** A deal sold by `sellerId` — the lead's owner at Mark won — at `finalValue` rupees. */
export async function aDealSoldBy(
  world: ProjectsWorld,
  caller: Caller,
  managerId: string,
  sellerId: string,
  finalValue: string,
): Promise<string> {
  const leadId = await aLeadOf(world, caller, sellerId);
  const won = await markWon(caller, leadId, aWin(managerId, { finalValue }));
  if (won.status !== HttpStatus.CREATED) throw new Error(`mark won: ${won.status}`);
  return won.body.projectId;
}

/** A lead closed lost now with `reason`, as the lose act leaves it. */
export async function loseLead(
  world: ProjectsWorld,
  leadId: string,
  closedBy: string,
  lostReason: LostReason,
): Promise<void> {
  await world.pools.admin.db
    .update(lead)
    .set({ lifecycleState: 'lost', closedAs: 'lost', closedAt: new Date(), closedBy, lostReason })
    .where(eq(lead.id, leadId));
}

/** The project won `days` ago, so its first part has been due — and late — that long. */
export async function wonDaysAgo(world: ProjectsWorld, projectId: string, days: number) {
  await world.pools.admin.db
    .update(projectStageTransition)
    .set({ movedAt: new Date(Date.now() - days * MS_PER_DAY), enteredOn: dayFromToday(-days) })
    .where(
      and(
        eq(projectStageTransition.projectId, projectId),
        eq(projectStageTransition.toStage, 'won'),
      ),
    );
}

/** A recorded payment moved to a day of last month, as if received then. */
export async function receivedLastMonth(world: ProjectsWorld, paymentId: string) {
  await world.pools.admin.db
    .update(projectPayment)
    .set({ receivedOn: `${lastMonth()}-15` })
    .where(eq(projectPayment.id, paymentId));
}

/** The owner dashboard as `caller` reads it, which must answer 200. */
export async function dashboardOf(caller: Caller): Promise<OwnerDashboard> {
  const reply = await caller.call<OwnerDashboard>('GET', '/dashboards/owner');
  if (reply.status !== HttpStatus.OK) {
    throw new Error(`dashboard: expected 200, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

/** The company target in each send of the repeat proof (`tests/settings/unchanged-replace.test.ts`). */
const TARGET_SENT = { first: 50_000_000, again: 50_000_000, changed: 65_000_000 } as const;

/** `PUT /dashboards/target` as the repeat proof drives it: this month's target, and its row's version. */
export function targetReplace(
  pools: () => ReturnType<typeof openPools>,
  tenantId: string,
  by: () => Act,
) {
  const ofThisCompany = eq(monthlyTarget.tenantId, tenantId);
  return {
    route: 'PUT /dashboards/target',
    event: 'settings.monthly_target_changed',
    save: (send: keyof typeof TARGET_SENT) =>
      new DashboardsTargetRepository(pools().tenants).save(
        tenantId,
        firstDayOf(thisMonth()),
        minorUnits(TARGET_SENT[send]),
        by(),
      ),
    rows: () =>
      pools()
        .admin.db.select({ version: sql<string>`xmin::text` })
        .from(monthlyTarget)
        .where(ofThisCompany)
        .then((rows) => rows.map((row) => row.version)),
  };
}
