import type { DesignDetail, LeadDetail } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aVisit, booked } from '../crm/lead-work';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDesign,
  aLead,
  aSite,
  aStaffedCompany,
  create,
  designsOf,
  detailOf,
  openStudioWorld,
  ownLead,
  preset,
  recommend,
  refusalOf,
  retryKey,
  type StudioWorld,
  saveSite,
} from './support';

/**
 * The design record on the wire (`T-M05-001a`): who may make and change one, that it is visible
 * exactly where its lead is, that the server numbers a lead's designs, that a retry makes no
 * second one, and that one design of a lead at most is recommended.
 */

const here = aStaffedCompany('Design Record EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  seller: [preset.sales_executive],
  other: [preset.sales_executive],
  // A booked visit is the one way a lead reaches a Design Engineer, and only a surveyor is booked.
  designer: [preset.design_engineer, preset.survey_engineer],
  pm: [preset.project_manager],
  accounts: [preset.finance],
});
const there = aStaffedCompany('Design Record Other EPC', { owner: [FOUNDER_ROLE] });

/** The number a lead's third design takes. */
const THIRD = 3;

const skip = skipWithoutDatabase(
  'DESIGN RECORD PROOF',
  'Who may make, read and change a design is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('The design record, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const seller = () => world.as(here.members.seller);

  beforeAll(async () => {
    world = await openStudioWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    ['the EPC Owner', 'owner'],
    ['a Sales Manager', 'manager'],
  ] as const)('%s makes a design on any lead of the company', async (_, who) => {
    const leadId = await aLead(owner());
    const reply = await create(world.as(here.members[who]), leadId);
    expect(reply.status).toBe(HttpStatus.CREATED);
    expect(reply.body.design).toMatchObject({
      ordinal: 1,
      mount: 'roof',
      status: 'draft',
      recommended: false,
    });
    expect(reply.body.subject.leadId).toBe(leadId);
    expect(reply.body.canEdit).toBe(true);
  });

  it('a Sales Executive makes one on a lead they own, and reads none on a lead they do not', async () => {
    const mine = await aLead(owner());
    const theirs = await aLead(owner());
    await ownLead(world, mine, here.people.seller.userId);
    await ownLead(world, theirs, here.people.other.userId);
    expect((await create(seller(), mine)).status).toBe(HttpStatus.CREATED);
    expect((await create(seller(), theirs)).status).toBe(HttpStatus.NOT_FOUND);
    const hidden = await aDesign(world.as(here.members.other), theirs);
    expect((await detailOf(seller(), hidden.design.id)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await designsOf(seller(), theirs)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await saveSite(seller(), hidden.design.id)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await recommend(seller(), hidden.design.id, true)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a Design Engineer who surveys makes one on a lead whose booked visit names them, and on no other', async () => {
    const assigned = await aLead(owner());
    const other = await aLead(owner());
    await booked(owner(), assigned, aVisit(here.people.designer.userId));
    const designer = world.as(here.members.designer);
    const made = await create(designer, assigned);
    expect(made.status).toBe(HttpStatus.CREATED);
    expect((await saveSite(designer, made.body.design.id)).status).toBe(HttpStatus.OK);
    expect((await create(designer, other)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await designsOf(designer, other)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it.each([
    ['a Project Manager', 'pm'],
    ['Finance', 'accounts'],
  ] as const)('%s may not make a design, save its site or mark it', async (_, who) => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    const caller = world.as(here.members[who]);
    expect((await create(caller, leadId)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await saveSite(caller, made.design.id)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await recommend(caller, made.design.id, true)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await designsOf(owner(), leadId)).body.designs).toHaveLength(1);
  });

  it("another company's lead and design are not found", async () => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    const stranger = world.as(there.members.owner);
    expect((await create(stranger, leadId)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await designsOf(stranger, leadId)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await detailOf(stranger, made.design.id)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await saveSite(stranger, made.design.id)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await recommend(stranger, made.design.id, true)).status).toBe(HttpStatus.NOT_FOUND);
    const kept = await detailOf(owner(), made.design.id);
    expect(kept.body.site.pin).toBeNull();
    expect(kept.body.design.recommended).toBe(false);
  });

  it('the server numbers a lead’s designs, and each lead counts its own', async () => {
    const first = await aLead(owner());
    const second = await aLead(owner());
    expect((await aDesign(owner(), first)).design.ordinal).toBe(1);
    expect((await aDesign(owner(), first)).design.ordinal).toBe(2);
    expect((await aDesign(owner(), second)).design.ordinal).toBe(1);
    expect((await aDesign(owner(), first)).design.ordinal).toBe(THIRD);
    const listed = await designsOf(owner(), first);
    expect(listed.body.designs.map((one) => one.ordinal)).toEqual([THIRD, 2, 1]);
    expect(listed.body.canDesign).toBe(true);
  });

  it('two people starting at once get two numbers, never one', async () => {
    const leadId = await aLead(owner());
    const both = await Promise.all([
      create(owner(), leadId),
      create(world.as(here.members.manager), leadId),
    ]);
    expect(both.map((reply) => reply.status)).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(both.map((reply) => reply.body.design.ordinal).sort()).toEqual([1, 2]);
  });

  it('a retry with the same key makes no second design, and the key answers no other request', async () => {
    const leadId = await aLead(owner());
    const other = await aLead(owner());
    const key = retryKey();
    const body = { copyOf: null, capturedAt: new Date().toISOString() };
    const send = (onLead: string) =>
      owner().call<DesignDetail>('POST', `/leads/${onLead}/designs`, body, key);
    const first = await send(leadId);
    const again = await send(leadId);
    expect(again.status).toBe(HttpStatus.CREATED);
    expect(again.body.design.id).toBe(first.body.design.id);
    expect((await designsOf(owner(), leadId)).body.designs).toHaveLength(1);
    const reused = await send(other);
    expect(reused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect((await designsOf(owner(), other)).body.designs).toHaveLength(0);
  });

  it('a copy is a new draft of the same lead with the source’s roof or ground', async () => {
    const leadId = await aLead(owner());
    const source = await aDesign(owner(), leadId);
    await saveSite(owner(), source.design.id, aSite({ mount: 'ground' }));
    const copy = await create(owner(), leadId, source.design.id);
    expect(copy.status).toBe(HttpStatus.CREATED);
    expect(copy.body.design).toMatchObject({ ordinal: 2, mount: 'ground', status: 'draft' });
    const elsewhere = await aLead(owner());
    expect((await create(owner(), elsewhere, source.design.id)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a lead carries the recommended mark on one design at most, and the same mark again changes nothing', async () => {
    const leadId = await aLead(owner());
    const one = await aDesign(owner(), leadId);
    const two = await aDesign(owner(), leadId);
    const marked = await recommend(owner(), one.design.id, true);
    expect(marked.status).toBe(HttpStatus.OK);
    const recommendedOf = (set: typeof marked.body) =>
      set.designs.filter((each) => each.recommended).map((each) => each.id);
    expect(recommendedOf(marked.body)).toEqual([one.design.id]);
    const moved = await recommend(owner(), two.design.id, true);
    expect(recommendedOf(moved.body)).toEqual([two.design.id]);
    const again = await recommend(owner(), two.design.id, true);
    expect(again.body).toEqual(moved.body);
    const off = await recommend(owner(), two.design.id, false);
    expect(recommendedOf(off.body)).toEqual([]);
  });

  it('a lead marked lost takes no new design and no site change', async () => {
    const leadId = await aLead(owner());
    const made = await aDesign(owner(), leadId);
    const lost = await owner().call('POST', `/leads/${leadId}/lost`, {
      reason: 'price',
      capturedAt: new Date().toISOString(),
    });
    expect(lost.status).toBe(HttpStatus.OK);
    const refused = await create(owner(), leadId);
    expect(refused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(refused)).toBe('host_closed');
    const site = await saveSite(owner(), made.design.id);
    expect(site.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(site)).toBe('host_closed');
    expect((await detailOf(owner(), made.design.id)).status).toBe(HttpStatus.OK);
  });

  it('the lead page counts its designs', async () => {
    const leadId = await aLead(owner());
    const before = await seller().call<LeadDetail>('GET', `/leads/${leadId}`);
    await ownLead(world, leadId, here.people.seller.userId);
    await aDesign(seller(), leadId);
    await aDesign(seller(), leadId);
    const after = await seller().call<LeadDetail>('GET', `/leads/${leadId}`);
    expect(before.status).toBe(HttpStatus.NOT_FOUND);
    expect(after.body.sections.designs).toBe(2);
  });
});
