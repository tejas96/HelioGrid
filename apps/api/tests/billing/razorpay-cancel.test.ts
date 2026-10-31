import type { CollectionKind } from '@heliogrid/domain';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RazorpayBillingGateway } from '../../src/modules/billing/internal/billing-gateway.razorpay';
import { silentLogger } from './support';

/**
 * The port promises a cancel is safe to send again (`billing-gateway.ts`). Razorpay refuses to
 * cancel a page that can take no more money, so the adapter reads the page's status.
 */

const BAD_REQUEST = 400;
const OK = 200;

function gatewayAnswering(cancel: number, status: string): RazorpayBillingGateway {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: { method: string }) =>
      init.method === 'POST'
        ? new Response('{}', { status: cancel })
        : new Response(JSON.stringify({ status }), { status: OK }),
    ),
  );
  return new RazorpayBillingGateway(
    { keyId: 'rzp_test_key', keySecret: 'secret', webhookSecret: 'hook' },
    silentLogger(),
  );
}

describe('the IN adapter cancels a hosted page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each<[CollectionKind, string]>([
    ['mandate', 'cancelled'],
    ['mandate', 'expired'],
    ['mandate', 'completed'],
    ['invoice', 'cancelled'],
    ['invoice', 'expired'],
    ['invoice', 'paid'],
  ])(
    'a page the gateway already cancelled, expired or saw paid counts as closed (%s %s)',
    async (collection, status) => {
      await expect(
        gatewayAnswering(BAD_REQUEST, status).closeCheckout(collection, 'ref_1'),
      ).resolves.toBeUndefined();
    },
  );

  it.each<[CollectionKind, string]>([
    ['mandate', 'created'],
    ['invoice', 'created'],
  ])(
    'a refused cancel on a page that can still take money throws (%s %s)',
    async (collection, status) => {
      await expect(
        gatewayAnswering(BAD_REQUEST, status).closeCheckout(collection, 'ref_1'),
      ).rejects.toThrow();
    },
  );
});
