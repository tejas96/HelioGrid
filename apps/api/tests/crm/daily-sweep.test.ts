import type { BulkAssigned, LeadDetail } from '@heliogrid/contracts';
import { lead, leadStageTransition } from '@heliogrid/db';
import {
  DORMANT_AFTER_DAYS,
  FOUNDER_ROLE,
  leadScopeOf,
  localDate,
  MS_PER_DAY,
  markLost,
} from '@heliogrid/domain';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CrmDailySweepAdminRepository } from '../../src/modules/crm/crm.daily-sweep.admin.repository';
import { lockLeadInScope, personOf } from '../../src/modules/crm/crm.lead-lock.repository';
import { recordLeadMoves } from '../../src/modules/crm/crm.timeline.repository';
import type { LeadReader } from '../../src/modules/crm/internal/reader';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { dayFromToday, KOLKATA, onTheClock, sweepAt, tasksOf } from './lead-work';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  noticesOf,
  openCrmWorld,
  ownLead,
  preset,
  type Staffed,
  type Team,
} from './support';

/**
 * The CRM's one timer (`M02-49`…`M02-54`, T-M02-015), driven for one company on an injected
 * clock: every wake lands at 09:00 on the company's clock, the day is swept once, and no state
 * deletes a lead. Each case keeps its own company, so each sweeps a day nothing else claimed.
 */

const team = { owner: [FOUNDER_ROLE], rep: [preset.sales_executive] } satisfies Team;
const unassigned = aStaffedCompany('Sweep Unassigned EPC', team);
const snoozing = aStaffedCompany('Sweep Snooze EPC', team);
const quiet = aStaffedCompany('Sweep Dormant EPC', team);
const postponed = aStaffedCompany('Sweep Postponed EPC', team);
const overlapping = aStaffedCompany('Sweep Overlap EPC', team);

const skip = skipWithoutDatabase(
  'DAILY SWEEP PROOF',
  'The CRM daily sweep is UNPROVEN in this run.',
);

const now = () => new Date().toISOString();
/** The first morning a sweep looks at a lead captured today, and the morning after it. */
const FIRST_MORNING = 2;
const NEXT_MORNING = FIRST_MORNING + 1;
/** A morning no other case here sweeps. */
const A_QUIET_MORNING = 6;
/** Every company the test database holds, so this one is never cut off by a batch. */
const EVERY_COMPANY = 100_000;

describe.skipIf(skip)('the CRM daily sweep, against a migrated database', () => {
  let world: CrmWorld;
  const ownerOf = (company: Staffed<typeof team>) => world.as(company.members.owner);
  const read = async (company: Staffed<typeof team>, leadId: string) =>
    (await ownerOf(company).call<LeadDetail>('GET', `/leads/${leadId}`)).body;
  const systemMovesOf = (leadId: string) =>
    world.pools.admin.db
      .select()
      .from(leadStageTransition)
      .where(eq(leadStageTransition.leadId, leadId));

  beforeAll(async () => {
    world = await openCrmWorld([unassigned, snoozing, quiet, postponed, overlapping]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a lead unassigned past 24 hours notifies the owner once and keeps its state', async () => {
    const company = unassigned;
    const made = await captured(ownerOf(company), aCapture(aPhone(), { name: 'Waiting Lead' }));
    const tenantId = company.company.tenantId;
    // 09:30 two days on: the lead has waited more than 24 hours.
    expect(await sweepAt(world, tenantId, onTheClock(dayFromToday(2), '09:30'))).toBe(true);
    const told = await noticesOf(world, company.people.owner.userId, made.lead.id);
    expect(told.map((one) => one.type)).toEqual(['lead_unassigned_24h']);
    expect(told[0]?.title).toContain('Waiting Lead');
    expect(await read(company, made.lead.id)).toMatchObject({
      lead: { state: null, stage: 'new', owner: null },
    });
    // The next day's sweep runs, and tells no one again.
    expect(await sweepAt(world, tenantId, onTheClock(dayFromToday(NEXT_MORNING), '09:30'))).toBe(
      true,
    );
    expect(await noticesOf(world, company.people.owner.userId, made.lead.id)).toHaveLength(1);
    // The day is swept once: a second run that day does nothing.
    expect(await sweepAt(world, tenantId, onTheClock(dayFromToday(NEXT_MORNING), '11:00'))).toBe(
      false,
    );
  });

  it('a snoozed lead wakes at 09:00 on its date with a follow-up task', async () => {
    const company = snoozing;
    const made = await captured(ownerOf(company), aCapture(aPhone()));
    await ownLead(world, made.lead.id, company.people.rep.userId);
    const wakeOn = dayFromToday(2);
    await ownerOf(company).call('POST', `/leads/${made.lead.id}/snooze`, {
      wakeOn,
      capturedAt: now(),
    });
    const tenantId = company.company.tenantId;
    expect(await sweepAt(world, tenantId, onTheClock(wakeOn, '08:59'))).toBe(false);
    expect((await read(company, made.lead.id)).lead.state).toBe('snoozed');
    expect(await sweepAt(world, tenantId, onTheClock(wakeOn, '09:00'))).toBe(true);
    expect((await read(company, made.lead.id)).lead).toMatchObject({ state: null, stage: 'new' });
    const followUps = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.provenance === 'snooze_wake',
    );
    expect(followUps).toHaveLength(1);
    expect(followUps[0]).toMatchObject({
      kind: 'follow_up',
      status: 'open',
      assigneeUserId: company.people.rep.userId,
      createdBy: null,
    });
    expect(followUps[0]?.dueAt.getTime()).toBe(onTheClock(wakeOn, '09:00'));
  });

  it('thirty quiet days flag a lead dormant and any activity returns it', async () => {
    const company = quiet;
    const made = await captured(ownerOf(company), aCapture(aPhone()));
    const reopened = await captured(ownerOf(company), aCapture(aPhone()));
    await ownLead(world, made.lead.id, company.people.owner.userId);
    await ownLead(world, reopened.lead.id, company.people.owner.userId);
    const tenantId = company.company.tenantId;
    const dayBefore = localDate(Date.now() + (DORMANT_AFTER_DAYS - 1) * MS_PER_DAY, KOLKATA);
    expect(await sweepAt(world, tenantId, onTheClock(dayBefore, '09:30'))).toBe(true);
    expect((await read(company, made.lead.id)).lead.state).toBeNull();
    const dayAfter = localDate(Date.now() + (DORMANT_AFTER_DAYS + 1) * MS_PER_DAY, KOLKATA);
    expect(await sweepAt(world, tenantId, onTheClock(dayAfter, '09:30'))).toBe(true);
    expect((await read(company, made.lead.id)).lead).toMatchObject({
      state: 'dormant',
      stage: 'new',
    });
    const [flag] = await systemMovesOf(made.lead.id);
    expect(flag).toMatchObject({ toState: 'dormant', cause: 'automation', movedBy: null });
    await ownerOf(company).call('POST', `/leads/${made.lead.id}/notes`, {
      text: 'Called back about the subsidy',
      capturedAt: now(),
    });
    expect((await read(company, made.lead.id)).lead).toMatchObject({ state: null, stage: 'new' });
    // A person's reopen is work too: it restarts the quiet clock, so the lead is not flagged again
    // the next morning.
    const dormant = (await read(company, reopened.lead.id)).lead;
    expect(dormant.state).toBe('dormant');
    await ownerOf(company).call('POST', `/leads/${reopened.lead.id}/reopen`, { capturedAt: now() });
    const back = (await read(company, reopened.lead.id)).lead;
    expect(back.state).toBeNull();
    expect(Date.parse(back.lastActivityAt)).toBeGreaterThan(Date.parse(dormant.lastActivityAt));
  });

  it('a loss postponed to a date resurfaces at 09:00 that day', async () => {
    const company = postponed;
    const made = await captured(ownerOf(company), aCapture(aPhone()));
    await ownLead(world, made.lead.id, company.people.rep.userId);
    const tenantId = company.company.tenantId;
    const resurfaceOn = dayFromToday(NEXT_MORNING);
    // Mark lost's route is block 6's (T-M07-003); its act and writer are proven here directly.
    const reader: LeadReader = {
      tenantId,
      actorId: company.people.owner.userId,
      roles: [FOUNDER_ROLE],
      scope: leadScopeOf([FOUNDER_ROLE]),
    };
    await world.pools.tenants.withTenantTransaction(tenantId, async (tx) => {
      const locked = await lockLeadInScope(tx, reader, made.lead.id);
      if (locked === null) throw new Error('the lead is not in its own company');
      const act = { actorUserId: company.people.owner.userId, now: Date.now() };
      const result = markLost(
        locked.lifecycle,
        { reason: 'postponed', resurfaceOn },
        { today: dayFromToday(0), at: act.now, by: act.actorUserId },
      );
      await recordLeadMoves(tx, locked, result, personOf(act));
    });
    expect((await read(company, made.lead.id)).lead.state).toBe('lost');
    expect(await sweepAt(world, tenantId, onTheClock(dayFromToday(2), '09:30'))).toBe(true);
    expect((await read(company, made.lead.id)).lead.state).toBe('lost');
    expect(await sweepAt(world, tenantId, onTheClock(resurfaceOn, '09:00'))).toBe(true);
    const back = await read(company, made.lead.id);
    expect(back.lead).toMatchObject({ state: null, stage: 'new' });
    expect(back.lifecycle.lastClose).toMatchObject({ state: 'lost', lostReason: 'postponed' });
    const followUps = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.provenance === 'resurface',
    );
    expect(followUps).toHaveLength(1);
    expect(followUps[0]).toMatchObject({
      kind: 'follow_up',
      assigneeUserId: company.people.rep.userId,
    });
    const [still] = await world.pools.admin.db.select().from(lead).where(eq(lead.id, made.lead.id));
    expect(still).toBeDefined();
  });
  it('a company is due once its clock passes 09:00, and not again once its day is swept', async () => {
    const due = new CrmDailySweepAdminRepository(world.pools.admin.db);
    const tenantId = snoozing.company.tenantId;
    const day = dayFromToday(A_QUIET_MORNING);
    expect(await due.dueTenants(onTheClock(day, '08:59'), EVERY_COMPANY)).not.toContain(tenantId);
    expect(await due.dueTenants(onTheClock(day, '09:00'), EVERY_COMPANY)).toContain(tenantId);
    expect(await sweepAt(world, tenantId, onTheClock(day, '09:00'))).toBe(true);
    expect(await due.dueTenants(onTheClock(day, '09:15'), EVERY_COMPANY)).not.toContain(tenantId);
  });

  it('a sweep and a bulk assign over the same leads both finish, never a deadlock', async () => {
    const company = overlapping;
    const tenantId = company.company.tenantId;
    // The first lead (the lower id) wakes today; the second has been quiet for forty days.
    const waking = await captured(ownerOf(company), aCapture(aPhone()));
    const quietOne = await captured(ownerOf(company), aCapture(aPhone()));
    const wakeOn = dayFromToday(2);
    await ownerOf(company).call('POST', `/leads/${waking.lead.id}/snooze`, {
      wakeOn,
      capturedAt: now(),
    });
    await world.pools.admin.db
      .update(lead)
      .set({ lastActivityAt: new Date(Date.now() - (DORMANT_AFTER_DAYS + 10) * MS_PER_DAY) })
      .where(eq(lead.id, quietOne.lead.id));
    // The bulk assign waits on the first lead, then the sweep: had the sweep taken the quiet lead
    // first, each would hold what the other waits for once the first lead is let go.
    const held = await holdLock(sql`select id from lead where id = ${waking.lead.id} for update`);
    const giving = ownerOf(company).call<BulkAssigned>('POST', '/leads/assign', {
      leadIds: [waking.lead.id, quietOne.lead.id],
      assigneeId: company.people.rep.userId,
    });
    await held.waitForWaiters(1);
    const sweeping = sweepAt(world, tenantId, onTheClock(wakeOn, '09:30'));
    await held.waitForWaiters(2);
    await held.release();
    const [given, swept] = await Promise.allSettled([giving, sweeping]);
    expect([given, swept]).toMatchObject([
      { status: 'fulfilled', value: { status: 200 } },
      { status: 'fulfilled', value: true },
    ]);
  });
});
