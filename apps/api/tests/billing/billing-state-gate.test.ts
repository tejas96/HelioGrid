import { randomUUID } from 'node:crypto';
import {
  type CreateInvitation,
  entitlementBlockedEnvelope,
  IDEMPOTENCY_KEY_HEADER,
} from '@heliogrid/contracts';
import { subscription } from '@heliogrid/db';
import {
  type BillingState,
  METERED_PAUSE_DAY,
  MS_PER_DAY,
  pastDueHaltsAt,
  ROLE_PRESETS,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { declarationOf, pngOf } from '../files/support';
import { aPhone, openPools } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * The billing-state gate on the wire (`M12-21`–`M12-23`, `BM-35`): a company's subscription is
 * moved into each phase, and the two acts the matrix can pause today — a new upload and a team
 * invite — are refused with the typed denial exactly there, while reads, export and every other
 * mutation keep working.
 */

const skip = skipWithoutHarness(
  'BILLING STATE GATE WIRE PROOF',
  'The billing-state gate is UNPROVEN on the wire in this run.',
);

const [ROLE] = ROLE_PRESETS;
const PAUSED_MESSAGE =
  'This is paused for your company. Reading, export, customer links and billing still work.';
const UPLOAD_BYTES = 64;
const PERIOD_DAYS = 5;
/** The test's own clock and the api's differ by the time a request takes. */
const CLOCK_SLACK_MS = 60_000;

describe.skipIf(skip)('the billing-state gate, over HTTP against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let tenantId: string;

  /** The company's one subscription row, moved into a state that began `daysAgo` days back. */
  const moveTo = async (state: BillingState, daysAgo: number, paidPeriodEndInDays?: number) => {
    const now = Date.now();
    await pools.admin.db
      .update(subscription)
      .set({
        state,
        stateEnteredAt: new Date(now - daysAgo * MS_PER_DAY),
        paidPeriodEnd:
          paidPeriodEndInDays === undefined
            ? null
            : new Date(now + paidPeriodEndInDays * MS_PER_DAY),
      })
      .where(eq(subscription.tenantId, tenantId));
  };

  const upload = () => http.call('POST', '/files', declarationOf(tenantId, pngOf(UPLOAD_BYTES)));
  const invite = () => {
    const body: CreateInvitation = {
      inviteeName: 'Gate Invitee',
      phoneE164: aPhone(),
      roles: ROLE === undefined ? [] : [ROLE],
    };
    return http.call('POST', '/invitations', body, { [IDEMPOTENCY_KEY_HEADER]: randomUUID() });
  };
  const blockedBy = (reply: { status: number; body: unknown }) => {
    expect(reply.status).toBe(HttpStatus.FORBIDDEN);
    const { error } = entitlementBlockedEnvelope.parse(reply.body);
    // `F8-34`: the words name what still works and carry no internal identifier.
    expect(error.message).toBe(PAUSED_MESSAGE);
    return error.blocked;
  };

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    await http.signIn();
    tenantId = (await http.createCompany('Billing Gate EPC')).membership?.tenantId ?? '';
    if (tenantId === '') throw new Error('the company was not created');
  });

  beforeEach(async () => {
    await moveTo('trialing', 0);
  });

  afterAll(async () => {
    await http.close();
    await pools.close();
  });

  it('a halted company is refused a new upload and still reads, exports and saves its settings', async () => {
    await moveTo('halted', 1, -PERIOD_DAYS);

    expect(blockedBy(await upload())).toEqual({
      reason: 'billing_state',
      capability: 'new_file_upload',
      phase: 'halted',
      haltsAt: null,
    });
    expect((await http.call('GET', '/settings/effective')).status).toBe(HttpStatus.OK);
    expect((await http.call('GET', '/tenants/me/audit-log')).status).toBe(HttpStatus.OK);
    const quietHours = await http.call<{ value: object }>('GET', '/settings/quiet-hours');
    expect(quietHours.status).toBe(HttpStatus.OK);
    const saved = await http.call('PUT', '/settings/quiet-hours', quietHours.body.value);
    expect(saved.status).toBe(HttpStatus.OK);
  });

  it('invites pause from day 4 of past_due and work through day 3', async () => {
    await moveTo('past_due', METERED_PAUSE_DAY - 1, -1);
    expect((await invite()).status).toBe(HttpStatus.CREATED);

    await moveTo('past_due', METERED_PAUSE_DAY, -1);
    const refusal = blockedBy(await invite());
    expect(refusal).toMatchObject({
      reason: 'billing_state',
      capability: 'team_invites',
      phase: 'past_due_metered_paused',
    });
    const enteredAt = Date.now() - METERED_PAUSE_DAY * MS_PER_DAY;
    const haltsAt = refusal.reason === 'billing_state' ? Date.parse(refusal.haltsAt ?? '') : 0;
    expect(Math.abs(haltsAt - pastDueHaltsAt(enteredAt))).toBeLessThan(CLOCK_SLACK_MS);
    expect((await upload()).status).toBe(HttpStatus.CREATED);
  });

  it('an expired trial and a cancelled company past its period are refused a new upload, and one inside its period is not', async () => {
    await moveTo('expired', 1);
    expect(blockedBy(await upload())).toMatchObject({ phase: 'expired' });

    await moveTo('cancelled', 1, -1);
    expect(blockedBy(await upload())).toMatchObject({ phase: 'cancelled_post_period' });

    await moveTo('cancelled', 1, PERIOD_DAYS);
    expect((await upload()).status).toBe(HttpStatus.CREATED);
  });
});
