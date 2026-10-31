import { planPrice, subscription, subscriptionStateHistory } from '@heliogrid/db';
import { MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest';
import { PlanPriceService } from '../../src/modules/billing/billing.public';
import { BillingAlerts } from '../../src/modules/billing/internal/billing-alerts';
import { MarketPackService } from '../../src/modules/market/market.public';
import {
  aCompany,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bootHttp, type Http } from '../support/http';
import { aTrial, collectedFor, signed } from './support';

/**
 * The gateway's signed messages over HTTP (`M12-09`, `M12-13`): money no subscription can take
 * is acknowledged and alerted, never retried; a pause the product does not offer is alerted and
 * never applied; an unsigned message is refused; a message sent twice alerts once.
 */

const skip = skipWithoutDatabase(
  'GATEWAY MESSAGE WIRE PROOF',
  'What the gateway’s messages do, and the alerts they raise, is UNPROVEN in this run.',
);

const DOOR = '/billing/gateway-events';
/** A signature of the right length that no secret made: a SHA-256 digest is 32 bytes. */
const SHA256_BYTES = 32;
const FORGED_SIGNATURE = '00'.repeat(SHA256_BYTES);

describe.skipIf(skip)('the gateway’s signed messages (M12-09, M12-13)', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let raise: MockInstance<BillingAlerts['raise']>;
  const companies: Company[] = [];

  /** A company converted on `gatewayRef`, active, with its history. */
  async function aConvertedCompany(gatewayRef: string): Promise<string> {
    const company = aCompany(`Converted ${gatewayRef}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    const subscriptionId = await aTrial(pools.admin.db, company.tenantId, Date.now() + MS_PER_DAY);
    const [price] = await pools.admin.db.select({ id: planPrice.id }).from(planPrice).limit(1);
    await pools.admin.db
      .update(subscription)
      .set({
        state: 'active',
        tier: 'growth',
        cycle: 'monthly',
        planPriceId: price?.id ?? null,
        gatewayRef,
      })
      .where(eq(subscription.id, subscriptionId));
    return subscriptionId;
  }

  const send = (message: ReturnType<typeof signed>) =>
    http.callAnonymously('POST', DOOR, message.body, message.headers);

  beforeAll(async () => {
    pools = openPools();
    http = await bootHttp();
    raise = vi.spyOn(http.app.get(BillingAlerts), 'raise');
    const pack = await http.app.get(MarketPackService).currentPackOf('IN');
    await http.app.get(PlanPriceService).sync(pack, Date.now());
  });

  afterEach(() => raise.mockClear());

  afterAll(async () => {
    await http.close();
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    await pools.close();
  });

  it('a refused charge is acknowledged with 200 and raises a charge-refused alert', async () => {
    const unknown = signed({
      eventRef: `evt_unknown_${Date.now()}`,
      kind: 'charged',
      charge: {
        gatewayRef: `sub_nobody_${Date.now()}`,
        chargeRef: `pay_nobody_${Date.now()}`,
        occurredAt: Date.now(),
        paysThrough: Date.now() + MS_PER_DAY,
        amount: collectedFor('growth', 'monthly'),
        currencyCode: 'INR',
      },
    });
    expect((await send(unknown)).status).toBe(HttpStatus.OK);
    expect(raise).toHaveBeenCalledWith('billing_charge_refused', expect.anything());

    raise.mockClear();
    const gatewayRef = `sub_currency_${Date.now()}`;
    await aConvertedCompany(gatewayRef);
    const dollars = signed({
      eventRef: `evt_usd_${gatewayRef}`,
      kind: 'charged',
      charge: {
        gatewayRef,
        chargeRef: `pay_usd_${gatewayRef}`,
        occurredAt: Date.now(),
        paysThrough: Date.now() + MS_PER_DAY,
        amount: collectedFor('growth', 'monthly'),
        currencyCode: 'USD',
      },
    });
    expect((await send(dollars)).status).toBe(HttpStatus.OK);
    expect(raise).toHaveBeenCalledWith('billing_charge_refused', expect.anything());
  });

  it.each(['paused', 'resumed'] as const)(
    'a pause or resume event raises an alert and leaves the state and history unchanged (%s)',
    async (kind) => {
      const gatewayRef = `sub_${kind}_${Date.now()}`;
      const subscriptionId = await aConvertedCompany(gatewayRef);
      const before = await pools.admin.db
        .select()
        .from(subscription)
        .where(eq(subscription.id, subscriptionId));
      const history = () =>
        pools.admin.db
          .select()
          .from(subscriptionStateHistory)
          .where(eq(subscriptionStateHistory.subscriptionId, subscriptionId));
      const historyBefore = await history();

      const reply = await send(signed({ eventRef: `evt_${gatewayRef}`, kind, gatewayRef }));

      expect(reply.status).toBe(HttpStatus.OK);
      expect(raise).toHaveBeenCalledWith(
        'billing_pause_event',
        expect.objectContaining({ event: kind }),
      );
      expect(
        await pools.admin.db.select().from(subscription).where(eq(subscription.id, subscriptionId)),
      ).toEqual(before);
      expect(await history()).toEqual(historyBefore);
    },
  );

  it('refuses a message whose signature does not hold, and reads none of it', async () => {
    const message = signed({
      eventRef: `evt_forged_${Date.now()}`,
      kind: 'paused',
      gatewayRef: 'sub_forged',
    });
    const forged = { ...message.headers, 'x-billing-signature': FORGED_SIGNATURE };
    const reply = await http.callAnonymously<{ error?: { code: string } }>(
      'POST',
      DOOR,
      message.body,
      forged,
    );
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(reply.body.error?.code).toBe('SIGNATURE_INVALID');
    expect(raise).not.toHaveBeenCalled();
  });

  it('a message sent twice is acted on once and alerts once', async () => {
    const message = signed({
      eventRef: `evt_twice_${Date.now()}`,
      kind: 'paused',
      gatewayRef: 'sub_twice',
    });
    expect((await send(message)).status).toBe(HttpStatus.OK);
    expect((await send(message)).status).toBe(HttpStatus.OK);
    expect(raise).toHaveBeenCalledTimes(1);
  });
});
