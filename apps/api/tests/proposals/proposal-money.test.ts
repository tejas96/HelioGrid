import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDraft,
  aLead,
  aStaffedCompany,
  detailOf,
  edit,
  edited,
  fiveComponents,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
  pune,
  systemOf,
} from './support';

/**
 * The proposal's money on the wire (`T-M06-024`, `M06-34`, `M06-35`, `M06-37`, `M06-38`, `M06-09`):
 * one value set, worked out on the server from the market pack, that every surface prints — the
 * payable the customer pays the company, the incentive beside it and never off it, and our cost
 * only for who may see cost.
 */

const here = aStaffedCompany('Proposal Money EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'PROPOSAL MONEY PROOF',
  'The proposal money block is UNPROVEN on the wire in this run.',
);

/** An Indian GSTIN in Maharashtra: the format only — the registry checks the rest. */
const GSTIN = '27ABCDE1234F1Z5';

/** ₹1,90,575 in rupees, compared to the paisa. */
const PAYABLE_RUPEES = 190_575;
const PAISA_DIGITS = 2;
const WIDER_KW = 4;
const BRAND_LIMIT = 3;

describe.skipIf(skip)('The proposal money block, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const seller = () => world.as(here.members.seller);

  /** A residential lead in Pune with a draft on it. */
  async function aSitedDraft() {
    const draft = await aDraft(owner(), await aLead(owner()));
    return edited(owner(), draft, { deal: { segment: 'residential', area: pune } });
  }

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
    const saved = await owner().call('PUT', '/settings/tax-registrations', {
      registrations: [{ registrationType: 'IN_GST', value: GSTIN }],
    });
    if (saved.status !== HttpStatus.OK) throw new Error(`registration: ${saved.status}`);
  });

  afterAll(async () => {
    await world.close();
  });

  it('₹1,75,000 with ₹15,575 tax and a ₹78,000 incentive: the payable is ₹1,90,575 and the net ₹1,12,575', async () => {
    const draft = await aSitedDraft();
    const priced = await edited(owner(), draft, { fields: { system: systemOf(draft) } });
    const money = priced.document.money;
    expect(money).toMatchObject({
      currencyCode: 'INR',
      preTax: '175000.00',
      taxAmount: '15575.00',
      payableAtOrBelowZero: false,
      incentiveOffered: true,
    });
    expect(money?.payable.amount).toBe('190575.00');
    expect(money?.incentive).toMatchObject({ paidTo: 'customer', figure: { amount: '78000.00' } });
    expect(money?.netCost.amount).toBe('112575.00');
    const parts = money?.tranches ?? [];
    const total = parts.reduce((sum, part) => sum + Number(part.amount), 0);
    expect(total).toBeCloseTo(PAYABLE_RUPEES, PAISA_DIGITS);
    // The incentive is paid to the customer: it is never a line of what they pay the company.
    expect(money?.equation.map((line) => line.key)).not.toContain('incentive');
  });

  it('incentive claimed switched off zeroes it; an off-grid system is not offered one', async () => {
    const draft = await aSitedDraft();
    const off = await edited(owner(), draft, {
      fields: { system: systemOf(draft, { incentiveClaimed: false }) },
    });
    expect(off.document.money).toMatchObject({ incentiveOffered: true, incentive: null });
    expect(off.document.money?.netCost.amount).toBe('190575.00');
    const offGrid = await edited(owner(), off, {
      fields: { system: systemOf(off, { systemType: 'off_grid', incentiveClaimed: true }) },
    });
    expect(offGrid.document.money).toMatchObject({ incentiveOffered: false, incentive: null });
  });

  it('a discount is taken before tax, and a payable at or below zero is stated, never hidden', async () => {
    const draft = await aSitedDraft();
    const discounted = await edited(owner(), draft, {
      fields: {
        system: systemOf(draft, { discount: { mode: 'amount', amount: '10000.00' } }),
      },
    });
    const money = discounted.document.money;
    expect(money).toMatchObject({
      preTax: '165000.00',
      discount: '10000.00',
      taxAmount: '14685.00',
    });
    expect(money?.payable.amount).toBe('179685.00');
    const below = await edited(owner(), discounted, {
      fields: {
        system: systemOf(discounted, { discount: { mode: 'amount', amount: '200000.00' } }),
      },
    });
    expect(below.document.money?.payableAtOrBelowZero).toBe(true);
    expect(Number(below.document.money?.payable.amount)).toBeLessThan(0);
    expect(below.checklist.blocks.map((block) => block.check)).toContain('payable_not_positive');
  });

  it('our cost and the margin reach the owner alone; a Sales Executive reads neither', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const draft = await aDraft(owner(), leadId);
    const sited = await edited(owner(), draft, { deal: { segment: 'residential', area: pune } });
    const costed = await edited(owner(), sited, {
      fields: { system: systemOf(sited, { ourCost: '140000.00' }) },
    });
    expect(costed.rights.seesCost).toBe(true);
    expect(costed.document.fields.system.ourCost).toBe('140000.00');
    expect(costed.document.money?.margin).toMatchObject({ amount: '35000.00', belowCost: false });
    const theirs = (await detailOf(seller(), draft.id)).body;
    expect(theirs.rights.seesCost).toBe(false);
    expect(theirs.document.fields.system).not.toHaveProperty('ourCost');
    expect(theirs.document.money).not.toHaveProperty('margin');
    // A Sales Executive's edit leaves the stored cost as it stands, whatever they send.
    const sent = await edited(seller(), theirs, {
      fields: { system: { ...theirs.document.fields.system, ourCost: '1.00', capacityKw: 4 } },
    });
    expect(sent.document.fields.system.capacityKw).toBe(WIDER_KW);
    const kept = (await detailOf(owner(), draft.id)).body;
    expect(kept.document.fields.system.ourCost).toBe('140000.00');
  });

  it('priced below our cost warns with the loss for the owner, and with no figure for a rep', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const draft = await aDraft(owner(), leadId);
    const sited = await edited(owner(), draft, { deal: { segment: 'residential', area: pune } });
    const lossy = await edited(owner(), sited, {
      fields: { system: systemOf(sited, { ourCost: '200000.00' }) },
    });
    const mine = lossy.checklist.warnings.find((warning) => warning.check === 'below_cost');
    expect(mine).toMatchObject({ loss: '25000.00' });
    const theirs = (await detailOf(seller(), draft.id)).body.checklist.warnings.find(
      (warning) => warning.check === 'below_cost',
    );
    expect(theirs).toMatchObject({ loss: null });
  });

  it('an amount finer than the paisa is refused on its field, never rounded', async () => {
    const draft = await aSitedDraft();
    const reply = await edit(owner(), draft, {
      fields: { system: systemOf(draft, { priceInclusive: '190575.005' }) },
    });
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      error: { details: [{ path: 'fields.system.priceInclusive' }] },
    });
  });

  it('a fourth brand in one section is refused with the limit stated', async () => {
    const draft = await aSitedDraft();
    const [panel] = fiveComponents();
    if (panel === undefined) throw new Error('no panel line');
    const four = ['A', 'B', 'C', 'D'].map((brand) => ({ ...panel, brand }));
    const reply = await edit(owner(), draft, { fields: { components: four } });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    const three = await edit(owner(), draft, {
      fields: { components: four.slice(0, BRAND_LIMIT) },
    });
    expect(three.status).toBe(HttpStatus.OK);
  });
});

describe.skipIf(skip)('A company with no tax registration, over HTTP', () => {
  const plain = aStaffedCompany('Proposal Unregistered EPC', { owner: [FOUNDER_ROLE] });
  let world: ProposalsWorld;

  beforeAll(async () => {
    world = await openProposalsWorld([plain]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('prints no tax line: its typed price is the price', async () => {
    const owner = world.as(plain.members.owner);
    const draft = await aDraft(owner, await aLead(owner));
    const priced = await edited(owner, draft, {
      deal: { segment: 'residential', area: pune },
      fields: { system: systemOf(draft) },
    });
    expect(priced.document.money).toMatchObject({
      taxAmount: '0.00',
      taxes: [],
      preTax: '190575.00',
    });
    expect(priced.document.money?.payable.amount).toBe('190575.00');
    expect(priced.missingCompanyFacts).toContain('tax_registration');
  });
});
