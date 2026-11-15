import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aCapture, aPhone, captured } from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDraft,
  aLead,
  aStaffedCompany,
  detailOf,
  edit,
  edited,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
  refusalOf,
  retryKey,
  start,
  storedEntriesOf,
  systemOf,
} from './support';

/**
 * The proposal record on the wire (`T-M06-032`, `T-M06-023`, `T-M06-001`): who may start and edit
 * one, that it is visible exactly where its lead is, that a lead holds one open draft, and that a
 * commit is taken on the revision it was typed on — never merged.
 */

const here = aStaffedCompany('Proposal Record EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  seller: [preset.sales_executive],
  other: [preset.sales_executive],
  designer: [preset.design_engineer],
  pm: [preset.project_manager],
  accounts: [preset.finance],
});
const there = aStaffedCompany('Proposal Record Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL RECORD PROOF',
  'Who may start, read and edit a proposal is UNPROVEN on the wire in this run.',
);

const at = () => new Date().toISOString();

/** Every act on a proposal beside its edit, each with a body its route takes. */
const buildActs = (on: { readonly id: string; readonly revision: number }) =>
  [
    [`/proposals/${on.id}/energy`, { revision: on.revision, mode: 'fill', capturedAt: at() }],
    [`/proposals/${on.id}/reset`, { revision: on.revision, step: 'timeline', capturedAt: at() }],
    [`/proposals/${on.id}/discard`, { capturedAt: at() }],
    [
      `/proposals/${on.id}/generate`,
      { revision: on.revision, changeNote: null, belowCostConfirmed: false, capturedAt: at() },
    ],
    [`/proposals/${on.id}/withdraw`, { capturedAt: at() }],
  ] as const;

describe.skipIf(skip)('The proposal record, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const seller = () => world.as(here.members.seller);

  beforeAll(async () => {
    world = await openProposalsWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    ['the EPC Owner', 'owner'],
    ['a Sales Manager', 'manager'],
  ] as const)('%s starts a proposal on any lead of the company', async (_, who) => {
    const leadId = await aLead(owner());
    const reply = await start(world.as(here.members[who]), leadId);
    expect(reply.status).toBe(HttpStatus.CREATED);
    expect(reply.body).toMatchObject({ status: 'draft', standing: 'draft', revision: 0 });
    expect(reply.body.lead.id).toBe(leadId);
    expect(reply.body.document.number).toBeNull();
  });

  it('a Sales Executive starts one on a lead they own, and reads none on a lead they do not', async () => {
    const mine = await aLead(owner());
    const theirs = await aLead(owner());
    await ownLead(world, mine, here.people.seller.userId);
    await ownLead(world, theirs, here.people.other.userId);
    expect((await start(seller(), mine)).status).toBe(HttpStatus.CREATED);
    expect((await start(seller(), theirs)).status).toBe(HttpStatus.NOT_FOUND);
    const hidden = await aDraft(world.as(here.members.other), theirs);
    expect((await detailOf(seller(), hidden.id)).status).toBe(HttpStatus.NOT_FOUND);
    const listed = await seller().call<{ rows: { items: { id: string }[] } }>('GET', '/proposals');
    expect(listed.body.rows.items.map((row) => row.id)).not.toContain(hidden.id);
  });

  it.each([
    ['a Project Manager', 'pm'],
    ['Finance', 'accounts'],
  ] as const)(
    '%s may not start, edit, fill, reset, discard, generate or withdraw a proposal',
    async (_, who) => {
      const leadId = await aLead(owner());
      const draft = await aDraft(owner(), leadId);
      const caller = world.as(here.members[who]);
      expect((await start(caller, await aLead(owner()))).status).toBe(HttpStatus.FORBIDDEN);
      expect((await edit(caller, draft, { quickMode: true })).status).toBe(HttpStatus.FORBIDDEN);
      for (const [path, body] of buildActs(draft)) {
        expect([path, (await caller.call('POST', path, body, retryKey())).status]).toEqual([
          path,
          HttpStatus.FORBIDDEN,
        ]);
      }
    },
  );

  it("another company's lead and proposal are not found", async () => {
    const leadId = await aLead(owner());
    const draft = await aDraft(owner(), leadId);
    const stranger = world.as(there.members.owner);
    expect((await start(stranger, leadId)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await detailOf(stranger, draft.id)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await edit(stranger, draft, { quickMode: true })).status).toBe(HttpStatus.NOT_FOUND);
    for (const [path, body] of buildActs(draft)) {
      expect([path, (await stranger.call('POST', path, body, retryKey())).status]).toEqual([
        path,
        HttpStatus.NOT_FOUND,
      ]);
    }
    expect((await detailOf(owner(), draft.id)).body.revision).toBe(draft.revision);
  });

  it('a lead holds one open draft: Create proposal opens it again, and a retry makes no second', async () => {
    const leadId = await aLead(owner());
    const key = retryKey();
    const body = { quickMode: false, copyOf: null, capturedAt: new Date().toISOString() };
    const send = () =>
      owner().call<{ id: string }>('POST', `/leads/${leadId}/proposals`, body, key);
    const first = await send();
    const retried = await send();
    const again = await start(owner(), leadId);
    expect([first.status, retried.status, again.status]).toEqual([
      HttpStatus.CREATED,
      HttpStatus.CREATED,
      HttpStatus.OK,
    ]);
    expect(new Set([first.body.id, retried.body.id, again.body.id]).size).toBe(1);
  });

  it.each([true, false])(
    'a copy for a lead keeps its source’s Quick flag (%s), whatever the client sends (T-M06-001)',
    async (quick) => {
      const source = await aDraft(owner(), await aLead(owner()), quick);
      const copy = await start(owner(), await aLead(owner()), {
        quickMode: !quick,
        copyOf: source.id,
      });
      expect(copy.status).toBe(HttpStatus.CREATED);
      expect(copy.body.quickMode).toBe(quick);
      expect(copy.body.id).not.toBe(source.id);
    },
  );

  it('a lead marked lost refuses a new proposal with "reopen the lead"', async () => {
    const leadId = await aLead(owner());
    const lost = await owner().call('POST', `/leads/${leadId}/lost`, {
      reason: 'price',
      capturedAt: new Date().toISOString(),
    });
    expect(lost.status).toBe(HttpStatus.OK);
    const reply = await start(owner(), leadId);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('lead_closed');
  });

  it('a commit on a stale revision is refused, and nothing is overwritten', async () => {
    const draft = await aDraft(owner(), await aLead(owner()));
    const phone = await edited(owner(), draft, { quickMode: true });
    const desk = await edit(owner(), draft, { fields: { system: systemOf(draft) } });
    expect(desk.status).toBe(HttpStatus.CONFLICT);
    expect(desk.body).toMatchObject({
      error: { code: 'PROPOSAL_CHANGED_ELSEWHERE', facts: { revision: phone.revision } },
    });
    const stored = (await detailOf(owner(), draft.id)).body;
    expect(stored.document.fields.system.priceInclusive).toBeNull();
    expect(stored.quickMode).toBe(true);
  });

  it('a lead that moved away answers who holds it now, and the draft stays with the lead', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const draft = await aDraft(seller(), leadId);
    await ownLead(world, leadId, here.people.other.userId);
    const reply = await edit(seller(), draft, { quickMode: true });
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body).toMatchObject({
      error: {
        code: 'PROPOSAL_LEAD_MOVED',
        facts: { movedTo: { userId: here.people.other.userId } },
      },
    });
    const theirs = await detailOf(world.as(here.members.other), draft.id);
    expect(theirs.status).toBe(HttpStatus.OK);
  });

  it('a site fact typed at a step is saved on the lead, with a timeline entry each', async () => {
    const leadId = await aLead(owner());
    const draft = await aDraft(owner(), leadId);
    const saved = await edited(owner(), draft, {
      deal: { siteAddress: '4 Karve Road', sanctionedLoadKw: 5, supplyPhase: 'single' },
    });
    expect(saved.document.deal).toMatchObject({
      siteAddress: '4 Karve Road',
      sanctionedLoadKw: 5,
      supplyPhase: 'single',
    });
    const lead = await owner().call<{ site: object }>('GET', `/leads/${leadId}`);
    expect(lead.body.site).toMatchObject({ address: '4 Karve Road', sanctionedLoadKw: 5 });
    const changed = (await storedEntriesOf(world, leadId))
      .filter((entry) => entry.kind === 'field_change')
      .map((entry) => (entry.body as { field: string }).field);
    expect(changed.sort()).toEqual(['sanctionedLoadKw', 'siteAddress', 'supplyPhase']);
  });

  it('New proposal’s capture makes the lead its maker’s, so a Sales Executive starts on it at once', async () => {
    const made = await captured(seller(), { ...aCapture(aPhone()), ownedByCapturer: true });
    expect(made.lead.owner?.userId).toBe(here.people.seller.userId);
    const reply = await start(seller(), made.lead.id, { quickMode: true, copyOf: null });
    expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(reply.status);
    const plain = await captured(seller(), aCapture(aPhone()));
    expect(plain.lead.owner).toBeNull();
  });

  it('step 5’s monthly bill is saved on the lead, and one finer than a paisa is refused', async () => {
    const leadId = await aLead(owner());
    const draft = await aDraft(owner(), leadId);
    const saved = await edited(owner(), draft, { deal: { monthlyBill: '4200' } });
    expect(saved.document.deal.monthlyBill).toBe('4200.00');
    const lead = await owner().call<{ lead: { monthlyBill: { amount: string } } }>(
      'GET',
      `/leads/${leadId}`,
    );
    expect(lead.body.lead.monthlyBill.amount).toBe('4200.00');
    const finer = await edit(owner(), saved, { deal: { monthlyBill: '4200.005' } });
    expect(finer.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('the read carries the customer’s number for step 10’s locked client card', async () => {
    const leadId = await aLead(owner());
    const draft = await aDraft(owner(), leadId);
    const lead = await owner().call<{ lead: { phoneE164: string } }>('GET', `/leads/${leadId}`);
    expect(draft.lead.customerPhoneE164).toBe(lead.body.lead.phoneE164);
    expect(draft.lead.customerPhoneE164).toMatch(/^\+91\d{10}$/);
    // A company that keeps no photo of its own offers none on step 1.
    expect(draft.companyCover).toBeNull();
  });

  it('a commit sent again as stored writes nothing and keeps its revision', async () => {
    const draft = await aDraft(owner(), await aLead(owner()));
    const once = await edited(owner(), draft, { quickMode: true });
    const twice = await edited(owner(), once, { quickMode: true });
    expect(twice.revision).toBe(once.revision);
  });

  it('a Design Engineer builds on a lead their scope reaches only', async () => {
    const leadId = await aLead(owner());
    const reply = await start(world.as(here.members.designer), leadId);
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
  });
});
