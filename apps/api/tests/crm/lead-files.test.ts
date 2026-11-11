import type { LeadDetail, LeadFiles, ProjectDetail } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aLead,
  aStoredFile,
  aWin,
  markWon,
  openProjectsWorld,
  type ProjectsWorld,
} from '../projects/support';
import { skipWithoutDatabase } from '../support/fixture';
import { aVisit, booked } from './lead-work';
import { aStaffedCompany, type Caller, preset } from './support';

/**
 * A lead's files on the wire (`M02-32`, ruling 2026-11-10): a file stored against the lead is put
 * on it by name and listed with who added it, the same file again adds nothing, a file not
 * finished or stored for another record is refused by name, and the project won from the lead
 * lists the same rows. Who may see the lead reads them; only the add-and-edit grant adds one.
 */

const here = aStaffedCompany('Lead Files EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
  surveyor: [preset.survey_engineer],
});
const elsewhere = aStaffedCompany('Other Lead Files EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'LEAD FILES PROOF',
  'The files on a lead are UNPROVEN on the wire in this run.',
);

const now = () => new Date().toISOString();
const NAME_CAP = 255;

describe.skipIf(skip)('the files on a lead, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;
  const tenantId = () => here.company.tenantId;
  const listOf = (caller: Caller, leadId: string) =>
    caller.call<LeadFiles>('GET', `/leads/${leadId}/files`);
  const attach = (caller: Caller, leadId: string, fileId: string, name = 'Electricity bill.pdf') =>
    caller.call<LeadFiles>('POST', `/leads/${leadId}/files`, { fileId, name, capturedAt: now() });
  const storedOn = (leadId: string, uploaded = true) =>
    aStoredFile(world, tenantId(), { kind: 'lead', ref: leadId }, uploaded);

  beforeAll(async () => {
    world = await openProjectsWorld([here, elsewhere]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a lead lists none until a stored file is put on it, then that file with its adder', async () => {
    const leadId = await aLead(owner());
    expect(await listOf(owner(), leadId)).toMatchObject({
      status: HttpStatus.OK,
      body: { items: [] },
    });
    const fileId = await storedOn(leadId);
    const added = await attach(owner(), leadId, fileId);
    expect(added.status).toBe(HttpStatus.OK);
    const expected = {
      fileId,
      name: 'Electricity bill.pdf',
      contentType: 'application/pdf',
      addedBy: { userId: ownerId(), name: expect.any(String) },
    };
    expect(added.body.items).toEqual([expect.objectContaining(expected)]);
    expect((await listOf(owner(), leadId)).body).toEqual(added.body);
    const detail = await owner().call<LeadDetail>('GET', `/leads/${leadId}`);
    expect(detail.body.sections.files).toBe(1);
  });

  it('the same file sent again adds no second row and answers the same list', async () => {
    const leadId = await aLead(owner());
    const fileId = await storedOn(leadId);
    const first = await attach(owner(), leadId, fileId);
    const again = await attach(owner(), leadId, fileId, 'Bill again.pdf');
    expect(again).toMatchObject({ status: HttpStatus.OK, body: first.body });
  });

  it('the files list oldest first', async () => {
    const leadId = await aLead(owner());
    const bill = await storedOn(leadId);
    const roof = await storedOn(leadId);
    await attach(owner(), leadId, bill, 'Bill.pdf');
    const both = await attach(owner(), leadId, roof, 'Roof.pdf');
    expect(both.body.items.map((one) => one.name)).toEqual(['Bill.pdf', 'Roof.pdf']);
  });

  it.each([
    ['blank', ''],
    ['only spaces', '   '],
    ['one past the cap', 'x'.repeat(NAME_CAP + 1)],
  ])('a name that is %s is refused on its field', async (_case, name) => {
    const leadId = await aLead(owner());
    const reply = await attach(owner(), leadId, await storedOn(leadId), name);
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({ error: { details: [{ path: 'name' }] } });
  });

  it('a name at the cap is taken', async () => {
    const leadId = await aLead(owner());
    const name = 'x'.repeat(NAME_CAP);
    const reply = await attach(owner(), leadId, await storedOn(leadId), name);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.items.map((one) => one.name)).toEqual([name]);
  });

  it('a file whose upload never completed is refused by name, and nothing is listed', async () => {
    const leadId = await aLead(owner());
    const reply = await attach(owner(), leadId, await storedOn(leadId, false));
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body).toMatchObject({ error: { code: 'LEAD_FILE_NOT_READY' } });
    expect((await listOf(owner(), leadId)).body.items).toEqual([]);
  });

  it('a file stored for another lead is refused by name on this one', async () => {
    const leadId = await aLead(owner());
    const otherFile = await storedOn(await aLead(owner()));
    const reply = await attach(owner(), leadId, otherFile);
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body).toMatchObject({ error: { code: 'LEAD_FILE_NOT_READY' } });
  });

  it.each([
    ['a rep who does not own it', () => world.as(here.members.rep)],
    ['another company', () => world.as(elsewhere.members.owner)],
  ])('a lead out of reach answers 404 to %s, read or added to', async (_case, reader) => {
    const leadId = await aLead(owner());
    const fileId = await storedOn(leadId);
    expect((await listOf(reader(), leadId)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await attach(reader(), leadId, fileId)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await listOf(owner(), leadId)).body.items).toEqual([]);
  });

  it('a preset without the add-and-edit grant reads the files of a lead it sees, and adds none', async () => {
    const leadId = await aLead(owner());
    await attach(owner(), leadId, await storedOn(leadId));
    await booked(owner(), leadId, aVisit(here.people.surveyor.userId));
    const surveyor = world.as(here.members.surveyor);
    const read = await listOf(surveyor, leadId);
    expect(read.status).toBe(HttpStatus.OK);
    expect(read.body.items).toHaveLength(1);
    const refused = await attach(surveyor, leadId, await storedOn(leadId));
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    expect((await listOf(owner(), leadId)).body.items).toHaveLength(1);
  });

  it('the project won from the lead lists the same files, from the lead', async () => {
    const leadId = await aLead(owner());
    const listed = (await attach(owner(), leadId, await storedOn(leadId))).body.items;
    const won = await markWon(owner(), leadId, aWin(ownerId()));
    expect(won.status).toBe(HttpStatus.CREATED);
    const project = await owner().call<ProjectDetail>('GET', `/projects/${won.body.projectId}`);
    expect(project.body.leadFiles).toEqual(
      listed.map((one) => ({ ...one, shownToCustomer: false })),
    );
  });
});
