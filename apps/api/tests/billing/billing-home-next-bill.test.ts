import { type BillingHome, billingHomeSchema } from '@heliogrid/contracts';
import { planPrice } from '@heliogrid/db';
import { type BillingCycle, minorUnits } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutHarness } from '../support/http';
import {
  type HomeBench as Bench,
  daysFromNow,
  decimal,
  HomeBench,
  type HomeCompany,
  iso,
  todaysSale,
} from './home-bench';
import { aPlan } from './support';

const skip = skipWithoutHarness(
  'BILLING HOME NEXT BILL PROOF',
  'The next bill of a company whose plan price was later changed is UNPROVEN in this run.',
);

const PAID_DAYS_AGO = 2;
const PERIOD_DAYS_LEFT = 28;
/** How much dearer than today's book an older plan price was. */
const OLDER_PRICE_EXTRA_MINOR = 100_000;

describe.skipIf(skip)(
  'the next bill on GET /billing/home after the book reprices (D392, M12-57)',
  () => {
    let bench: Bench;

    beforeAll(async () => {
      bench = await HomeBench.open();
    });

    afterAll(async () => {
      await bench?.close();
    });

    async function homeOf(held: HomeCompany): Promise<BillingHome> {
      const reply = await bench.get<BillingHome>('/billing/home', await held.owner());
      expect(reply.status).toBe(HttpStatus.OK);
      return billingHomeSchema.parse(reply.body);
    }

    /** A plan the company was sold at an older price: its own row is dearer than today's book. */
    async function anOlderPlan(cycle: BillingCycle) {
      const plan = await aPlan(bench.pools.admin.db, 'growth', cycle);
      const [today] = await bench.pools.admin.db
        .select({ listMinor: planPrice.listMinor })
        .from(planPrice)
        .where(eq(planPrice.id, plan.planPriceId));
      const older = minorUnits((today?.listMinor ?? 0) + OLDER_PRICE_EXTRA_MINOR);
      await bench.pools.admin.db
        .update(planPrice)
        .set({ listMinor: older })
        .where(eq(planPrice.id, plan.planPriceId));
      return { plan, older };
    }

    it('a mandate’s next bill is the amount it was approved for, after the book reprices', async () => {
      const company = await bench.aCompany('Surya Repriced Mandate');
      const { plan, older } = await anOlderPlan('monthly');
      const periodEnd = daysFromNow(PERIOD_DAYS_LEFT);
      await bench.put(
        company,
        'active',
        { enteredAt: daysFromNow(-PAID_DAYS_AGO), paidPeriodEnd: periodEnd },
        plan,
      );
      await bench.aMandatePage(company, plan);

      const home = await homeOf(company);
      expect(home.standing.collection).toBe('mandate');
      expect(home.plan.nextBill).toEqual({
        at: iso(periodEnd),
        sale: expect.objectContaining({ list: decimal(older) }),
      });
      expect(home.plan.nextBill?.sale.list).not.toBe(todaysSale('growth', 'monthly').list);
    });

    it('a payment link’s next bill is today’s book, whatever price it was sold at', async () => {
      const company = await bench.aCompany('Surya Repriced Link');
      const { plan } = await anOlderPlan('yearly');
      const periodEnd = daysFromNow(PERIOD_DAYS_LEFT);
      await bench.put(
        company,
        'active',
        { enteredAt: daysFromNow(-PAID_DAYS_AGO), paidPeriodEnd: periodEnd },
        plan,
      );

      const home = await homeOf(company);
      expect(home.standing.collection).toBe('invoice');
      expect(home.plan.nextBill).toEqual({
        at: iso(periodEnd),
        sale: todaysSale('growth', 'yearly'),
      });
    });
  },
);
