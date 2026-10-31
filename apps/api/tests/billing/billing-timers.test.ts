import { randomUUID } from 'node:crypto';
import { subscription, subscriptionStateHistory, tenant } from '@heliogrid/db';
import { MS_PER_DAY, PAST_DUE_GRACE_DAYS, TRIAL_DAYS } from '@heliogrid/domain';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BillingAdminRepository } from '../../src/modules/billing/billing.admin.repository';
import { BillingService } from '../../src/modules/billing/billing.service';
import {
  aCompany,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import { renewalServiceOf } from './renewal-bench';
import { aDevelopmentGateway, entitlementServiceOf, RecordedAlerts, silentLogger } from './support';

/**
 * The billing timers, against a migrated database (`M12-04`, `M12-06`, `M12-07`, `M12-52`).
 *
 * The timers read every company, and other suites run beside this one. So every moment here sits
 * in 1990, where no row but this suite's lives: the timers never touch another suite's company.
 */

const skip = skipWithoutDatabase(
  'BILLING TIMERS PROOF',
  'The trial expiry and the past-due halt are UNPROVEN in this run.',
);

const LONG_AGO = Date.parse('1990-01-01T06:00:00Z');
const ONE_MS = 1;
/** How late a timer may run: a release away, or a worker down for days. */
const DAYS_LATE = 3;
/** A new company is found the next run, minutes after it signs up. */
const FIVE_MINUTES_AFTER_SIGNUP = 300_000;

describe.skipIf(skip)('the billing timers (M12-04, M12-06, M12-52)', () => {
  let pools: ReturnType<typeof openPools>;
  let timers: BillingService;
  let repository: BillingAdminRepository;
  let companies: Company[] = [];

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
    repository = new BillingAdminRepository(pools.admin.db);
    timers = new BillingService(
      repository,
      entitlementServiceOf(pools),
      renewalServiceOf(pools, aDevelopmentGateway(), new RecordedAlerts(silentLogger())),
    );
  });

  afterEach(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    companies = [];
  });

  afterAll(async () => {
    await pools.close();
  });

  /** A company created at `createdAt`, holding the subscription given, if any. */
  async function aCompanyHolding(
    createdAt: number,
    held?: { state: 'trialing' | 'past_due'; enteredAt: number; trialEndsAt?: number },
  ): Promise<string> {
    const company = aCompany(`Billing Timers ${randomUUID()}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    await pools.admin.db
      .update(tenant)
      .set({ createdAt: new Date(createdAt) })
      .where(eq(tenant.id, company.tenantId));
    if (held) {
      await pools.admin.db.insert(subscription).values({
        tenantId: company.tenantId,
        state: held.state,
        stateEnteredAt: new Date(held.enteredAt),
        trialEndsAt: held.trialEndsAt === undefined ? null : new Date(held.trialEndsAt),
        createdAt: new Date(createdAt),
      });
    }
    return company.tenantId;
  }

  async function historyOf(tenantId: string) {
    const rows = await pools.admin.db
      .select({
        state: subscriptionStateHistory.state,
        cause: subscriptionStateHistory.cause,
        enteredAt: subscriptionStateHistory.enteredAt,
      })
      .from(subscriptionStateHistory)
      .where(eq(subscriptionStateHistory.tenantId, tenantId))
      .orderBy(asc(subscriptionStateHistory.enteredAt));
    return rows.map((row) => ({ ...row, enteredAt: row.enteredAt.getTime() }));
  }

  async function statesOf(tenantId: string) {
    const rows = await pools.admin.db
      .select({ state: subscription.state })
      .from(subscription)
      .where(inArray(subscription.tenantId, [tenantId]));
    return rows.map((row) => row.state);
  }

  it('halts a past-due company at day seven and not before', async () => {
    const tenantId = await aCompanyHolding(LONG_AGO, { state: 'past_due', enteredAt: LONG_AGO });
    const daySeven = LONG_AGO + PAST_DUE_GRACE_DAYS * MS_PER_DAY;

    await timers.advanceDue(daySeven - ONE_MS);
    expect(await statesOf(tenantId)).toEqual(['past_due']);

    await timers.advanceDue(daySeven + DAYS_LATE * MS_PER_DAY);
    expect(await statesOf(tenantId)).toEqual(['halted']);
    // Recorded at day seven itself, however late the timer ran.
    expect(await historyOf(tenantId)).toEqual([
      { state: 'halted', cause: 'grace_expired', enteredAt: daySeven },
    ]);
  });

  it('moves rows whose moments carry microseconds, as migration 0034 wrote them', async () => {
    const pastDue = await aCompanyHolding(LONG_AGO, {
      state: 'past_due',
      enteredAt: LONG_AGO,
      trialEndsAt: LONG_AGO,
    });
    const trial = await aCompanyHolding(LONG_AGO, {
      state: 'trialing',
      enteredAt: LONG_AGO - TRIAL_DAYS * MS_PER_DAY,
      trialEndsAt: LONG_AGO,
    });
    // `now()` keeps microseconds; a JS Date read back holds only the milliseconds.
    await pools.admin.db
      .update(subscription)
      .set({
        stateEnteredAt: sql`${subscription.stateEnteredAt} + interval '123 microseconds'`,
        trialEndsAt: sql`${subscription.trialEndsAt} + interval '456 microseconds'`,
      })
      .where(inArray(subscription.tenantId, [pastDue, trial]));

    await timers.advanceDue(LONG_AGO + (PAST_DUE_GRACE_DAYS + DAYS_LATE) * MS_PER_DAY);

    expect(await statesOf(pastDue)).toEqual(['halted']);
    expect(await statesOf(trial)).toEqual(['expired']);
  });

  it('leaves alone a past-due company whose grace started again since it was read', async () => {
    const tenantId = await aCompanyHolding(LONG_AGO, { state: 'past_due', enteredAt: LONG_AGO });
    const daySeven = LONG_AGO + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
    const [read] = await repository.pastDueSince(LONG_AGO, 1);
    if (read === undefined) throw new Error('the overdue company was not read');
    // Paid, then failed again, between the read and the move: a new grace has begun.
    await pools.admin.db
      .update(subscription)
      .set({ stateEnteredAt: new Date(daySeven) })
      .where(eq(subscription.tenantId, tenantId));

    const moved = await repository.move(read, {
      from: 'past_due',
      to: 'halted',
      cause: 'grace_expired',
      enteredAt: daySeven,
    });

    expect(moved).toBe(false);
    expect(await statesOf(tenantId)).toEqual(['past_due']);
    expect(await historyOf(tenantId)).toEqual([]);
  });

  it('expires a trial at its end and never again', async () => {
    const trialEndsAt = LONG_AGO + TRIAL_DAYS * MS_PER_DAY;
    const tenantId = await aCompanyHolding(LONG_AGO, {
      state: 'trialing',
      enteredAt: LONG_AGO,
      trialEndsAt,
    });

    await timers.advanceDue(trialEndsAt - ONE_MS);
    expect(await statesOf(tenantId)).toEqual(['trialing']);

    await timers.advanceDue(trialEndsAt);
    await timers.advanceDue(trialEndsAt + MS_PER_DAY);
    expect(await statesOf(tenantId)).toEqual(['expired']);
    expect(await historyOf(tenantId)).toEqual([
      { state: 'expired', cause: 'trial_expired', enteredAt: trialEndsAt },
    ]);
  });

  it('starts a trial for a new company that has none', async () => {
    const tenantId = await aCompanyHolding(LONG_AGO);
    const now = LONG_AGO + FIVE_MINUTES_AFTER_SIGNUP;

    await timers.advanceDue(now);
    await timers.advanceDue(now + ONE_MS);

    expect(await statesOf(tenantId)).toEqual(['trialing']);
    expect(await historyOf(tenantId)).toEqual([
      { state: 'trialing', cause: 'trial_started', enteredAt: now },
    ]);
    const [held] = await pools.admin.db
      .select({ trialEndsAt: subscription.trialEndsAt })
      .from(subscription)
      .where(eq(subscription.tenantId, tenantId));
    expect(held?.trialEndsAt?.getTime()).toBe(now + TRIAL_DAYS * MS_PER_DAY);
  });
});
