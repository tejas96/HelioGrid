import { entitlementOverride } from '@heliogrid/db';
import { bookEntitlements, FOUNDER_ROLE, IN_PACK } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aMembership, aPerson, seed, skipWithoutDatabase } from '../support/fixture';
import { OverrideBench } from './override-bench';

/**
 * Support's goodwill credits against a migrated database (`M12-19`): each names who, what, why and
 * when, writes its audit entry with it, and is recomputed into the company's limits.
 */

const skip = skipWithoutDatabase(
  'GOODWILL CREDIT PROOF',
  'Goodwill credits and who may issue them are UNPROVEN in this run.',
);

const CREDIT = 120;

/** The book's voice minutes for `null` (the trial) or a tier. */
function bookMinutes(tier: 'growth' | null): number {
  const limit = bookEntitlements(IN_PACK.priceBook, tier).find(
    (one) => one.key === 'voice_minutes',
  )?.limit;
  if (typeof limit !== 'number') throw new Error('the book counts no voice minutes');
  return limit;
}

describe.skipIf(skip)('goodwill credits, audited (M12-19)', () => {
  let bench: OverrideBench;

  beforeAll(async () => {
    bench = await OverrideBench.open();
  });

  afterAll(async () => {
    await bench.close();
  });

  const limitOf = async (tenantId: string, key: 'voice_minutes' | 'active_projects') =>
    (await bench.entitlements.limitsOf(tenantId))?.get(key);

  it('a goodwill credit raises its key, survives a renewal and writes its audit entry', async () => {
    const { company, subscriptionId } = await bench.aTrialCompany('credit');
    const { tenantId } = company;

    const issued = await bench.entitlements.issueCredit(bench.actOn(tenantId), {
      key: 'voice_minutes',
      amount: CREDIT,
    });
    if (issued.kind !== 'issued') throw new Error(issued.reason);
    expect(await limitOf(tenantId, 'voice_minutes')).toEqual({
      key: 'voice_minutes',
      limit: bookMinutes(null) + CREDIT,
      source: 'grant',
    });
    // Who, what, why and when — the override row and its audit entry, together.
    const [row] = await bench.pools.admin.db
      .select()
      .from(entitlementOverride)
      .where(eq(entitlementOverride.id, issued.overrideId));
    expect(row).toMatchObject({
      tenantId,
      subscriptionId,
      kind: 'goodwill_credit',
      entitlementKey: 'voice_minutes',
      credit: CREDIT,
      issuedBy: bench.staff.userId,
      reason: bench.actOn(tenantId).reason,
    });
    expect(row?.issuedAt.getTime()).toBe(bench.now);
    expect(await bench.auditOf(tenantId)).toEqual([
      {
        eventType: 'billing.goodwill_credit_issued',
        actorKind: 'platform_staff',
        actorRef: bench.staff.userId,
        subjectKind: 'entitlement_override',
        subjectRef: issued.overrideId,
      },
    ]);

    // The credit is the subscription's: conversion and a renewal recompute it in.
    await bench.convertAndRenew(tenantId, subscriptionId);
    expect((await limitOf(tenantId, 'voice_minutes'))?.limit).toBe(bookMinutes('growth') + CREDIT);

    // Growth has no ceiling on active projects: there is no number to raise, and nothing is written.
    expect((await limitOf(tenantId, 'active_projects'))?.limit).toBe('unlimited');
    expect(
      await bench.entitlements.issueCredit(bench.actOn(tenantId), {
        key: 'active_projects',
        amount: CREDIT,
      }),
    ).toEqual({ kind: 'refused', reason: 'a limit with no ceiling has no number to raise' });
    expect(await bench.auditOf(tenantId)).toHaveLength(1);
  });

  it("a staff id that is one of the company's own people is refused", async () => {
    const { company } = await bench.aTrialCompany('member');
    const insider = aPerson('Company Insider');
    bench.people.push(insider);
    await seed(bench.pools.admin.db, {
      companies: [],
      people: [insider],
      memberships: [aMembership(company, insider, [FOUNDER_ROLE])],
    });
    const act = { ...bench.actOn(company.tenantId), staffUserId: insider.userId };
    const refusal = { kind: 'refused', reason: 'platform staff hold no membership in the company' };
    expect(await bench.entitlements.extendTrial(act)).toEqual(refusal);
    expect(
      await bench.entitlements.issueCredit(act, { key: 'voice_minutes', amount: CREDIT }),
    ).toEqual(refusal);
    expect(await bench.auditOf(company.tenantId)).toEqual([]);
  });
});
