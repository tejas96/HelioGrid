import type { LeadDetail } from '@heliogrid/contracts';
import { customer, lead, task } from '@heliogrid/db';
import { FOUNDER_ROLE, leadScopeOf, MERGE_WRITE_SET, MONEY_TABLES } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mergeCustomers } from '../../src/modules/crm/crm.merge.repository';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aPair,
  everyPick,
  furnishLoser,
  leadsHoldingFurnished,
  mergeOf,
  previewOf,
  streamOf,
} from './merge-support';
import {
  aStaffedCompany,
  auditEntriesOf,
  type CrmWorld,
  leadsOf,
  openCrmWorld,
  ownLead,
  preset,
} from './support';

/**
 * Customer merge (`M02-59`…`M02-63`, RFC decision 17): one transaction re-points everything naming
 * the loser and leaves it a tombstone; both customers must be in the person's scope; the timeline
 * and the audit log carry every choice; and the transaction writes no money table.
 */

const here = aStaffedCompany('Merge EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  rep: [preset.sales_executive],
});
const elsewhere = aStaffedCompany('Other Merge EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'MERGE PROOF',
  'Customer merge is UNPROVEN on the wire in this run.',
);

/** Each side the pair's three differing fields were taken from, as both records name them. */
const CHOICES = [
  { field: 'name', kept: 'survivor' },
  { field: 'city', kept: 'loser' },
  { field: 'primary_contact', kept: 'loser' },
];
/** The test's clock and the database's differ by the time a request takes. */
const CLOCK_SLACK_MS = 1000;

describe.skipIf(skip)('customer merge, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const manager = () => world.as(here.members.manager);
  const tenantId = here.company.tenantId;

  beforeAll(async () => {
    world = await openCrmWorld([here, elsewhere]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('after a merge the survivor holds every contact, lead, activity, referral, booking, task and file', async () => {
    const { survivor, loser } = await aPair(owner());
    const loserId = loser.customer.id;
    const by = { tenantId, userId: here.people.owner.userId };
    const furnished = await furnishLoser(world, owner(), loser, by);
    const loserStream = (await streamOf(owner(), loserId)).map((entry) => entry.id);

    const compared = await previewOf(owner(), survivor.customer.id, loserId);
    expect(compared.body).toMatchObject({
      blocked: null,
      differences: [
        { field: 'name', survivor: 'Priya Sharma', loser: 'Priya S.' },
        { field: 'city', survivor: 'Nashik', loser: 'Nasik' },
        { field: 'primary_contact', survivor: null, loser: 'Rakesh Sharma' },
      ],
      moves: { contacts: 1, leads: 1, referrals: 1, visits: 1, files: 1 },
    });
    expect(compared.body.moves?.activities).toBe(loserStream.length);
    // The capture's own call-back task rides the loser's lead beside the furnished one.
    const loserTasks = await world.pools.admin.db
      .select({ id: task.id })
      .from(task)
      .where(eq(task.leadId, loser.lead.id));
    expect(loserTasks.map((one) => one.id)).toContain(furnished.taskId);
    expect(compared.body.moves?.tasks).toBe(loserTasks.length);

    const unpicked = await mergeOf(owner(), survivor.customer.id, loserId, { name: 'survivor' });
    expect(unpicked.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(unpicked.body.error).toMatchObject({
      code: 'MERGE_CHOICES_MISSING',
      facts: { unpicked: ['city', 'primary_contact'] },
    });

    const merged = await mergeOf(owner(), survivor.customer.id, loserId);
    expect(merged.status).toBe(HttpStatus.OK);
    expect(merged.body.survivor).toMatchObject({
      id: survivor.customer.id,
      name: 'Priya Sharma',
      city: 'Nasik',
      primaryContactId: furnished.husband.id,
      referred: [{ leadId: furnished.referred.lead.id, name: 'Ashok Patil' }],
    });
    expect(merged.body.survivor.contacts.map((one) => [one.name, one.phoneE164])).toEqual([
      ['Rakesh Sharma', furnished.husband.phoneE164],
      ['Priya S.', loser.customer.phoneE164],
    ]);
    const leadIds = (await leadsOf(world, survivor.customer.id)).map((one) => one.id);
    expect(leadIds.sort()).toEqual([survivor.lead.id, loser.lead.id].sort());
    const survivorStream = (await streamOf(owner(), survivor.customer.id)).map((entry) => entry.id);
    expect(survivorStream).toEqual(expect.arrayContaining(loserStream));
    for (const leadId of await leadsHoldingFurnished(world, furnished)) {
      expect(leadIds).toContain(leadId);
    }
    const [tombstone] = await world.pools.admin.db
      .select()
      .from(customer)
      .where(eq(customer.id, loserId));
    expect(tombstone).toMatchObject({ mergedInto: survivor.customer.id, mergedBy: by.userId });
    const match = await owner().call<{ match: { customerId?: string } }>(
      'GET',
      `/customers/match?phone=${encodeURIComponent(loser.customer.phoneE164)}`,
    );
    expect(match.body.match).toMatchObject({ customerId: survivor.customer.id });
  });

  it("a merge with a record outside the actor's scope is unavailable with its reason", async () => {
    const { survivor, loser } = await aPair(owner());
    const pair = [survivor.customer.id, loser.customer.id] as const;
    await ownLead(world, loser.lead.id, here.people.rep.userId);

    expect((await previewOf(manager(), ...pair)).body).toEqual({
      blocked: 'out_of_scope',
      heldBy: here.people.rep.name,
      survivor: null,
      loser: null,
      differences: [],
      moves: null,
    });
    const refused = await mergeOf(manager(), ...pair);
    expect([refused.status, refused.body.error.code]).toEqual([
      HttpStatus.CONFLICT,
      'MERGE_OUT_OF_SCOPE',
    ]);
    const [untouched] = await world.pools.admin.db
      .select({ mergedInto: customer.mergedInto })
      .from(customer)
      .where(eq(customer.id, loser.customer.id));
    expect(untouched?.mergedInto).toBeNull();

    const rep = world.as(here.members.rep);
    const stranger = world.as(elsewhere.members.owner);
    expect([
      (await previewOf(rep, ...pair)).status,
      (await mergeOf(rep, ...pair)).status,
      (await previewOf(stranger, ...pair)).status,
      (await mergeOf(stranger, ...pair)).status,
    ]).toEqual([
      HttpStatus.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
      HttpStatus.NOT_FOUND,
    ]);

    expect((await mergeOf(owner(), ...pair)).status).toBe(HttpStatus.OK);
    expect((await previewOf(owner(), ...pair)).body.blocked).toBe('already_merged');
    const again = await mergeOf(owner(), ...pair);
    expect([again.status, again.body.error.code]).toEqual([
      HttpStatus.CONFLICT,
      'CUSTOMER_ALREADY_MERGED',
    ]);
  });

  it('the timeline and the audit log record what merged, by whom, when and each choice', async () => {
    const { survivor, loser } = await aPair(owner());
    const before = Date.now() - CLOCK_SLACK_MS;
    const merged = await mergeOf(manager(), survivor.customer.id, loser.customer.id);
    expect(merged.status).toBe(HttpStatus.OK);

    const [entry] = (await streamOf(owner(), survivor.customer.id)).filter(
      (one) => one.kind === 'customer_merged',
    );
    expect(entry).toMatchObject({
      actor: { kind: 'person', id: here.people.manager.userId },
      body: { survivorId: survivor.customer.id, mergedId: loser.customer.id, choices: CHOICES },
    });
    expect(Date.parse(entry?.appliedAt ?? '')).toBeGreaterThanOrEqual(before);

    const audited = (await auditEntriesOf(world, tenantId, 'crm.customers_merged')).filter(
      (one) => one.subjectRef === survivor.customer.id,
    );
    expect(audited).toMatchObject([
      {
        actorRef: here.people.manager.userId,
        subjectKind: 'customer',
        changePayload: { mergedId: loser.customer.id, choices: CHOICES },
      },
    ]);
    expect(audited[0]?.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
    const log = await owner().call<{ items: { subjectRef: string; changePayload: unknown }[] }>(
      'GET',
      '/tenants/me/audit-log?limit=100',
    );
    expect(log.body.items.find((one) => one.subjectRef === survivor.customer.id)).toMatchObject({
      changePayload: { mergedId: loser.customer.id, choices: CHOICES },
    });
  });

  it('a merge changes no monthly bill and writes no money table', async () => {
    const { survivor, loser } = await aPair(owner());
    const bills = [
      [survivor.lead.id, '2500'],
      [loser.lead.id, '4200.50'],
    ] as const;
    for (const [leadId, monthlyBill] of bills) {
      const capturedAt = new Date().toISOString();
      await owner().call('PATCH', `/leads/${leadId}`, { monthlyBill, capturedAt });
    }
    const billsOf = () =>
      Promise.all(
        bills.map(async ([leadId]) => {
          const read = await owner().call<LeadDetail>('GET', `/leads/${leadId}`);
          return read.body.lead.monthlyBill;
        }),
      );
    const billsBefore = await billsOf();
    expect(billsBefore.map((bill) => bill?.amount)).toEqual(['2500.00', '4200.50']);

    const roles = [preset.epc_owner];
    const actorId = here.people.owner.userId;
    const reader = { tenantId, actorId, roles, scope: leadScopeOf(roles) };
    const input = {
      survivorId: survivor.customer.id,
      loserId: loser.customer.id,
      picks: everyPick,
      capturedAt: new Date().toISOString(),
    };
    // The transaction's own row counts per table: what this merge wrote, and nothing another did.
    const { outcome, written } = await world.pools.tenants.withTenantTransaction(
      tenantId,
      async (tx) => ({
        outcome: await mergeCustomers(tx, reader, input, { actorUserId: actorId, now: Date.now() }),
        written: await tx.execute<{ relname: string }>(
          sql`select relname from pg_stat_xact_user_tables where n_tup_ins + n_tup_upd + n_tup_del > 0`,
        ),
      }),
    );
    expect(outcome.kind).toBe('merged');
    const tables = written.map((row) => row.relname);
    expect(tables).toEqual(
      expect.arrayContaining(['customer', 'contact', 'lead', 'activity', 'audit_log_entry']),
    );
    const writeSet: readonly string[] = MERGE_WRITE_SET;
    expect(tables.filter((table) => !writeSet.includes(table))).toEqual([]);
    const moneyTables: readonly string[] = MONEY_TABLES;
    const unknown = await world.pools.admin.db.execute<{ name: string }>(
      sql`select name from unnest(${`{${MONEY_TABLES.join(',')}}`}::text[]) name where to_regclass(name) is null`,
    );
    expect(unknown.map((row) => row.name)).toEqual([]);
    expect(tables.filter((table) => moneyTables.includes(table))).toEqual([]);

    expect(await billsOf()).toEqual(billsBefore);
    const moved = await world.pools.admin.db
      .select({ customerId: lead.customerId })
      .from(lead)
      .where(inArray(lead.id, [survivor.lead.id, loser.lead.id]));
    expect(moved).toEqual([
      { customerId: survivor.customer.id },
      { customerId: survivor.customer.id },
    ]);
  });
});
