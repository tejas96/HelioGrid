import { subscription } from '@heliogrid/db';
import { extendedTrialEndsAt, MS_PER_DAY } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { OverrideBench } from './override-bench';

/**
 * The trial's one extension against a migrated database (`M12-52`): seven days, once per company,
 * only before the trial ends, audited — and never undone by the expiry timer.
 */

const skip = skipWithoutDatabase(
  'TRIAL EXTENSION PROOF',
  'The trial extension and its race with the expiry timer are UNPROVEN in this run.',
);

const AN_HOUR_MS = 3_600_000;

describe.skipIf(skip)('the trial extension, audited (M12-52, M12-19)', () => {
  let bench: OverrideBench;

  beforeAll(async () => {
    bench = await OverrideBench.open();
  });

  afterAll(async () => {
    await bench.close();
  });

  const trialEndOf = async (subscriptionId: string) =>
    (
      await bench.pools.admin.db
        .select({ at: subscription.trialEndsAt, state: subscription.state })
        .from(subscription)
        .where(eq(subscription.id, subscriptionId))
    )[0];

  it('a trial extends by seven days once and only while trialing', async () => {
    const { company, subscriptionId } = await bench.aTrialCompany('extend');
    const { tenantId } = company;
    const before = (await trialEndOf(subscriptionId))?.at?.getTime();
    if (before === undefined) throw new Error('no trial end');

    const first = await bench.entitlements.extendTrial(bench.actOn(tenantId));
    if (first.kind !== 'issued') throw new Error(first.reason);
    expect((await trialEndOf(subscriptionId))?.at?.getTime()).toBe(extendedTrialEndsAt(before));
    expect((await bench.auditOf(tenantId)).map((entry) => entry.eventType)).toEqual([
      'billing.trial_extended',
    ]);

    expect(await bench.entitlements.extendTrial(bench.actOn(tenantId))).toEqual({
      kind: 'refused',
      reason: 'this company’s trial was extended once already',
    });
    expect((await trialEndOf(subscriptionId))?.at?.getTime()).toBe(extendedTrialEndsAt(before));

    // A trial whose end has passed is the timers' to expire, never support's to revive.
    const { company: ended } = await bench.aTrialCompany('ended');
    const afterTheEnd = bench.trialEndsAt + MS_PER_DAY;
    expect(await bench.entitlements.extendTrial(bench.actOn(ended.tenantId, afterTheEnd))).toEqual({
      kind: 'refused',
      reason: 'the trial has already ended',
    });
    // A paying company has no trial to extend.
    const { company: paying, subscriptionId: paid } = await bench.aTrialCompany('paying');
    await bench.convertAndRenew(paying.tenantId, paid);
    expect(await bench.entitlements.extendTrial(bench.actOn(paying.tenantId))).toEqual({
      kind: 'refused',
      reason: 'only a company on its trial can have it extended',
    });
    expect(await bench.auditOf(ended.tenantId)).toEqual([]);
    expect(await bench.auditOf(paying.tenantId)).toEqual([]);
  });

  it('an extension the expiry timer already read past is never undone by it', async () => {
    // The trial ends an hour from now; the timer runs two hours late and reads it as ended.
    const { company, subscriptionId } = await bench.aTrialCompany('race', bench.now + AN_HOUR_MS);
    const read = (
      await bench.billing.trialsEndedBy(bench.now + 2 * AN_HOUR_MS, Number.MAX_SAFE_INTEGER)
    ).find((row) => row.id === subscriptionId);
    if (read === undefined) throw new Error('the timer did not read the ended trial');

    // Support extends it before its end, while the timer still holds its old read.
    expect((await bench.entitlements.extendTrial(bench.actOn(company.tenantId))).kind).toBe(
      'issued',
    );
    const moved = await bench.billing.move(read, {
      from: 'trialing',
      to: 'expired',
      cause: 'trial_expired',
      enteredAt: read.trialEndsAt ?? bench.now,
    });

    expect(moved).toBe(false);
    expect((await trialEndOf(subscriptionId))?.state).toBe('trialing');
  });
});
