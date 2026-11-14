import { entitlement, proposalVersion, tenantCounter } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  aDraft,
  aGenerated,
  aLead,
  aReadyDraft,
  aStaffedCompany,
  auditEntriesOf,
  detailOf,
  edited,
  generate,
  openProposalsWorld,
  type ProposalsWorld,
  preset,
  retryKey,
  storedEntriesOf,
  systemOf,
} from './support';

/**
 * Generate on the wire (`T-M06-022`, `T-M06-025`, `T-M06-028`, `M06-20`, `M06-23`, `M06-36`,
 * `M06-37`, `M06-42`, `M06-44`): the one checklist, the same whichever way the person got there;
 * a version frozen whole; a number from the company's counter that two people cannot both take.
 */

const here = aStaffedCompany('Proposal Generate EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});
const capped = aStaffedCompany('Proposal Capped EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL GENERATE PROOF',
  'The Generate gate, its versions and its numbers are UNPROVEN on the wire in this run.',
);

interface NotReady {
  error: {
    code: string;
    facts: {
      verdict: {
        blocks: Record<string, unknown>[];
        warnings: Record<string, unknown>[];
        skipped: Record<string, unknown>[];
        canGenerate: boolean;
      };
    };
  };
}
/** The ready draft's size (`aReadyDraft`). */
const SYSTEM_KW = 3;
const verdictOf = (body: unknown) => (body as NotReady).error.facts.verdict;
const sequenceOf = (number: string) => Number(number.replace(/^PRP-/, ''));

describe.skipIf(skip)('Generate, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const tenantId = () => here.company.tenantId;

  beforeAll(async () => {
    world = await openProposalsWorld([here, capped]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a draft with several failures is refused with every one as a list, each naming its step', async () => {
    const draft = await aDraft(owner(), await aLead(owner()));
    const reply = await generate(owner(), draft);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body).toMatchObject({ error: { code: 'PROPOSAL_NOT_READY' } });
    const { blocks, canGenerate } = verdictOf(reply.body);
    expect(canGenerate).toBe(false);
    const missing = blocks.filter((block) => block.check === 'component_missing');
    expect(missing.map((block) => block.category).sort()).toEqual([
      'cable',
      'electrical',
      'inverter',
      'panel',
      'structure',
    ]);
    expect(missing.every((block) => block.step === 'components')).toBe(true);
    expect(blocks.some((block) => block.check === 'field_missing' && block.step === 'system')).toBe(
      true,
    );
  });

  it('a ready draft generates version 1 with the number PRP-…, and its lead says so', async () => {
    const leadId = await aLead(owner());
    const ready = await aReadyDraft(owner(), leadId);
    expect(ready.checklist.canGenerate).toBe(true);
    const reply = await generate(owner(), ready);
    expect(reply.status).toBe(HttpStatus.CREATED);
    expect(reply.body.number).toMatch(/^PRP-\d{4,}$/);
    expect(reply.body.version).toBe(1);
    expect(reply.body.proposal).toMatchObject({ status: 'draft', standing: 'ready' });
    expect(reply.body.proposal.document.number).toBe(reply.body.number);
    expect(reply.body.proposal.versions).toMatchObject([
      { version: 1, trigger: 'first_generate', payable: '190575.00', changeNote: null },
    ]);
    const kinds = (await storedEntriesOf(world, leadId)).map((entry) => entry.kind);
    expect(kinds).toContain('proposal_generated');
    const lead = await owner().call<{
      proposals: { items: object[] };
      sections: { proposals: number };
    }>('GET', `/leads/${leadId}`);
    expect(lead.body.sections.proposals).toBe(1);
    expect(lead.body.proposals.items).toMatchObject([
      { number: reply.body.number, version: 1, standing: 'ready' },
    ]);
  });

  it('Generate and each version are audited with who and the amount', async () => {
    const made = await aGenerated(owner(), await aLead(owner()));
    const generated = await auditEntriesOf(world, tenantId(), 'proposals.proposal_generated');
    const mine = generated.find((entry) => entry.subjectRef === made.proposal.id);
    expect(mine).toMatchObject({
      actorRef: here.people.owner.userId,
      changePayload: { version: 1, amount: '190575.00', currencyCode: 'INR' },
    });
    const versions = await auditEntriesOf(world, tenantId(), 'proposals.version_created');
    expect(versions.some((entry) => entry.actorRef === here.people.owner.userId)).toBe(true);
  });

  it('a discount is audited with its amount', async () => {
    const draft = await aReadyDraft(owner(), await aLead(owner()));
    await edited(owner(), draft, {
      fields: { system: systemOf(draft, { discount: { mode: 'amount', amount: '5000.00' } }) },
    });
    const entries = await auditEntriesOf(world, tenantId(), 'proposals.discount_applied');
    expect(entries.find((entry) => entry.subjectRef === draft.id)).toMatchObject({
      changePayload: { amount: '5000.00', currencyCode: 'INR' },
    });
  });

  it('Generate sent twice with one key makes one version and one number', async () => {
    const ready = await aReadyDraft(owner(), await aLead(owner()));
    const key = retryKey();
    const body = {
      revision: ready.revision,
      changeNote: null,
      belowCostConfirmed: false,
      capturedAt: new Date().toISOString(),
    };
    const send = () =>
      owner().call<{ number: string; version: number }>(
        'POST',
        `/proposals/${ready.id}/generate`,
        body,
        key,
      );
    const [first, second] = [await send(), await send()];
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body).toMatchObject({ number: first.body.number, version: 1 });
    const stored = await world.pools.admin.db
      .select({ id: proposalVersion.id })
      .from(proposalVersion)
      .where(eq(proposalVersion.proposalId, ready.id));
    expect(stored).toHaveLength(1);
  });

  it('two people generating at once take two different numbers', async () => {
    const [one, two] = [
      await aReadyDraft(owner(), await aLead(owner())),
      await aReadyDraft(owner(), await aLead(owner())),
    ];
    await world.pools.admin.db
      .insert(tenantCounter)
      .values({ tenantId: tenantId(), kind: 'proposal', lastNumber: 0 })
      .onConflictDoNothing();
    const held = await holdLock(
      sql`select 1 from tenant_counter where tenant_id = ${tenantId()} and kind = 'proposal' for update`,
    );
    const both = [generate(owner(), one), generate(owner(), two)];
    await held.waitForWaiters(2);
    await held.release();
    const replies = await Promise.all(both);
    expect(replies.map((reply) => reply.status)).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    const numbers = replies.map((reply) => sequenceOf(reply.body.number));
    expect(new Set(numbers).size).toBe(2);
  });

  it('a second version needs its change note, keeps the number, and leaves version 1 byte for byte', async () => {
    const made = await aGenerated(owner(), await aLead(owner()));
    const before = await world.pools.admin.db
      .select({ snapshot: proposalVersion.snapshot })
      .from(proposalVersion)
      .where(and(eq(proposalVersion.proposalId, made.proposal.id), eq(proposalVersion.version, 1)));
    expect(before[0]?.snapshot.version).toBe(1);
    const bigger = await edited(owner(), made.proposal, {
      fields: {
        system: systemOf(made.proposal, { capacityKw: 5, priceInclusive: '300000.00' }),
      },
    });
    const noNote = await generate(owner(), bigger);
    expect(noNote.status).toBe(HttpStatus.BAD_REQUEST);
    const second = await generate(owner(), bigger, { changeNote: 'Anil asked for 5 kW.' });
    expect(second.status).toBe(HttpStatus.CREATED);
    expect(second.body).toMatchObject({ number: made.number, version: 2 });
    const after = await world.pools.admin.db
      .select({ snapshot: proposalVersion.snapshot })
      .from(proposalVersion)
      .where(and(eq(proposalVersion.proposalId, made.proposal.id), eq(proposalVersion.version, 1)));
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
    const read = await owner().call<{
      diff: { changes: { fact: string }[] };
      changeNote: string;
      document: { fields: { system: { capacityKw: number } } };
    }>('GET', `/proposals/${made.proposal.id}/versions/2`);
    expect(read.status).toBe(HttpStatus.OK);
    expect(read.body.changeNote).toBe('Anil asked for 5 kW.');
    expect(read.body.diff.changes.map((change) => change.fact)).toEqual(
      expect.arrayContaining(['capacity', 'payable']),
    );
    const first = await owner().call<{
      document: {
        fields: { system: { capacityKw: number } };
        money: { payable: { amount: string } };
      };
      diff: null;
    }>('GET', `/proposals/${made.proposal.id}/versions/1`);
    expect(first.body.document.fields.system.capacityKw).toBe(SYSTEM_KW);
    expect(first.body.document.money.payable.amount).toBe('190575.00');
    expect(first.body.diff).toBeNull();
  });

  it('a version never hands out our cost, whoever reads it', async () => {
    const ready = await aReadyDraft(owner(), await aLead(owner()));
    const costed = await edited(owner(), ready, {
      fields: { system: systemOf(ready, { ourCost: '150000.00' }) },
    });
    const made = await generate(owner(), costed);
    expect(made.status).toBe(HttpStatus.CREATED);
    const read = await owner().call<{ document: { fields: { system: object }; money: object } }>(
      'GET',
      `/proposals/${costed.id}/versions/1`,
    );
    expect(read.body.document.fields.system).not.toHaveProperty('ourCost');
    expect(read.body.document.money).not.toHaveProperty('margin');
  });

  it('a draft never generated can be discarded; a generated proposal cannot', async () => {
    const draft = await aDraft(owner(), await aLead(owner()));
    const gone = await owner().call('POST', `/proposals/${draft.id}/discard`, {
      capturedAt: new Date().toISOString(),
    });
    expect(gone.status).toBe(HttpStatus.NO_CONTENT);
    expect((await detailOf(owner(), draft.id)).status).toBe(HttpStatus.NOT_FOUND);
    const made = await aGenerated(owner(), await aLead(owner()));
    const kept = await owner().call('POST', `/proposals/${made.proposal.id}/discard`, {
      capturedAt: new Date().toISOString(),
    });
    expect(kept.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('at the plan’s limit a new proposal cannot be generated, while editing an existing one goes on', async () => {
    const boss = world.as(capped.members.owner);
    const existing = await aGenerated(boss, await aLead(boss));
    await world.pools.admin.db
      .insert(entitlement)
      .values({
        tenantId: capped.company.tenantId,
        entitlementKey: 'proposals_per_cycle',
        limitKind: 'count',
        limitValue: 1,
        source: 'plan',
        recomputedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [entitlement.tenantId, entitlement.entitlementKey],
        set: { limitValue: 1, limitKind: 'count' },
      });
    const next = await aReadyDraft(boss, await aLead(boss));
    const refused = await generate(boss, next);
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    expect(refused.body).toMatchObject({
      error: {
        code: 'ENTITLEMENT_BLOCKED',
        /* "1 of 1" (`T-M06-028`): the count rides the refusal, for a reader with no billing right too. */
        blocked: {
          reason: 'cap',
          capability: 'sell_and_deliver',
          key: 'proposals_per_cycle',
          used: 1,
          limit: 1,
        },
      },
    });
    // The draft stays saved, and the proposal already counted makes a new version freely.
    expect((await detailOf(boss, next.id)).status).toBe(HttpStatus.OK);
    const changed = await edited(boss, existing.proposal, {
      fields: { system: systemOf(existing.proposal, { capacityKw: 4 }) },
    });
    const second = await generate(boss, changed, { changeNote: 'A bigger roof.' });
    expect(second.status).toBe(HttpStatus.CREATED);
  });
});
