import { randomUUID } from 'node:crypto';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anUpload } from '../projects/stored-file';
import { skipWithoutDatabase } from '../support/fixture';
import { box, codeOf, JPEG, LINES, PNG, photoFacts, pictureCalls, WEBP } from './picture-support';
import {
  aDesign,
  aLead,
  aStaffedCompany,
  type Caller,
  detailOf,
  openStudioWorld,
  ownLead,
  preset,
  retryKey,
  type StudioWorld,
} from './support';

/**
 * A design's pictures of its own on the wire (`T-M05-002d`), read on the device: who may keep one
 * and who may read it, that every file it names is this design's and of its part's type, that a
 * retry keeps no second one — and that another company's design answers as no such design, on the
 * route our server reads a CAD plan from too.
 */

const here = aStaffedCompany('Design Picture EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
  pm: [preset.project_manager],
});
const there = aStaffedCompany('Design Picture Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'DESIGN PICTURE PROOF',
  'Who may keep and read a picture of a design’s own, and another company’s 404, are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('A design’s own picture, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const seller = () => world.as(here.members.seller);
  const pm = () => world.as(here.members.pm);
  const stranger = () => world.as(there.members.owner);

  beforeAll(async () => {
    world = await openStudioWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  const pictures = () => pictureCalls(world);
  const aSitedDesign = (caller: Caller = owner()) => pictures().aSitedDesign(caller);
  const stored = (...args: Parameters<ReturnType<typeof pictureCalls>['stored']>) =>
    pictures().stored(...args);
  const add = (...args: Parameters<ReturnType<typeof pictureCalls>['add']>) =>
    pictures().add(...args);
  const addCadPlan = (...args: Parameters<ReturnType<typeof pictureCalls>['addCadPlan']>) =>
    pictures().addCadPlan(...args);
  const read = (...args: Parameters<ReturnType<typeof pictureCalls>['read']>) =>
    pictures().read(...args);
  const aPhoto = (caller: Caller, designId: string) => pictures().aPhoto(caller, designId);

  it('the EPC Owner keeps a photo read on the device and reads it back, with a link to each piece', async () => {
    const designId = await aSitedDesign();
    const reply = await add(owner(), designId, await aPhoto(owner(), designId));
    expect(reply.status).toBe(HttpStatus.CREATED);
    expect(reply.body).toMatchObject({
      kind: 'photo',
      name: 'roof-from-above.jpg',
      state: 'ready',
      refusal: null,
      facts: photoFacts,
      addedBy: { userId: here.people.owner.userId },
    });
    expect(reply.body.files).toHaveLength(2);
    expect(reply.body.files[0]).toMatchObject({ page: 1, role: 'piece', box });
    const again = await read(owner(), designId, reply.body.id);
    expect(again.status).toBe(HttpStatus.OK);
    expect(again.body.files.map((file) => file.box)).toEqual(
      reply.body.files.map((file) => file.box),
    );
  });

  it('a Sales Executive keeps one on a design of a lead they own', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const designId = (await aDesign(seller(), leadId)).design.id;
    const reply = await add(seller(), designId, await aPhoto(seller(), designId));
    expect(reply.status).toBe(HttpStatus.CREATED);
  });

  it('a Project Manager, who may not change designs, keeps none and stores no file against one', async () => {
    const designId = await aSitedDesign();
    const body = await aPhoto(owner(), designId);
    expect((await add(pm(), designId, body)).status).toBe(HttpStatus.FORBIDDEN);
    const plan = { name: 'sharma-house.dwg', fileId: randomUUID() };
    expect((await addCadPlan(pm(), designId, plan)).status).toBe(HttpStatus.FORBIDDEN);
    const upload = await anUpload(world, pm(), {
      subjectKind: 'design',
      subjectRef: designId,
      contentType: 'image/jpeg',
      bytes: JPEG,
    });
    expect(upload.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('who may read the design reads its picture; who may not finds none', async () => {
    const designId = await aSitedDesign();
    const made = await add(owner(), designId, await aPhoto(owner(), designId));
    // The picture reads exactly where its design does: the lead's reach decides both.
    for (const caller of [seller(), pm()]) {
      const design = await detailOf(caller, designId);
      const picture = await read(caller, designId, made.body.id);
      expect(picture.status).toBe(design.status);
    }
  });

  it('another company’s design is not found: no picture kept, none read, no file stored against it', async () => {
    const designId = await aSitedDesign();
    const made = await add(owner(), designId, await aPhoto(owner(), designId));
    const theirs = await aSitedDesign(stranger());
    const theirBody = await aPhoto(stranger(), theirs);
    expect((await add(stranger(), designId, theirBody)).status).toBe(HttpStatus.NOT_FOUND);
    const theirPlan = { name: 'theirs.dwg', fileId: theirBody.files[0]?.fileId ?? randomUUID() };
    expect((await addCadPlan(stranger(), designId, theirPlan)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await read(stranger(), designId, made.body.id)).status).toBe(HttpStatus.NOT_FOUND);
    // Their own design id with our picture's id finds nothing either.
    expect((await read(stranger(), theirs, made.body.id)).status).toBe(HttpStatus.NOT_FOUND);
    const upload = await anUpload(world, stranger(), {
      subjectKind: 'design',
      subjectRef: designId,
      contentType: 'image/jpeg',
      bytes: JPEG,
    });
    expect(upload.status).not.toBe(HttpStatus.CREATED);
  });

  it('a picture read under another design of the company is not found', async () => {
    const designId = await aSitedDesign();
    const other = await aSitedDesign();
    const made = await add(owner(), designId, await aPhoto(owner(), designId));
    expect((await read(owner(), other, made.body.id)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('keeps a piece with see-through edges as a WebP, or a PNG where the device writes no WebP', async () => {
    const designId = await aSitedDesign();
    const body = await aPhoto(owner(), designId);
    const [first, second] = body.files;
    if (first === undefined || second === undefined) throw new Error('two pieces');
    const files = [
      { ...first, fileId: await stored(owner(), designId, WEBP, 'image/webp') },
      { ...second, fileId: await stored(owner(), designId, PNG, 'image/png') },
    ];
    const reply = await add(owner(), designId, { ...body, files });
    expect(reply.status).toBe(HttpStatus.CREATED);
  });

  it.each([
    ['a piece stored against another design', 'other-design'],
    ['a piece whose file is lines', 'wrong-type'],
    ['lines kept by a photo', 'wrong-role'],
    ['a file named twice', 'twice'],
    ['a file never stored', 'unknown'],
    ['a part on a page past the last', 'past-last-page'],
  ] as const)('refuses %s, and keeps nothing', async (_, fault) => {
    const designId = await aSitedDesign();
    const body = await aPhoto(owner(), designId);
    const [first, second] = body.files;
    if (first === undefined || second === undefined) throw new Error('two pieces');
    const faulty = async () => {
      switch (fault) {
        case 'other-design':
          return { ...first, fileId: await stored(owner(), await aSitedDesign(), JPEG) };
        case 'wrong-type':
          return { ...first, fileId: await stored(owner(), designId, LINES, 'application/json') };
        case 'wrong-role':
          return { ...first, role: 'lines' as const, box: null };
        case 'twice':
          return { ...first, fileId: second.fileId };
        case 'unknown':
          return { ...first, fileId: randomUUID() };
        case 'past-last-page':
          return { ...first, page: 2 };
      }
    };
    const reply = await add(owner(), designId, { ...body, files: [await faulty(), second] });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(codeOf(reply)).toBe('DESIGN_PICTURE_FILE_REFUSED');
  });

  it('a retry with the same key keeps no second picture', async () => {
    const designId = await aSitedDesign();
    const body = await aPhoto(owner(), designId);
    const key = retryKey();
    const first = await add(owner(), designId, body, key);
    const again = await add(owner(), designId, body, key);
    expect(again.status).toBe(HttpStatus.CREATED);
    expect(again.body.id).toBe(first.body.id);
  });
});
