import type { ProjectPayments } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pngOf } from '../files/support';
import { skipWithoutDatabase } from '../support/fixture';
import { aProjectAt, paymentsOf, recordPayment } from './payments-support';
import { anUpload } from './stored-file';
import {
  acted,
  aStaffedCompany,
  dayFromToday,
  now,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
  walk,
} from './support';

/**
 * A payment's receipt photo (`M11-37`): the payment is saved first and its photo is stored against
 * it afterwards, so a slow or failed upload never holds the money back. One photo per payment,
 * stored by who may record payments and read by who may see the project's money — never the crew
 * (`M11-56`).
 */

const here = aStaffedCompany('Payment Photo EPC', {
  owner: [FOUNDER_ROLE],
  finance: [preset.finance],
  installer: [preset.installation_team_member],
});

const skip = skipWithoutDatabase(
  'PAYMENT PHOTO PROOF',
  'A payment’s receipt photo is UNPROVEN on the wire in this run.',
);

/** A small receipt photo. */
const PHOTO_BYTES = 64;

describe.skipIf(skip)('a payment’s receipt photo, stored after the payment', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const finance = () => world.as(here.members.finance);
  const installer = () => world.as(here.members.installer);
  const photoOn = (caller: ReturnType<typeof owner>, entryId: string) =>
    anUpload(world, caller, {
      subjectKind: 'project_payment',
      subjectRef: entryId,
      contentType: 'image/png',
      bytes: pngOf(PHOTO_BYTES),
    });

  /** A project with one payment recorded on its first part, and that payment's id. */
  const aPayment = async () => {
    const projectId = await aProjectAt(owner(), here.people.owner.userId);
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reply = await recordPayment(finance(), projectId, {
      partId: first?.id,
      amount: '1000.00',
    });
    expect(reply.status).toBe(HttpStatus.CREATED);
    return { projectId, entryId: reply.body.recordedId };
  };

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a recording names the payment it wrote, with no photo yet', async () => {
    const { projectId, entryId } = await aPayment();
    const entry = (await paymentsOf(owner(), projectId)).entries.find((one) => one.id === entryId);
    expect(entry).toMatchObject({ kind: 'payment', fileId: null });
  });

  it('a recording no longer takes a photo in its body', async () => {
    const projectId = await aProjectAt(owner(), here.people.owner.userId);
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reply = await recordPayment(finance(), projectId, {
      partId: first?.id,
      amount: '1000.00',
      fileId: null,
    });
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('the photo stored after the save is the payment’s, and a second is refused', async () => {
    const { projectId, entryId } = await aPayment();
    const stored = await photoOn(finance(), entryId);
    expect(stored.status).toBe(HttpStatus.CREATED);
    const entry = (await paymentsOf(owner(), projectId)).entries.find((one) => one.id === entryId);
    expect(entry?.fileId).toBe(stored.fileId);
    expect((await photoOn(finance(), entryId)).status).not.toBe(HttpStatus.CREATED);
  });

  it('the crew on the job may neither store nor open a payment’s photo (M11-56)', async () => {
    const { projectId, entryId } = await aPayment();
    await walk(owner(), projectId, ['material_ordered']);
    await acted(owner(), projectId, 'dispatch', {
      crew: [here.people.installer.userId],
      leftOn: dayFromToday(0),
    });
    expect((await photoOn(installer(), entryId)).status).not.toBe(HttpStatus.CREATED);
    const stored = await photoOn(finance(), entryId);
    const link = await installer().call('GET', `/files/${stored.fileId}/download-url`);
    expect(link.status).not.toBe(HttpStatus.OK);
    const own = await finance().call('GET', `/files/${stored.fileId}/download-url`);
    expect(own.status).toBe(HttpStatus.OK);
  });

  it('a reversal takes no photo: it carries its reason', async () => {
    const { projectId, entryId } = await aPayment();
    const reversed = await owner().call<ProjectPayments>(
      'POST',
      `/projects/${projectId}/payments/${entryId}/reverse`,
      { reason: 'Recorded twice', capturedAt: now() },
    );
    const reversal = reversed.body.entries.find((one) => one.reversesId === entryId);
    expect(reversal).toBeDefined();
    expect((await photoOn(owner(), reversal?.id ?? '')).status).not.toBe(HttpStatus.CREATED);
  });
});
