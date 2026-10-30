import { randomUUID } from 'node:crypto';
import { type UsageRecordStepInput, usageRecordWorkflow } from '@heliogrid/contracts/workflows';
import { createDb, orchestrationOutbox, usageEvent } from '@heliogrid/db';
import { MS_PER_DAY } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UsageAdminRepository } from '../../src/modules/billing/usage.admin.repository';
import { UsageRepository } from '../../src/modules/billing/usage.repository';
import { UsageService } from '../../src/modules/billing/usage.service';
import { meterUsage } from '../../src/modules/billing/usage-meter.repository';
import {
  aCompany,
  adminUrl,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { entitlementServiceOf, usageServiceOf } from './support';

/**
 * The usage ledger against a migrated database (`M12-18`, `M12-32`): every figure is one rollup of
 * the ledger, a repeated event changes nothing, and a ledger write that fails never undoes the act
 * it records — the step is delivered again and lands once.
 */

const skip = skipWithoutDatabase(
  'USAGE LEDGER PROOF',
  'That the ledger is the one counter, and that metering never fails its act, is UNPROVEN in this run.',
);

const NOW = Date.parse('2026-10-30T12:00:00Z');
const WINDOW = { from: new Date(NOW - MS_PER_DAY), to: new Date(NOW + MS_PER_DAY) };
/** Seconds of talk on each call the case meters. */
const FIRST_CALL = 90;
const SECOND_CALL = 45;
const OLD_CALL = 600;
const REDELIVERED_CALL = 120;

/** One event as the step receives it, at the window's middle unless told otherwise. */
function anEvent(
  tenantId: string,
  overrides: Partial<UsageRecordStepInput> & Pick<UsageRecordStepInput, 'meter' | 'quantity'>,
): UsageRecordStepInput {
  return {
    tenantId,
    billable: true,
    subjectKind: 'tenant',
    subjectRef: tenantId,
    idempotencyKey: randomUUID(),
    occurredAt: new Date(NOW).toISOString(),
    ...overrides,
  };
}

describe.skipIf(skip)('the usage ledger is the one counter (M12-18, M12-32)', () => {
  let pools: ReturnType<typeof openPools>;
  let usage: UsageService;
  const companies: Company[] = [];

  beforeAll(async () => {
    pools = openPools();
    usage = usageServiceOf(pools);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    await pools.close();
  });

  async function aNewCompany(name: string): Promise<string> {
    const company = aCompany(`Usage ledger ${name} ${randomUUID()}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    return company.tenantId;
  }

  it('one rollup of the ledger answers every reader, and a replayed event changes nothing', async () => {
    const tenantId = await aNewCompany('rollup');
    const other = await aNewCompany('other');
    const call = anEvent(tenantId, { meter: 'voice_minutes', quantity: FIRST_CALL });
    const events = [
      call,
      anEvent(tenantId, { meter: 'voice_minutes', quantity: SECOND_CALL }),
      anEvent(tenantId, { meter: 'ai_roof_detections', quantity: 1 }),
      // A detection that returned nothing: ledgered for cost, never billed (M12-33).
      anEvent(tenantId, { meter: 'ai_roof_detections', quantity: 1, billable: false }),
      // A cost line that claims to bill is written as unbilled (M12-37).
      anEvent(tenantId, { meter: 'ai_extraction', quantity: 3 }),
      // Outside the window: it is in the ledger and in no figure for this window.
      anEvent(tenantId, {
        meter: 'voice_minutes',
        quantity: OLD_CALL,
        occurredAt: new Date(NOW - 2 * MS_PER_DAY).toISOString(),
      }),
      // Another company's use is never this company's figure.
      anEvent(other, { meter: 'voice_minutes', quantity: 999 }),
    ];
    for (const event of events) {
      expect(await usage.record(event, NOW)).toEqual({ recorded: true });
    }
    // A retried job or a repeated webhook: the same event again writes nothing (M12-32).
    expect(await usage.record(call, NOW + 1)).toEqual({ recorded: false });

    const billed = await usage.billedRollupOf(
      tenantId,
      ['voice_minutes', 'ai_roof_detections', 'marketing_sends'],
      WINDOW,
    );
    expect(Object.fromEntries(billed)).toEqual({
      voice_minutes: FIRST_CALL + SECOND_CALL,
      ai_roof_detections: 1,
      marketing_sends: 0,
    });
    const cost = await usage.costRollupOf(tenantId, ['ai_extraction', 'otp_delivery'], WINDOW);
    expect(Object.fromEntries(cost)).toEqual({ ai_extraction: 3, otp_delivery: 0 });

    // Reproducible from the ledger alone: the raw rows sum to the same figures.
    const rows = await pools.admin.db
      .select({
        meter: usageEvent.meter,
        quantity: usageEvent.quantity,
        billable: usageEvent.billable,
      })
      .from(usageEvent)
      .where(eq(usageEvent.tenantId, tenantId));
    expect(rows).toHaveLength(events.filter((event) => event.tenantId === tenantId).length);
    const billedVoice = rows
      .filter((row) => row.meter === 'voice_minutes' && row.billable)
      .reduce((sum, row) => sum + row.quantity, 0);
    expect(billedVoice).toBe(FIRST_CALL + SECOND_CALL + OLD_CALL);
    expect(rows.filter((row) => row.meter === 'ai_extraction' && row.billable)).toHaveLength(0);
  });

  it('a meter write that fails leaves the action done, and the redelivered step records the event once', async () => {
    const tenantId = await aNewCompany('failing write');
    const callId = randomUUID();

    // The act: the producer's own transaction meters its unit and commits.
    const eventId = await pools.tenants.withTenantTransaction(tenantId, (tx) =>
      meterUsage(tx, {
        tenantId,
        meter: 'voice_minutes',
        quantity: REDELIVERED_CALL,
        billable: true,
        subjectKind: 'tenant',
        subjectRef: tenantId,
        idempotencyKey: `call-${callId}`,
        occurredAt: NOW,
      }),
    );
    const [handoff] = await pools.admin.db
      .select({ payload: orchestrationOutbox.payload, workflow: orchestrationOutbox.workflow })
      .from(orchestrationOutbox)
      .where(eq(orchestrationOutbox.id, eventId));
    expect(handoff?.workflow).toBe(usageRecordWorkflow.name);
    // Committed with the act, and nothing in the ledger yet: the act never waited on the write.
    expect(await ledgerRowsOf(tenantId)).toBe(0);

    // The step fails for real: its database is gone.
    const gone = createDb(adminUrl, { max: 1 });
    await gone.client.end();
    const failing = new UsageService(
      new UsageRepository(pools.tenants),
      new UsageAdminRepository(gone.db),
      entitlementServiceOf(pools),
    );
    const { eventId: _id, ...event } = usageRecordWorkflow.input.parse(handoff?.payload);
    await expect(failing.record(event, NOW)).rejects.toThrow();
    expect(await ledgerRowsOf(tenantId)).toBe(0);

    // Temporal delivers the step again; a third delivery is a no-op.
    expect(await usage.record(event, NOW + 1)).toEqual({ recorded: true });
    expect(await usage.record(event, NOW + 2)).toEqual({ recorded: false });
    expect(await ledgerRowsOf(tenantId)).toBe(1);
    const billed = await usage.billedRollupOf(tenantId, ['voice_minutes'], WINDOW);
    expect(billed.get('voice_minutes')).toBe(REDELIVERED_CALL);
  });

  it('one call keyed by its own id meters its billed seconds and its speech cost apart', async () => {
    const tenantId = await aNewCompany('two meters');
    const idempotencyKey = `call-${randomUUID()}`;
    const voice = anEvent(tenantId, {
      meter: 'voice_minutes',
      quantity: FIRST_CALL,
      idempotencyKey,
    });
    const speech = anEvent(tenantId, {
      meter: 'speech',
      quantity: FIRST_CALL,
      billable: false,
      idempotencyKey,
    });
    expect(await usage.record(voice, NOW)).toEqual({ recorded: true });
    expect(await usage.record(speech, NOW)).toEqual({ recorded: true });
    expect(usageRecordWorkflow.workflowId({ eventId: randomUUID(), ...voice })).not.toBe(
      usageRecordWorkflow.workflowId({ eventId: randomUUID(), ...speech }),
    );
    expect(
      (await usage.billedRollupOf(tenantId, ['voice_minutes'], WINDOW)).get('voice_minutes'),
    ).toBe(FIRST_CALL);
    expect((await usage.costRollupOf(tenantId, ['speech'], WINDOW)).get('speech')).toBe(FIRST_CALL);
  });

  async function ledgerRowsOf(tenantId: string): Promise<number> {
    const rows = await pools.admin.db
      .select({ id: usageEvent.id })
      .from(usageEvent)
      .where(eq(usageEvent.tenantId, tenantId));
    return rows.length;
  }
});
