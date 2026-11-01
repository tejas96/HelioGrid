import { publicPricingSchema, REQUEST_ID_HEADER } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

const skip = skipWithoutHarness(
  'PUBLIC PRICING PROOF',
  'The public price list is UNPROVEN to be served in this run.',
);

describe.skipIf(skip)('GET /pricing/:marketCode — the public price list (SCR-M12-01)', () => {
  let http: Http;

  beforeAll(async () => {
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
  });

  it('serves the India price list publicly, with no COGS and no draft figure', async () => {
    const reply = await http.callAnonymously('GET', '/pricing/IN');

    expect(reply.status).toBe(HttpStatus.OK);
    const pricing = publicPricingSchema.parse(reply.body);
    expect(pricing.currencyCode).toBe('INR');
    expect(pricing.plans.map((plan) => plan.tier)).toEqual([
      'starter',
      'growth',
      'pro',
      'enterprise',
    ]);
    expect(pricing.plans[0]?.price).toEqual({
      kind: 'listed',
      perCycle: { monthly: '1999.00', yearly: '19990.00' },
    });
    expect(pricing.plans[3]?.price).toEqual({ kind: 'anchored', from: '24999.00', per: 'monthly' });
    expect(pricing.plans[1]?.voiceMinuteRate).toEqual({ kind: 'published', rate: '6.00' });
    expect(pricing.trial).toEqual({
      days: 14,
      designCeilingKw: 100_000,
      proposalsPerMonth: 'unlimited',
      voiceMinutes: 15,
      storageGb: 5,
    });
    expect(pricing.taxExcluded).toBe(false);
    const text = JSON.stringify(reply.body);
    expect(text).not.toMatch(/cogs|worstCase|marketing|seat|draft/i);
  });

  it.each([
    { name: 'a market with no published pack', code: 'ZZ', status: HttpStatus.NOT_FOUND },
    { name: 'a malformed market code', code: 'india', status: HttpStatus.BAD_REQUEST },
  ])('answers $name with $status, and the request id', async ({ code, status }) => {
    const reply = await http.callAnonymously('GET', `/pricing/${code}`);
    expect(reply.status).toBe(status);
    expect(reply.headers.get(REQUEST_ID_HEADER)).toBeTruthy();
  });
});
