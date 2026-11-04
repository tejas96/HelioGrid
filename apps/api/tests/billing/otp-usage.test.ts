import { usageRecordWorkflow } from '@heliogrid/contracts/workflows';
import { orchestrationOutbox } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../../src/common/temporal/outbox.dispatcher';
import { OtpUsageRepository } from '../../src/modules/billing/otp-usage.repository';
import { OtpUsageService } from '../../src/modules/billing/otp-usage.service';
import {
  aChallenge,
  aCompany,
  aMembership,
  aPerson,
  type Fixture,
  openPools,
  seed,
  unseed,
} from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';
import { silentLogger } from './support';

/**
 * A sign-in code is a company's OTP usage once it signs a person in to that company (`M12-33`,
 * owner ruling 2026-11-04): metered once, keyed by its challenge, never billed. A code for a person
 * with no company is the platform's own cost and meters nothing.
 */

const skip = skipWithoutHarness(
  'OTP USAGE PROOF',
  'That a sent sign-in code is counted for the company it signs in to is UNPROVEN in this run.',
);

const CODE = '615204';
const company = aCompany('OTP Usage Co');
const member = aPerson('Kavita Joshi');
const loner = aPerson('Nobody Yet');
const memberCode = aChallenge(member.phoneE164, CODE);
const lonerCode = aChallenge(loner.phoneE164, CODE);
const fixture: Fixture = {
  companies: [company],
  people: [member, loner],
  memberships: [aMembership(company, member, [FOUNDER_ROLE])],
  challenges: [memberCode, lonerCode],
};

describe.skipIf(skip)('a sent sign-in code is the company’s OTP usage (M12-33)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  beforeAll(async () => {
    pools = openPools();
    await unseed(pools.admin.db, fixture);
    await seed(pools.admin.db, fixture);
    http = await bootHttp();
  });

  afterAll(async () => {
    await http?.close();
    if (pools) {
      await unseed(pools.admin.db, fixture);
      await pools.close();
    }
  });

  const verify = (challengeId: string) =>
    http.callAnonymously('POST', '/auth/otp/verify', { challengeId, code: CODE, platform: 'web' });

  /** The ledger hand-offs a code left, read by the key the code carries. */
  async function handoffsOf(challengeId: string) {
    const rows = await pools.admin.db
      .select({ tenantId: orchestrationOutbox.tenantId, payload: orchestrationOutbox.payload })
      .from(orchestrationOutbox)
      .where(and(eq(orchestrationOutbox.workflow, usageRecordWorkflow.name)));
    return rows.filter(
      (row) => (row.payload as { idempotencyKey?: string }).idempotencyKey === challengeId,
    );
  }

  it('a code that signs a person in to a company meters one unbilled code there', async () => {
    const reply = await verify(memberCode.challengeId);

    expect(reply.status).toBe(HttpStatus.OK);
    const handoffs = await handoffsOf(memberCode.challengeId);
    expect(handoffs).toHaveLength(1);
    expect(handoffs[0]?.tenantId).toBe(company.tenantId);
    expect(handoffs[0]?.payload).toMatchObject({
      tenantId: company.tenantId,
      meter: 'otp_delivery',
      quantity: 1,
      billable: false,
      subjectKind: 'user_account',
      subjectRef: member.userId,
    });
  });

  it('a code whose ledger hand-off cannot be written still signs the person in', async () => {
    const gone = openPools();
    await gone.close();
    const failing = new OtpUsageService(
      new OtpUsageRepository(gone.tenants),
      http.app.get(OutboxDispatcher),
      silentLogger(),
    );

    await expect(
      failing.meterSignIn({
        tenantId: company.tenantId,
        userAccountId: member.userId,
        challengeId: memberCode.challengeId,
        now: Date.now(),
      }),
    ).resolves.toBeUndefined();
  });

  it('a code for a person with no company meters nothing', async () => {
    const reply = await verify(lonerCode.challengeId);

    expect(reply.status).toBe(HttpStatus.OK);
    expect(await handoffsOf(lonerCode.challengeId)).toEqual([]);
  });
});
