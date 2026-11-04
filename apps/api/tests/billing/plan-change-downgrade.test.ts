import { notification } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness } from './conversion-harness';
import { midCycle, PlanScreen, planChangeBoundaryOf } from './plan-change-bench';

/**
 * A downgrade over HTTP (`M12-49`): the review shows what the lower plan blocks from real usage,
 * the confirm schedules it for the paid period's end and stops the mandate debiting the old
 * amount, Billing shows it, and the billing timers move the plan at the boundary — reading and
 * exporting never stop (`BM-32`).
 */

const skip = skipWithoutDatabase(
  'PLAN DOWNGRADE PROOF',
  'A downgrade’s review, its schedule and its boundary are UNPROVEN in this run.',
);

const STARTER_STORAGE_GB = 10;
/** Past what Starter's storage gate lets through: its 10 GB and a tenth. */
const OVER_STARTER_GB = 12;
const TODAY = new Date().toISOString().slice(0, 10);
const A_MINUTE = 60_000;

describe.skipIf(skip)('a downgrade waits for the paid period’s end (M12-49)', () => {
  let harness: ConversionHarness;
  let screen: PlanScreen;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
    screen = new PlanScreen(harness);
  });

  afterAll(async () => {
    await harness.close();
  });

  it('a downgrade over the lower limits previews what blocks, schedules, and moves the plan at the boundary while reads and exports stay open', async () => {
    const owner = await midCycle(harness, 'Downgrade EPC');
    const { tenantId } = owner.company;
    const used = await screen.aGauge(tenantId, OVER_STARTER_GB, TODAY);
    const starter = { tier: 'starter', cycle: 'monthly' } as const;

    const preview = await screen.preview(owner, starter);
    expect(preview.status).toBe(HttpStatus.OK);
    expect(preview.body).toMatchObject({
      kind: 'downgrade',
      today: null,
      startsAt: new Date(owner.paidPeriodEnd).toISOString(),
      blocks: [{ block: 'storage', used, limit: STARTER_STORAGE_GB }],
    });
    expect(preview.body.afterwards.list).toBe('1999.00');

    const changed = await screen.change(owner, { ...starter, previewDigest: preview.body.digest });
    expect(changed.status).toBe(HttpStatus.OK);
    expect(changed.body).toEqual({
      outcome: 'scheduled',
      effectiveAt: new Date(owner.paidPeriodEnd).toISOString(),
    });
    // Nothing moves today; the mandate is told to end so it never debits the old amount.
    const waiting = await harness.subscriptionOf(owner.subscriptionId);
    expect(waiting?.tier).toBe('growth');
    expect(waiting?.mandateEndingAt).not.toBeNull();
    expect(harness.gateway.endsAtCycleEnd(owner.gatewayRef)).toBe(true);
    expect((await screen.changesOf(owner.subscriptionId)).map((row) => row.status)).toEqual([
      'scheduled',
    ]);

    const home = await screen.home(owner);
    expect(home.body.scheduledChange).toMatchObject({
      kind: 'downgrade',
      tier: 'starter',
      cycle: 'monthly',
      effectiveAt: new Date(owner.paidPeriodEnd).toISOString(),
    });
    expect(home.body.scheduledChange?.afterwards.list).toBe('1999.00');
    expect(home.body.plan.nextBill).toMatchObject({ sale: { list: '1999.00' } });

    await planChangeBoundaryOf(harness.pools).applyDue(owner.paidPeriodEnd + A_MINUTE);

    expect(await harness.subscriptionOf(owner.subscriptionId)).toMatchObject({
      tier: 'starter',
      cycle: 'monthly',
      collection: 'mandate',
      state: 'active',
    });
    expect(await screen.limitOf(tenantId, 'storage_gb')).toBe(STARTER_STORAGE_GB);
    expect((await screen.changesOf(owner.subscriptionId)).map((row) => row.status)).toEqual([
      'applied',
    ]);
    const audit = (await harness.auditOf(tenantId)).map((entry) => entry.eventType);
    expect(audit).toContain('billing.plan_change_scheduled');
    expect(audit).toContain('billing.plan_changed');
    // The picture did not move since the confirm, so no one is told.
    expect(
      await harness.pools.admin.db
        .select()
        .from(notification)
        .where(eq(notification.tenantId, tenantId)),
    ).toEqual([]);

    // Over the lower plan's storage, the company still reads every record and exports its invoices.
    const after = await screen.home(owner);
    expect(after.status).toBe(HttpStatus.OK);
    expect(after.body.scheduledChange).toBeNull();
    const documents = await harness.http.call<{ items: { id: string }[] }>(
      'GET',
      '/billing/documents?limit=10&page=1',
      undefined,
      await owner.headers(),
    );
    expect(documents.status).toBe(HttpStatus.OK);
    const [first] = documents.body.items;
    const exported = await harness.http.call(
      'GET',
      `/billing/documents/${first?.id ?? ''}/download-url`,
      undefined,
      await owner.headers(),
    );
    // 404 while the PDF is not yet made: the read is answered, never refused for the plan.
    expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(exported.status);
  });

  it('the Owners are told when what the downgrade blocks moved before its boundary', async () => {
    const owner = await midCycle(harness, 'Moved Picture EPC');
    const { tenantId } = owner.company;
    expect((await screen.confirm(owner, { tier: 'starter', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    await screen.aGauge(tenantId, OVER_STARTER_GB, TODAY);

    await planChangeBoundaryOf(harness.pools).applyDue(owner.paidPeriodEnd + A_MINUTE);

    expect((await harness.subscriptionOf(owner.subscriptionId))?.tier).toBe('starter');
    const told = await harness.pools.admin.db
      .select()
      .from(notification)
      .where(eq(notification.tenantId, tenantId));
    expect(told.map((each) => [each.type, each.recipientUserRef])).toEqual([
      ['system', owner.ownerUserId],
    ]);
    expect(told[0]?.title).toContain('Starter');
  });
});
