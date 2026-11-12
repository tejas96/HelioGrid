import type { MoneyDue, RecordedPayment } from '@heliogrid/contracts';
import { lead, subscription } from '@heliogrid/db';
import { daysFrom, FOUNDER_ROLE, localDate, MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aTrial } from '../billing/support';
import { KOLKATA } from '../crm/lead-work';
import { HOUR_MS, retryKey } from '../crm/support';
import { recordPayment } from '../projects/payments-support';
import {
  acted,
  aStaffedCompany,
  dayFromToday,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
} from '../projects/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDealSoldBy,
  aLeadOf,
  dashboardOf,
  loseLead,
  receivedLastMonth,
  thisMonth,
  wonDaysAgo,
} from './support';

/**
 * The owner dashboard on the wire (`SCR-M13-01`, `M13-14`): the EPC Owner reads the whole company,
 * a Sales Manager the team — own leads and the queue (ruling 8) — and nobody else reads it. Cash is
 * Money due's own figures for the same reader (`M13-16`); a cancelled deal is never won (`M13-04`);
 * another company's rows are never counted; and the read answers in every billing state.
 */

const here = aStaffedCompany('Owner Dashboard EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  rep: [preset.sales_executive],
});
const elsewhere = aStaffedCompany('Other Dashboard EPC', { owner: [FOUNDER_ROLE] });
const halted = aStaffedCompany('Halted Dashboard EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'OWNER DASHBOARD PROOF',
  'The owner dashboard is UNPROVEN on the wire in this run.',
);

/** How long the queued lead has waited with no owner, past the 24-hour line. */
const QUEUED_HOURS = 30;
/** How long ago the manager's deal was won, so its first part is that many days late. */
const LATE_DAYS = 3;
/** How long the rep's deal has waited on the company. */
const BLOCKED_DAYS = 2;

describe.skipIf(skip)('the owner dashboard, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const manager = () => world.as(here.members.manager);
  const ids = { owner: '', manager: '', rep: '' };
  const made = { teamLead: '', repLead: '', queued: '', teamDeal: '', repDeal: '' };

  beforeAll(async () => {
    world = await openProjectsWorld([here, elsewhere, halted]);
    ids.owner = here.people.owner.userId;
    ids.manager = here.people.manager.userId;
    ids.rep = here.people.rep.userId;
    made.teamLead = await aLeadOf(world, owner(), ids.manager);
    made.repLead = await aLeadOf(world, owner(), ids.rep);
    made.queued = await aLeadOf(world, owner(), ids.owner);
    await world.pools.admin.db
      .update(lead)
      .set({ ownerUserId: null, createdAt: new Date(Date.now() - QUEUED_HOURS * HOUR_MS) })
      .where(eq(lead.id, made.queued));
    await loseLead(world, await aLeadOf(world, owner(), ids.manager), ids.manager, 'price');
    await loseLead(world, await aLeadOf(world, owner(), ids.rep), ids.rep, 'chose_competitor');
    // A loss the owner took back: reopened, it is no longer lost and counts in no list (M07-65).
    const cameBack = await aLeadOf(world, owner(), ids.owner);
    await loseLead(world, cameBack, ids.owner, 'financing_failed');
    const reopened = await owner().call('POST', `/leads/${cameBack}/reopen`, {
      capturedAt: new Date().toISOString(),
    });
    if (reopened.status !== HttpStatus.OK) throw new Error(`reopen: ${reopened.status}`);
    made.teamDeal = await aDealSoldBy(world, owner(), ids.owner, ids.manager, '200000.00');
    made.repDeal = await aDealSoldBy(world, owner(), ids.owner, ids.rep, '300000.00');
    const cancelled = await aDealSoldBy(world, owner(), ids.owner, ids.owner, '900000.00');
    await acted(owner(), cancelled, 'cancel', { reason: 'customer_backed_out', note: null });
    await wonDaysAgo(world, made.teamDeal, LATE_DAYS);
    await acted(owner(), made.repDeal, 'wait', {
      party: 'company',
      reason: 'crew_availability',
      startedOn: dayFromToday(-BLOCKED_DAYS),
      note: 'Crew on another roof',
    });
    const payments = (projectId: string) =>
      owner().call<{ parts: { id: string }[] }>('GET', `/projects/${projectId}/payments`);
    const [repPart] = (await payments(made.repDeal)).body.parts;
    await recordPayment(owner(), made.repDeal, { partId: repPart?.id, amount: '1000.00' });
    const earlier = await recordPayment(owner(), made.repDeal, {
      partId: repPart?.id,
      amount: '2500.00',
    });
    await receivedLastMonth(world, (earlier.body as RecordedPayment).recordedId);
    // Another company's deal and loss, which no figure here may count.
    const theirs = world.as(elsewhere.members.owner);
    const theirOwner = elsewhere.people.owner.userId;
    await aDealSoldBy(world, theirs, theirOwner, theirOwner, '700000.00');
    await loseLead(world, await aLeadOf(world, theirs, theirOwner), theirOwner, 'price');
  });

  afterAll(async () => {
    await world.close();
  });

  it('shows the EPC Owner the whole company, a cancelled deal never won (M13-04, M13-14)', async () => {
    const read = await dashboardOf(owner());
    expect(read).toMatchObject({
      scope: 'company',
      today: dayFromToday(0),
      month: thisMonth(),
      currencyCode: 'INR',
      canSetTarget: true,
      target: null,
      won: {
        thisMonth: { count: 2, amount: '500000.00' },
        lastMonth: { count: 0, amount: '0.00' },
        median: { amount: '200000.00', of: 2 },
      },
      winLoss: {
        windowDays: 90,
        won: 2,
        lost: 2,
        lostReasons: [
          { reason: 'price', count: 1 },
          { reason: 'chose_competitor', count: 1 },
        ],
      },
    });
    expect(read.pipeline).toEqual([
      // The three open leads and the one reopened — back in the funnel, never lost.
      { stage: 'new', count: 4 },
      { stage: 'contacted', count: 0 },
      { stage: 'qualified', count: 0 },
      { stage: 'survey', count: 0 },
      { stage: 'design', count: 0 },
      { stage: 'proposal', count: 0 },
      { stage: 'negotiating', count: 0 },
    ]);
    expect(read.needsYou).toMatchObject({
      unassigned: { count: 1, oldestHours: QUEUED_HOURS },
      paymentsLate: { count: 1, oldestDays: LATE_DAYS, oldestProjectId: made.teamDeal },
      blockedOnUs: { count: 1, oldest: { projectId: made.repDeal, days: BLOCKED_DAYS } },
    });
    expect(read.needsYou.waitingLongest.map((one) => one.leadId)).toEqual([
      made.queued,
      made.teamLead,
      made.repLead,
    ]);
    const queuedSince = localDate(Date.now() - QUEUED_HOURS * HOUR_MS, KOLKATA);
    expect(read.needsYou.waitingLongest[0]).toMatchObject({
      stage: 'new',
      days: daysFrom(queuedSince, dayFromToday(0)),
    });
  });

  it('shows a Sales Manager the team alone: a rep’s lead, loss and deal are not theirs (M13-07)', async () => {
    const read = await dashboardOf(manager());
    expect(read).toMatchObject({
      scope: 'team',
      canSetTarget: false,
      won: { thisMonth: { count: 1, amount: '200000.00' }, median: { amount: '200000.00', of: 1 } },
      winLoss: { won: 1, lost: 1, lostReasons: [{ reason: 'price', count: 1 }] },
      needsYou: {
        unassigned: { count: 1 },
        blockedOnUs: { count: 0, oldest: null },
        paymentsLate: { count: 1, oldestDays: LATE_DAYS, oldestProjectId: made.teamDeal },
      },
      cash: { collectedThisMonth: '0.00', collectedLastMonth: '0.00' },
    });
    expect(read.pipeline[0]).toEqual({ stage: 'new', count: 2 });
    const waiting = read.needsYou.waitingLongest.map((one) => one.leadId);
    expect(waiting).toEqual([made.queued, made.teamLead]);
    expect(waiting).not.toContain(made.repLead);
  });

  it.each([
    ['the EPC Owner', () => here.members.owner],
    ['a Sales Manager', () => here.members.manager],
  ])("shows %s cash as Money due's own figures (M13-16)", async (_who, member) => {
    const caller = world.as(member());
    const read = await dashboardOf(caller);
    const due = (await caller.call<MoneyDue>('GET', '/payments/due?page=1&limit=1')).body;
    expect(read.cash).toMatchObject({
      collectedThisMonth: due.collectedThisMonth,
      toCollect: due.toCollect,
      late: due.groups.late,
    });
    expect(read.needsYou.paymentsLate).toMatchObject(due.groups.late);
  });

  it('counts what came in last month by the day it was received', async () => {
    const read = await dashboardOf(owner());
    expect(read.cash).toMatchObject({
      collectedThisMonth: '1000.00',
      collectedLastMonth: '2500.00',
    });
  });

  it('counts the reader’s own overdue tasks on leads they may see (M13-10)', async () => {
    const before = (await dashboardOf(owner())).needsYou.myOverdueTasks;
    const added = await owner().call(
      'POST',
      `/leads/${made.teamLead}/tasks`,
      {
        kind: 'follow_up',
        dueAt: new Date(Date.now() - HOUR_MS).toISOString(),
        assigneeId: ids.owner,
      },
      retryKey(),
    );
    expect(added.status).toBe(HttpStatus.CREATED);
    expect((await dashboardOf(owner())).needsYou.myOverdueTasks).toBe(before + 1);
    expect((await dashboardOf(manager())).needsYou.myOverdueTasks).toBe(0);
  });

  it('is not a sales executive’s to read', async () => {
    const reply = await world.as(here.members.rep).call('GET', '/dashboards/owner');
    expect(reply.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('shows another company its own figures alone', async () => {
    const read = await dashboardOf(world.as(elsewhere.members.owner));
    expect(read).toMatchObject({
      won: { thisMonth: { count: 1, amount: '700000.00' } },
      winLoss: { won: 1, lost: 1, lostReasons: [{ reason: 'price', count: 1 }] },
      needsYou: {
        unassigned: { count: 0 },
        blockedOnUs: { count: 0 },
        paymentsLate: { count: 0, oldestDays: null, oldestProjectId: null },
      },
      cash: { collectedLastMonth: '0.00' },
    });
    expect(read.pipeline.every((one) => one.count === 0)).toBe(true);
  });

  it('answers for a halted company — reading is never held hostage', async () => {
    const tenantId = halted.company.tenantId;
    await aTrial(world.pools.admin.db, tenantId, Date.now());
    await world.pools.admin.db
      .update(subscription)
      .set({
        state: 'halted',
        stateEnteredAt: new Date(Date.now() - MS_PER_DAY),
        paidPeriodEnd: new Date(Date.now() - LATE_DAYS * MS_PER_DAY),
      })
      .where(eq(subscription.tenantId, tenantId));
    const read = await dashboardOf(world.as(halted.members.owner));
    expect(read.scope).toBe('company');
    expect(read.today).toBe(dayFromToday(0));
  });
});
