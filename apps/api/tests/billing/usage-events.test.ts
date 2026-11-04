import { type BillingUsageEvents, billingUsageEventsSchema } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutHarness } from '../support/http';
import {
  type HomeBench as Bench,
  daysFromNow,
  HomeBench,
  type HomeCompany,
  iso,
} from './home-bench';
import { UsageBench } from './usage-bench';

const skip = skipWithoutHarness(
  'USAGE EVENTS PROOF',
  'That the ledger panel lists the rows behind a usage figure is UNPROVEN in this run.',
);

/** The trial ends a week from now, so it began a week ago. */
const TRIAL_DAYS_LEFT = 7;
/** Seconds of talk on each call: one before the trial began, then two inside it. */
const EARLY_CALL = 300;
const OLDER_CALL = 161;
const NEWER_CALL = 95;
const DAY_BEFORE_TRIAL = -8;
const THREE_DAYS_AGO = -3;
const TWO_DAYS_AGO = -2;
const YESTERDAY = -1;

describe.skipIf(skip)('GET /billing/usage/events (SCR-M12-04, M12-36)', () => {
  let bench: Bench;
  let usage: UsageBench;

  beforeAll(async () => {
    bench = await HomeBench.open();
    usage = new UsageBench(bench);
  });

  afterAll(async () => {
    await bench?.close();
  });

  async function eventsOf(held: HomeCompany, query: string): Promise<BillingUsageEvents> {
    const reply = await bench.get<BillingUsageEvents>(
      `/billing/usage/events?${query}`,
      await held.owner(),
    );
    expect(reply.status).toBe(HttpStatus.OK);
    return billingUsageEventsSchema.parse(reply.body);
  }

  it('a meter’s events are the cycle’s ledger rows, newest first', async () => {
    const held = await bench.aCompany('Usage Events', TRIAL_DAYS_LEFT);
    const before = daysFromNow(DAY_BEFORE_TRIAL);
    const older = daysFromNow(THREE_DAYS_AGO);
    const newer = daysFromNow(YESTERDAY);
    await usage.call(held, EARLY_CALL, before);
    await usage.call(held, OLDER_CALL, older);
    await usage.call(held, NEWER_CALL, newer);

    const body = await eventsOf(held, 'meter=voice_minutes');

    // The call before the trial began is no part of this cycle.
    expect(body.totalCount).toBe(2);
    expect(body.items.map((each) => [each.occurredAt, each.quantity, each.person])).toEqual([
      [iso(newer), NEWER_CALL, null],
      [iso(older), OLDER_CALL, null],
    ]);
    const figures = await bench.get<{ cycle: unknown }>('/billing/usage', await held.owner());
    expect(body.cycle).toEqual(figures.body.cycle);
  });

  it('pages the rows, and names the person a sign-in code signed in', async () => {
    const held = await bench.aCompany('Usage Codes', TRIAL_DAYS_LEFT);
    await usage.code(held, held.ownerUserId, daysFromNow(TWO_DAYS_AGO));
    await usage.code(held, held.ownerUserId, daysFromNow(YESTERDAY));

    const first = await eventsOf(held, 'meter=otp_delivery&limit=1&page=1');
    const second = await eventsOf(held, 'meter=otp_delivery&limit=1&page=2');

    expect(first.totalCount).toBe(2);
    expect(first.items).toHaveLength(1);
    expect(first.items[0]?.person).toBe(held.ownerName);
    expect(first.items[0]?.occurredAt).toBe(iso(daysFromNow(YESTERDAY)));
    expect(second.items[0]?.occurredAt).toBe(iso(daysFromNow(TWO_DAYS_AGO)));
  });

  it('refuses a meter the panel does not list', async () => {
    const held = await bench.aCompany('Usage Unknown Meter');
    const reply = await bench.get('/billing/usage/events?meter=speech', await held.owner());
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
