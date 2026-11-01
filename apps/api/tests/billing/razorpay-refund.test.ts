import type { GatewayCheckoutRequest } from '@heliogrid/contracts';
import { IN_PACK, minorUnits, tierBand } from '@heliogrid/domain';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RazorpayBillingGateway } from '../../src/modules/billing/internal/billing-gateway.razorpay';
import { silentLogger } from './support';

/**
 * The IN adapter's two ways out (`M12-47`, `M12-50`) and a reactivation's later start (`M12-08`).
 * The port promises a refund and a cancel are safe to send again: a lost answer that landed is
 * read back from the gateway, never sent twice.
 */

const OK = 200;
const BAD_REQUEST = 400;
const BAD_GATEWAY = 502;
const MS_PER_SECOND = 1_000;
/** Growth for a month with 18% GST, in paise: a refund's amount. */
const GROWTH_MONTH_MINOR = 471_882;

interface Sent {
  readonly method: string;
  readonly path: string;
  readonly body: Record<string, unknown> | null;
}

/** Razorpay answering each `METHOD /path` as scripted, keeping what it was sent. */
function gatewayAnswering(answers: Record<string, [number, unknown]>) {
  const sent: Sent[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { method: string; body?: string }) => {
      const path = new URL(url).pathname.replace(/^\/v1/, '');
      sent.push({
        method: init.method,
        path,
        body: init.body === undefined ? null : JSON.parse(init.body),
      });
      const [status, body] = answers[`${init.method} ${path}`] ?? [OK, {}];
      return new Response(JSON.stringify(body), { status });
    }),
  );
  const gateway = new RazorpayBillingGateway(
    { keyId: 'rzp_test_key', keySecret: 'secret', webhookSecret: 'hook' },
    silentLogger(),
  );
  return { gateway, sent };
}

const REFUND = {
  chargeRef: 'pay_1',
  amount: minorUnits(GROWTH_MONTH_MINOR),
  reference: 'invoice-1',
};

describe('the IN adapter refunds, cancels at the cycle end and starts a mandate later', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a refund goes to the payment for its whole amount and answers the refund’s id', async () => {
    const { gateway, sent } = gatewayAnswering({
      'POST /payments/pay_1/refund': [OK, { id: 'rfnd_1' }],
    });
    await expect(gateway.refund(REFUND)).resolves.toBe('rfnd_1');
    expect(sent).toEqual([
      {
        method: 'POST',
        path: '/payments/pay_1/refund',
        body: { amount: REFUND.amount, notes: { reference: 'invoice-1' } },
      },
    ]);
  });

  it.each([
    [
      'a refund already made answers that refund',
      [{ id: 'rfnd_0', status: 'processed' }],
      'rfnd_0',
    ],
    ['a refund still pending answers that refund', [{ id: 'rfnd_0', status: 'pending' }], 'rfnd_0'],
    ['only a failed refund throws the refusal', [{ id: 'rfnd_0', status: 'failed' }], null],
    ['no refund at all throws the refusal', [], null],
  ])('a refused refund is read back: %s', async (_case, items, answer) => {
    const { gateway, sent } = gatewayAnswering({
      'POST /payments/pay_1/refund': [BAD_REQUEST, { error: { code: 'BAD_REQUEST_ERROR' } }],
      'GET /payments/pay_1/refunds': [OK, { items }],
    });
    if (answer === null) await expect(gateway.refund(REFUND)).rejects.toThrow(/400/);
    else await expect(gateway.refund(REFUND)).resolves.toBe(answer);
    expect(sent.filter((call) => call.method === 'POST')).toHaveLength(1);
  });

  it('a gateway that failed the refund is thrown at once and never read back', async () => {
    const { gateway, sent } = gatewayAnswering({
      'POST /payments/pay_1/refund': [BAD_GATEWAY, {}],
    });
    await expect(gateway.refund(REFUND)).rejects.toThrow(/502/);
    expect(sent.map((call) => call.method)).toEqual(['POST']);
  });

  it('a cancel at the cycle end asks Razorpay to stop after the current cycle', async () => {
    const { gateway, sent } = gatewayAnswering({});
    await expect(gateway.cancelAtCycleEnd('sub_1')).resolves.toBeUndefined();
    expect(sent).toEqual([
      { method: 'POST', path: '/subscriptions/sub_1/cancel', body: { cancel_at_cycle_end: 1 } },
    ]);
  });

  it.each([
    ['cancelled', true],
    ['completed', true],
    ['expired', true],
    ['active', false],
  ])('a refused cancel on a mandate that is %s resolves: %s', async (status, resolves) => {
    const { gateway } = gatewayAnswering({
      'POST /subscriptions/sub_1/cancel': [BAD_REQUEST, {}],
      'GET /subscriptions/sub_1': [OK, { status }],
    });
    if (resolves) await expect(gateway.cancelAtCycleEnd('sub_1')).resolves.toBeUndefined();
    else await expect(gateway.cancelAtCycleEnd('sub_1')).rejects.toThrow(/400/);
  });

  const aMandatePage = (startsAt: number | null): GatewayCheckoutRequest => ({
    route: IN_PACK.paymentRails.ladder[tierBand('growth')].monthly,
    gatewayPlanRef: 'plan_1',
    amount: minorUnits(GROWTH_MONTH_MINOR),
    currencyCode: 'INR',
    reference: 'checkout-1',
    expiresAt: Date.parse('2026-11-02T00:00:00Z'),
    startsAt,
  });

  it.each([
    [
      'a reactivation from a running period starts the mandate at its end',
      Date.parse('2026-11-20T00:00:00Z'),
    ],
    ['a page with no start sends none', null],
  ])('%s', async (_case, startsAt) => {
    const { gateway, sent } = gatewayAnswering({
      'POST /subscriptions': [OK, { id: 'sub_1', short_url: 'https://rzp.io/i/abc' }],
    });
    await gateway.openCheckout(aMandatePage(startsAt));
    const [opened] = sent;
    if (startsAt === null) expect(opened?.body).not.toHaveProperty('start_at');
    else expect(opened?.body).toMatchObject({ start_at: startsAt / MS_PER_SECOND });
  });
});
