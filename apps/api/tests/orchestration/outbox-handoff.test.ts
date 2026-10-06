import { defineWorkflow, platformHealthcheckWorkflow } from '@heliogrid/contracts/workflows';
import { orchestrationOutbox, uuidv7 } from '@heliogrid/db';
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import { eq, inArray } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { OutboxAdminRepository } from '../../src/common/temporal/outbox.admin.repository';
import { OutboxDispatcher } from '../../src/common/temporal/outbox.dispatcher';
import { recordOutboxEvent } from '../../src/common/temporal/outbox.repository';
import type { TemporalConnection } from '../../src/common/temporal/temporal.client';
import { TemporalGateway } from '../../src/common/temporal/temporal.gateway';
import {
  aCompany,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';

/**
 * The durable handoff (AC-3, `infra/temporal/README.md` §5), against REAL state: an event commits
 * with the change that writes it or not at all, and a dispatcher that dies between the start and
 * its mark starts the SAME workflow id when it retries — never a second one. Only Temporal's own
 * client is replaced, by a recorder under the real gateway: the api tests run with no Temporal
 * reachable, and joining a run by its id is the server's half, proven in
 * `infra/temporal/spike/probe-durable-handoff.mjs`.
 */

const company = aCompany('Outbox Handoff EPC');
const elsewhere = aCompany('Other Outbox Handoff EPC');
const fixture: Fixture = { companies: [company, elsewhere], people: [], memberships: [] };
const silent = () => new PinoLogger({ pinoHttp: { level: 'silent' } });
const anEvent = () => ({ eventId: uuidv7(), emittedAt: new Date().toISOString() });
/** Past the dispatcher's 30-second grace, so the sweep owes this event its start. */
const A_MINUTE_MS = 60_000;
const aMinuteAgo = () => new Date(Date.now() - A_MINUTE_MS);

/** A workflow whose input names its tenant, as every product workflow's does (a durable run has no session). */
const aTenantWorkflow = defineWorkflow({
  name: 'tenantProbe',
  taskQueue: 'heliogrid-outbox',
  input: z.object({ eventId: z.string(), tenantId: z.string() }),
  result: z.object({}),
  signals: {},
  queries: {},
  workflowId: (input) => `tenant-probe-${input.eventId}`,
});

/**
 * Temporal's client, recording what the gateway asked of it. `alreadyStarted` answers as the
 * server does for an id whose run has finished under `REJECT_DUPLICATE`; a start of an id in
 * `unreachableFor` fails as a lost connection does.
 */
function aRecordingTemporal(
  answer: 'accepted' | 'alreadyStarted' = 'accepted',
  unreachableFor: readonly string[] = [],
) {
  const starts: Array<Record<string, unknown>> = [];
  const client = {
    workflow: {
      start: async (type: string, options: Record<string, unknown>) => {
        if (unreachableFor.includes(String(options.workflowId))) throw new Error('unreachable');
        starts.push(options);
        if (answer === 'alreadyStarted') {
          throw new WorkflowExecutionAlreadyStartedError(
            'already started',
            String(options.workflowId),
            type,
          );
        }
        return { workflowId: options.workflowId };
      },
      getHandle: (workflowId: string) => ({ workflowId }),
    },
  };
  const connection = { client: async () => client } as unknown as TemporalConnection;
  return {
    gateway: new TemporalGateway(connection),
    starts,
    startedIds: () => starts.map((options) => options.workflowId),
  };
}

const skip = skipWithoutDatabase(
  'OUTBOX HANDOFF PROOF',
  'That a handoff commits with its change, and starts one workflow, is UNPROVEN in this run.',
);

describe.skipIf(skip)('the orchestration outbox, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  const rowOf = async (eventId: string) => {
    const [row] = await pools.admin.db
      .select()
      .from(orchestrationOutbox)
      .where(eq(orchestrationOutbox.id, eventId));
    return row;
  };
  const dispatcherOver = (gateway: TemporalGateway) =>
    new OutboxDispatcher(gateway, new OutboxAdminRepository(pools.admin.db), silent());
  const record = (input: ReturnType<typeof anEvent>) =>
    pools.tenants.withTenantTransaction(company.tenantId, (tx) =>
      recordOutboxEvent(tx, company.tenantId, platformHealthcheckWorkflow, input),
    );

  beforeAll(async () => {
    pools = openPools();
    await seed(pools.admin.db, fixture);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, fixture);
    await pools.close();
  });

  it('leaves no event when the change that wrote it fails after the write', async () => {
    const event = anEvent();
    const failedChange = pools.tenants.withTenantTransaction(company.tenantId, async (tx) => {
      await recordOutboxEvent(tx, company.tenantId, platformHealthcheckWorkflow, event);
      throw new Error('the change failed after its event was written');
    });

    await expect(failedChange).rejects.toThrow('the change failed');
    expect(await rowOf(event.eventId)).toBeUndefined();
  });

  it('refuses an event whose input names another tenant than the transaction it is written in', async () => {
    const event = { eventId: uuidv7(), tenantId: elsewhere.tenantId };
    const written = pools.tenants.withTenantTransaction(company.tenantId, (tx) =>
      recordOutboxEvent(tx, company.tenantId, aTenantWorkflow, event),
    );

    await expect(written).rejects.toThrow('another tenant');
    expect(await rowOf(event.eventId)).toBeUndefined();
  });

  it('keeps the event, undispatched, when the change commits', async () => {
    const event = anEvent();
    await record(event);

    const row = await rowOf(event.eventId);
    expect(row).toMatchObject({
      tenantId: company.tenantId,
      workflow: platformHealthcheckWorkflow.name,
      payload: event,
      dispatchedAt: null,
    });
  });

  it('starts one workflow id when a dispatcher dies before its mark and retries', async () => {
    const event = anEvent();
    await record(event);
    const temporal = aRecordingTemporal();
    const dispatcher = dispatcherOver(temporal.gateway);

    await dispatcher.dispatchNow(event.eventId);
    // The process died after Temporal accepted the start: its mark never reached the row.
    await pools.admin.db
      .update(orchestrationOutbox)
      .set({ dispatchedAt: null })
      .where(eq(orchestrationOutbox.id, event.eventId));
    await dispatcher.dispatchNow(event.eventId);
    await dispatcher.dispatchNow(event.eventId);

    const workflowId = platformHealthcheckWorkflow.workflowId(event);
    expect(temporal.startedIds()).toEqual([workflowId, workflowId]);
    expect((await rowOf(event.eventId))?.dispatchedAt).toBeInstanceOf(Date);
  });

  it('sweeps an event the fast path missed, and leaves one still inside its grace', async () => {
    const missed = anEvent();
    const fresh = anEvent();
    await record(missed);
    await record(fresh);
    await pools.admin.db
      .update(orchestrationOutbox)
      .set({ createdAt: aMinuteAgo() })
      .where(eq(orchestrationOutbox.id, missed.eventId));
    const temporal = aRecordingTemporal();

    await dispatcherOver(temporal.gateway).dispatchDue();

    expect(temporal.startedIds()).toContain(platformHealthcheckWorkflow.workflowId(missed));
    expect(temporal.startedIds()).not.toContain(platformHealthcheckWorkflow.workflowId(fresh));
    expect((await rowOf(missed.eventId))?.dispatchedAt).toBeInstanceOf(Date);
    expect((await rowOf(fresh.eventId))?.dispatchedAt).toBeNull();
  });

  it('sweeps past an event that fails to start and one whose workflow this release lacks', async () => {
    const failing = anEvent();
    const after = anEvent();
    const unknown = { eventId: uuidv7(), tenantId: company.tenantId };
    await record(failing);
    await record(after);
    await pools.tenants.withTenantTransaction(company.tenantId, (tx) =>
      recordOutboxEvent(tx, company.tenantId, aTenantWorkflow, unknown),
    );
    await pools.admin.db
      .update(orchestrationOutbox)
      .set({ createdAt: aMinuteAgo() })
      .where(inArray(orchestrationOutbox.id, [failing.eventId, after.eventId, unknown.eventId]));
    const temporal = aRecordingTemporal('accepted', [
      platformHealthcheckWorkflow.workflowId(failing),
    ]);

    const dispatcher = dispatcherOver(temporal.gateway);
    const due = await dispatcher.dueEvents();
    await dispatcher.dispatchDue();

    expect(due.map((event) => event.id)).not.toContain(unknown.eventId);
    expect(temporal.startedIds()).toContain(platformHealthcheckWorkflow.workflowId(after));
    expect(temporal.startedIds()).not.toContain(aTenantWorkflow.workflowId(unknown));
    expect((await rowOf(failing.eventId))?.dispatchedAt).toBeNull();
    expect((await rowOf(unknown.eventId))?.dispatchedAt).toBeNull();
  });
});

describe('the gateway, when the event’s workflow already ran', () => {
  it('starts with USE_EXISTING and REJECT_DUPLICATE, and reads a finished run as started', async () => {
    const temporal = aRecordingTemporal('alreadyStarted');
    const event = anEvent();

    const handle = await temporal.gateway.start(platformHealthcheckWorkflow, event);

    expect(handle.workflowId).toBe(platformHealthcheckWorkflow.workflowId(event));
    expect(temporal.starts[0]).toMatchObject({
      workflowIdConflictPolicy: 'USE_EXISTING',
      workflowIdReusePolicy: 'REJECT_DUPLICATE',
    });
  });
});
