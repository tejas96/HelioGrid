import { lead, proposal, task } from '@heliogrid/db';
import { FOUNDER_ROLE, PROPOSAL_FOLLOW_UP_AFTER_MS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { answerOn, customersLink, linkAct } from '../customer-link/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDraft,
  aGenerated,
  aLead,
  aShared,
  aStaffedCompany,
  auditEntriesOf,
  detailOf,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
  refusalOf,
  share,
  storedEntriesOf,
} from './support';

/**
 * Sharing and withdrawing on the wire (`T-M06-018`, `T-M06-025`, `T-M06-030`, `T-M06-031`,
 * `M06-45`, `M06-53`, `M06-55`, `M06-58`): a share is a person's tap that moves the proposal and
 * its lead, raises the follow-up, and replaces an older proposal — and never claims a delivery.
 */

const here = aStaffedCompany('Proposal Share EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  seller: [preset.sales_executive],
  designer: [preset.design_engineer],
  pm: [preset.project_manager],
});
const there = aStaffedCompany('Proposal Share Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL SHARE PROOF',
  'Sharing, the follow-up and withdrawing are UNPROVEN on the wire in this run.',
);

const MINUTE_MS = 60_000;

describe.skipIf(skip)('Sharing a proposal, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const tenantId = () => here.company.tenantId;

  const stageOf = async (leadId: string) =>
    (
      await world.pools.admin.db
        .select({ stage: lead.stage, state: lead.lifecycleState })
        .from(lead)
        .where(eq(lead.id, leadId))
    )[0];
  const proposalTasks = (leadId: string) =>
    world.pools.admin.db
      .select()
      .from(task)
      .where(
        and(
          eq(task.leadId, leadId),
          inArray(task.provenance, ['proposal_shared', 'proposal_accepted', 'proposal_declined']),
        ),
      );
  const statusOf = async (proposalId: string) =>
    (
      await world.pools.admin.db
        .select({ status: proposal.status })
        .from(proposal)
        .where(eq(proposal.id, proposalId))
    )[0]?.status;

  beforeAll(async () => {
    world = await openProposalsWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    ['the EPC Owner', 'owner'],
    ['a Sales Manager', 'manager'],
  ] as const)('%s shares a generated proposal', async (_, who) => {
    const made = await aGenerated(owner(), await aLead(owner()));
    const reply = await share(world.as(here.members[who]), made.proposal.id);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.proposal).toMatchObject({ status: 'shared', standing: 'shared' });
  });

  it('a Sales Executive shares on a lead they own; a Design Engineer and a Project Manager may not share', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const made = await aGenerated(owner(), leadId);
    for (const who of ['designer', 'pm'] as const) {
      const refused = await share(world.as(here.members[who]), made.proposal.id);
      expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    }
    expect((await share(world.as(here.members.seller), made.proposal.id)).status).toBe(
      HttpStatus.OK,
    );
  });

  it("another company's proposal is not found", async () => {
    const made = await aGenerated(owner(), await aLead(owner()));
    const reply = await share(world.as(there.members.owner), made.proposal.id);
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
  });

  it.each(['share-message', 'acceptance-message'])(
    '/%s is refused to a Project Manager and a Design Engineer, and not found for another company',
    async (route) => {
      const { id } = await aShared(owner(), await aLead(owner()));
      const read = (who: 'pm' | 'designer') =>
        world.as(here.members[who]).call('GET', `/proposals/${id}/${route}`);
      expect([(await read('pm')).status, (await read('designer')).status]).toEqual([
        HttpStatus.FORBIDDEN,
        HttpStatus.FORBIDDEN,
      ]);
      const stranger = world.as(there.members.owner);
      expect((await stranger.call('GET', `/proposals/${id}/${route}`)).status).toBe(
        HttpStatus.NOT_FOUND,
      );
    },
  );

  it('sharing again a version the customer already accepted raises no follow-up to chase them (M06-55)', async () => {
    const leadId = await aLead(owner());
    const shared = await aShared(owner(), leadId);
    const { token } = await customersLink(owner(), leadId);
    const accepted = await linkAct(world, token, 'accept', await answerOn(world, token));
    expect(accepted.status).toBe(HttpStatus.OK);
    const again = await share(owner(), shared.id, 'copy_link');
    expect([again.status, again.body.followUpOn]).toEqual([HttpStatus.OK, null]);
    const chasing = (await proposalTasks(leadId)).filter(
      (one) => one.provenance === 'proposal_shared' && one.status === 'open',
    );
    expect(chasing).toEqual([]);
  });

  it('the first share moves the lead to proposal, raises the follow-up two days out and is on the record', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const made = await aGenerated(owner(), leadId);
    const before = Date.now();
    const reply = await share(owner(), made.proposal.id);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(await stageOf(leadId)).toMatchObject({ stage: 'proposal' });
    const tasks = await proposalTasks(leadId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      assigneeUserId: here.people.seller.userId,
      provenance: 'proposal_shared',
      status: 'open',
      kind: 'follow_up',
    });
    const due = tasks[0]?.dueAt.getTime() ?? 0;
    expect(due).toBeGreaterThanOrEqual(before + PROPOSAL_FOLLOW_UP_AFTER_MS - MINUTE_MS);
    expect(due).toBeLessThanOrEqual(Date.now() + PROPOSAL_FOLLOW_UP_AFTER_MS);
    expect(reply.body.proposal.followUp).toMatchObject({ provenance: 'proposal_shared' });
    expect(reply.body.followUpOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const kinds = (await storedEntriesOf(world, leadId)).map((entry) => entry.kind);
    expect(kinds).toContain('proposal_shared');
    const audited = await auditEntriesOf(world, tenantId(), 'proposals.proposal_shared');
    expect(audited.some((entry) => entry.subjectRef === made.proposal.id)).toBe(true);
    // The tracking states are the product's own: shared, and nothing that reads as delivered.
    expect(reply.body.proposal.tracking).toMatchObject({ firstOpenedAt: null, answer: null });
    expect(JSON.stringify(reply.body.proposal.tracking)).not.toMatch(/deliver/i);
  });

  it('a second share keeps one follow-up and moves its date', async () => {
    const leadId = await aLead(owner());
    const made = await aGenerated(owner(), leadId);
    await share(owner(), made.proposal.id);
    const [first] = await proposalTasks(leadId);
    await world.pools.admin.db
      .update(task)
      .set({ dueAt: new Date(0) })
      .where(eq(task.id, first?.id ?? ''));
    expect((await share(owner(), made.proposal.id, 'copy_link')).status).toBe(HttpStatus.OK);
    const after = await proposalTasks(leadId);
    expect(after).toHaveLength(1);
    expect(after[0]?.dueAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('a lead with no owner hands the follow-up to the EPC Owner', async () => {
    const leadId = await aLead(owner());
    await world.pools.admin.db.update(lead).set({ ownerUserId: null }).where(eq(lead.id, leadId));
    const made = await aGenerated(owner(), leadId);
    await share(world.as(here.members.manager), made.proposal.id);
    expect((await proposalTasks(leadId))[0]?.assigneeUserId).toBe(here.people.owner.userId);
  });

  it('the composed words name the company and the price, and claim no link before one exists', async () => {
    const made = await aGenerated(owner(), await aLead(owner()));
    const words = await owner().call<{
      text: string;
      link: string | null;
      language: string;
      chatUri: string | null;
    }>('GET', `/proposals/${made.proposal.id}/share-message`);
    expect(words.status).toBe(HttpStatus.OK);
    expect(words.body.text).toContain('Proposal Share EPC');
    // A headline amount leaves a zero fraction unsaid (`formatMinorUnitsPlainly`).
    expect(words.body.text).toContain('Price ₹1,90,575. ');
    expect(words.body.text).toContain('Anil Sharma');
    expect(words.body.text).toContain('3 kW');
    expect(words.body.link).toBeNull();
    expect(words.body.text).toContain('{link}');
    expect(words.body.chatUri).toContain('https://wa.me/');
  });

  it('a draft with no version has nothing to share', async () => {
    const draft = await aDraft(owner(), await aLead(owner()));
    const reply = await share(owner(), draft.id);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('not_generated');
  });

  it('a newer proposal supersedes the older one when it is SHARED, not when it is generated', async () => {
    const leadId = await aLead(owner());
    const older = await aShared(owner(), leadId);
    const newer = await aGenerated(owner(), leadId);
    expect(newer.proposal.id).not.toBe(older.id);
    expect(await statusOf(older.id)).toBe('shared');
    expect((await share(owner(), newer.proposal.id)).status).toBe(HttpStatus.OK);
    expect(await statusOf(older.id)).toBe('superseded');
    expect((await detailOf(owner(), older.id)).body.standing).toBe('replaced');
  });

  it('two live proposals on one lead are both shown, each to withdraw; withdrawing one closes nothing else', async () => {
    const leadId = await aLead(owner());
    const one = await aGenerated(owner(), leadId);
    const two = await aGenerated(owner(), leadId);
    const detail = await owner().call<{
      proposals: { items: { id: string; live: boolean }[]; canWithdraw: boolean };
    }>('GET', `/leads/${leadId}`);
    expect(detail.body.proposals.canWithdraw).toBe(true);
    expect(
      detail.body.proposals.items
        .filter((item) => item.live)
        .map((item) => item.id)
        .sort(),
    ).toEqual([one.proposal.id, two.proposal.id].sort());
    const withdrawn = await owner().call<{ status: string; standing: string }>(
      'POST',
      `/proposals/${one.proposal.id}/withdraw`,
      { capturedAt: new Date().toISOString() },
    );
    expect(withdrawn.status).toBe(HttpStatus.OK);
    expect(withdrawn.body).toMatchObject({ status: 'withdrawn', standing: 'withdrawn' });
    expect(await statusOf(two.proposal.id)).toBe('draft');
    const again = await owner().call('POST', `/proposals/${one.proposal.id}/withdraw`, {
      capturedAt: new Date().toISOString(),
    });
    expect(refusalOf(again)).toBe('not_active');
    const kinds = (await storedEntriesOf(world, leadId)).map((entry) => entry.kind);
    expect(kinds).toContain('proposal_withdrawn');
  });

  it('withdrawing the shared proposal closes its follow-up', async () => {
    const leadId = await aLead(owner());
    const shared = await aShared(owner(), leadId);
    await owner().call('POST', `/proposals/${shared.id}/withdraw`, {
      capturedAt: new Date().toISOString(),
    });
    expect((await proposalTasks(leadId)).map((one) => one.status)).toEqual(['cancelled']);
  });

  it('marking the lead lost withdraws its shared proposal, and a share is then refused', async () => {
    const leadId = await aLead(owner());
    const shared = await aShared(owner(), leadId);
    const lost = await owner().call('POST', `/leads/${leadId}/lost`, {
      reason: 'price',
      capturedAt: new Date().toISOString(),
    });
    expect(lost.status).toBe(HttpStatus.OK);
    expect(await statusOf(shared.id)).toBe('withdrawn');
    const reply = await share(owner(), shared.id);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('lead_closed');
  });

  it('a share on a dormant lead wakes it', async () => {
    const leadId = await aLead(owner());
    const made = await aGenerated(owner(), leadId);
    await world.pools.admin.db
      .update(lead)
      .set({ lifecycleState: 'dormant' })
      .where(eq(lead.id, leadId));
    expect((await share(owner(), made.proposal.id)).status).toBe(HttpStatus.OK);
    expect(await stageOf(leadId)).toMatchObject({ stage: 'proposal', state: null });
  });

  it('the thank-you message waits for an Accept', async () => {
    const shared = await aShared(owner(), await aLead(owner()));
    const reply = await owner().call('GET', `/proposals/${shared.id}/acceptance-message`);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
