import { randomUUID } from 'node:crypto';
import {
  type CreateTenant,
  IDEMPOTENCY_KEY_HEADER,
  type SessionProjection,
} from '@heliogrid/contracts';
import { subscription, subscriptionStateHistory } from '@heliogrid/db';
import { MS_PER_DAY, TRIAL_DAYS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openPools } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * A company's trial starts with the company (`M12-14`, `M12-52`), on the wire against a migrated
 * database: no billing step, no card, and one live subscription per company (`M12-04`).
 *
 * The companies stay standing: every HTTP suite shares one development number, and deleting a
 * tenant races another suite's sign-in (`apps/api/CLAUDE.md` Traps).
 */

const skip = skipWithoutHarness(
  'TRIAL START WIRE PROOF',
  'The trial a signup starts is UNPROVEN on the wire in this run.',
);

const ONE_SECOND = 1000;

describe.skipIf(skip)('the trial a signup starts (M12-04, M12-14, M12-52)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
  });

  afterAll(async () => {
    await http.close();
    await pools.close();
  });

  async function signUp(): Promise<string> {
    const body: CreateTenant = {
      companyName: `Trial Start ${randomUUID()}`,
      ownerName: 'Harness Owner',
      city: 'Pune',
    };
    const created = await http.call<SessionProjection>('POST', '/tenants', body, {
      [IDEMPOTENCY_KEY_HEADER]: randomUUID(),
    });
    expect(created.status).toBe(HttpStatus.CREATED);
    const tenantId = created.body.membership?.tenantId;
    if (tenantId === undefined) throw new Error('the signup answered no company');
    return tenantId;
  }

  it('starts a fourteen-day trial with the company', async () => {
    const before = Date.now();
    const tenantId = await signUp();
    const after = Date.now();

    const held = await pools.admin.db
      .select({
        state: subscription.state,
        stateEnteredAt: subscription.stateEnteredAt,
        trialEndsAt: subscription.trialEndsAt,
        paidPeriodEnd: subscription.paidPeriodEnd,
      })
      .from(subscription)
      .where(eq(subscription.tenantId, tenantId));
    expect(held).toHaveLength(1);
    const [trial] = held;
    expect(trial?.state).toBe('trialing');
    expect(trial?.paidPeriodEnd).toBeNull();
    const startedAt = trial?.stateEnteredAt.getTime() ?? 0;
    expect(startedAt).toBeGreaterThanOrEqual(before - ONE_SECOND);
    expect(startedAt).toBeLessThanOrEqual(after);
    expect(trial?.trialEndsAt?.getTime()).toBe(startedAt + TRIAL_DAYS * MS_PER_DAY);

    const history = await pools.admin.db
      .select({ state: subscriptionStateHistory.state, cause: subscriptionStateHistory.cause })
      .from(subscriptionStateHistory)
      .where(eq(subscriptionStateHistory.tenantId, tenantId));
    expect(history).toEqual([{ state: 'trialing', cause: 'trial_started' }]);
  });

  it('refuses a second live subscription for one company', async () => {
    const tenantId = await signUp();
    const now = new Date();
    const second = pools.admin.db.insert(subscription).values({
      tenantId,
      state: 'active',
      stateEnteredAt: now,
      createdAt: now,
    });
    await expect(second).rejects.toMatchObject({ cause: { code: '23505' } });
  });
});
