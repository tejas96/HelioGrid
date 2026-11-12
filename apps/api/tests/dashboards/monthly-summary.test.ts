import { notification } from '@heliogrid/db';
import { FOUNDER_ROLE, formatMoney, IN_PACK } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DashboardsSummaryAdminRepository } from '../../src/modules/dashboards/dashboards.summary.admin.repository';
import { DashboardsSummaryService } from '../../src/modules/dashboards/dashboards.summary.service';
import { onTheClock } from '../crm/lead-work';
import { recordPayment } from '../projects/payments-support';
import {
  aStaffedCompany,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
} from '../projects/support';
import { skipWithoutDatabase } from '../support/fixture';
import { aDealSoldBy, aLeadOf, firstOfNextMonth, loseLead, thisMonth } from './support';

/**
 * The owner's monthly summary (`M13-21`), driven for one company on an injected clock: written once
 * on the first of the month at or after 09:00 on the company's clock, of the month just ended, to
 * whoever reads the company's reports company-wide — never to a team-scoped manager.
 */

const here = aStaffedCompany('Summary EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
});

const skip = skipWithoutDatabase(
  'MONTHLY SUMMARY PROOF',
  'The monthly summary is UNPROVEN in this run.',
);

/** Every company the test database holds, so this one is never cut off by a batch. */
const EVERY_COMPANY = 100_000;

describe.skipIf(skip)('the monthly summary, against a migrated database', () => {
  let world: ProjectsWorld;
  const tenantId = here.company.tenantId;
  const summariseAt = (at: number) =>
    world.http.app.get(DashboardsSummaryService).summariseTenant(tenantId, at);
  const dueAt = (at: number) =>
    world.http.app.get(DashboardsSummaryAdminRepository).dueTenants(at, EVERY_COMPANY);
  const summariesOf = (userId: string) =>
    world.pools.admin.db
      .select({ title: notification.title, body: notification.body })
      .from(notification)
      .where(
        and(
          eq(notification.recipientUserRef, userId),
          eq(notification.subjectRef, tenantId),
          eq(notification.type, 'monthly_summary'),
        ),
      );

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
    const owner = world.as(here.members.owner);
    const ownerId = here.people.owner.userId;
    const projectId = await aDealSoldBy(world, owner, ownerId, ownerId, '450000.00');
    const payments = await owner.call<{ parts: { id: string }[] }>(
      'GET',
      `/projects/${projectId}/payments`,
    );
    await recordPayment(owner, projectId, {
      partId: payments.body.parts[0]?.id,
      amount: '12000.00',
    });
    await loseLead(world, await aLeadOf(world, owner, ownerId), ownerId, 'price');
  });

  afterAll(async () => {
    await world.close();
  });

  it('is written once, at 09:00 on the first, to the EPC Owner, with the month’s figures', async () => {
    const first = firstOfNextMonth();
    expect(await dueAt(onTheClock(first, '08:59'))).not.toContain(tenantId);
    expect(await summariseAt(onTheClock(first, '08:59'))).toBe(false);
    expect(await dueAt(onTheClock(first, '09:00'))).toContain(tenantId);
    expect(await summariseAt(onTheClock(first, '09:00'))).toBe(true);
    const told = await summariesOf(here.people.owner.userId);
    expect(told).toHaveLength(1);
    expect(told[0]?.title).toMatch(/ in four figures$/);
    const money = (amount: string) => formatMoney(IN_PACK.formats, amount);
    expect(told[0]?.body).toBe(
      `Collected ${money('12000.00')} · won 1 worth ${money('450000.00')} · 1 lost · too few closed deals for a win rate yet`,
    );
    expect(await summariesOf(here.people.manager.userId)).toHaveLength(0);
    // Written: a later run that day, and the next day, write nothing more.
    expect(await dueAt(onTheClock(first, '11:00'))).not.toContain(tenantId);
    expect(await summariseAt(onTheClock(first, '11:00'))).toBe(false);
    const second = first.replace(/-01$/, '-02');
    expect(await summariseAt(onTheClock(second, '09:30'))).toBe(false);
    expect(await summariesOf(here.people.owner.userId)).toHaveLength(1);
  });

  it('is not written on any day but the first', async () => {
    const today = `${thisMonth()}-15`;
    expect(await dueAt(onTheClock(today, '10:00'))).not.toContain(tenantId);
    expect(await summariseAt(onTheClock(today, '10:00'))).toBe(false);
  });
});
