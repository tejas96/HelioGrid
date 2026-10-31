import { afterEach, describe, expect, it, vi } from 'vitest';
import { RazorpayBillingGateway } from '../../src/modules/billing/internal/billing-gateway.razorpay';
import { silentLogger } from './support';

/**
 * The publish asks the gateway whether it holds a plan (`billing-gateway.ts`, `hasPlan`). Razorpay
 * answers 400 for a well-formed id it does not hold and 404 for any other id.
 */

const OK = 200;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

function gatewayAnswering(status: number): RazorpayBillingGateway {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ id: 'plan_1' }), { status })),
  );
  return new RazorpayBillingGateway(
    { keyId: 'rzp_test_key', keySecret: 'secret', webhookSecret: 'hook' },
    silentLogger(),
  );
}

describe('the IN adapter checks a plan', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a plan the gateway answers for is held', async () => {
    await expect(gatewayAnswering(OK).hasPlan('plan_1')).resolves.toBe(true);
  });

  it.each([BAD_REQUEST, NOT_FOUND])(
    'a plan the gateway answers %i for is not held',
    async (status) => {
      await expect(gatewayAnswering(status).hasPlan('dev_plan_growth_monthly_1')).resolves.toBe(
        false,
      );
    },
  );

  it('a gateway that cannot tell throws, so no second plan is made', async () => {
    await expect(gatewayAnswering(SERVER_ERROR).hasPlan('plan_1')).rejects.toThrow();
  });
});
