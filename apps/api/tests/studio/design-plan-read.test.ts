import { randomUUID } from 'node:crypto';
import { type DesignDocumentWire, OBJECT_STORE } from '@heliogrid/contracts';
import { orchestrationOutbox } from '@heliogrid/db';
import {
  CAD_PLAN_MAX_BYTES,
  EMPTY_STUDIO_DOCUMENT,
  FILE_MAX_BYTES,
  FOUNDER_ROLE,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type MemoryObjectStore,
  sha256Of,
} from '../../src/modules/file/internal/object-store.memory';
import { StudioPictureService } from '../../src/modules/studio/studio.picture.service';
import { skipWithoutDatabase } from '../support/fixture';
import { codeOf, DWG, JPEG, pictureCalls } from './picture-support';
import {
  aStaffedCompany,
  type Caller,
  documentOf,
  openStudioWorld,
  retryKey,
  type StudioWorld,
  takeTurn,
} from './support';

/**
 * A design's CAD plan read on our server, and where its pictures lie (`T-M05-002d`): a DWG is kept
 * reading and its read starts with it; the read ends ready with its lines or refused with the
 * reason, once; our server takes a DWG or a binary DXF alone, up to 20 MB; and the document keeps
 * where the picture and the plan lie, while a save from before reads with neither.
 */

const here = aStaffedCompany('Design Plan Read EPC', {
  owner: [FOUNDER_ROLE],
});
const there = aStaffedCompany('Design Plan Read Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'DESIGN PLAN READ PROOF',
  'A CAD plan read on our server, and the 20 MB limit, are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('A design’s CAD plan, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);

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

  it('a DWG is kept reading, its read starts with the picture, and ends ready with its lines', async () => {
    const designId = await aSitedDesign();
    const fileId = await stored(owner(), designId, DWG, 'image/vnd.dwg');
    const reply = await addCadPlan(owner(), designId, {
      name: 'sharma-house.dwg',
      fileId,
    });
    expect(reply.status).toBe(HttpStatus.CREATED);
    expect(reply.body).toMatchObject({ kind: 'plan', state: 'reading', facts: null, files: [] });
    const pictureId = reply.body.id;
    const [event] = await world.pools.admin.db
      .select({ payload: orchestrationOutbox.payload })
      .from(orchestrationOutbox)
      .where(
        and(
          eq(orchestrationOutbox.tenantId, here.company.tenantId),
          eq(orchestrationOutbox.workflow, 'designPlanRead'),
        ),
      )
      .then((rows) =>
        rows.filter((row) => (row.payload as { pictureId: string }).pictureId === pictureId),
      );
    expect(event).toBeDefined();

    // The worker's turn, done by hand: read where the plan is, PUT the lines, keep them.
    const steps = world.http.app.get(StudioPictureService);
    const step = { tenantId: here.company.tenantId, pictureId };
    const source = await steps.planSource(step);
    expect(source?.contentType).toBe('image/vnd.dwg');
    const lines = new TextEncoder().encode(
      JSON.stringify({
        page: 1,
        extent: { west: 0, south: 0, east: 12000, north: 8500 },
        lines: [],
      }),
    );
    const store = world.http.app.get<MemoryObjectStore>(OBJECT_STORE);
    expect(store.receive(source?.put.url ?? '', lines)).toBe(true);
    const kept = await steps.keepPlan({
      ...step,
      read: {
        kind: 'lines',
        byteSize: lines.length,
        checksumSha256: sha256Of(lines),
        unit: 'mm',
        unitGuess: 'mm',
      },
    });
    expect(kept).toEqual({ state: 'ready' });
    const ready = await read(owner(), designId, pictureId);
    expect(ready.body).toMatchObject({
      state: 'ready',
      facts: { unit: 'mm', metresPerUnit: 0.001, pages: 1, pickedPage: 1 },
    });
    expect(ready.body.files).toMatchObject([{ page: 1, role: 'lines', box: null }]);
    // Read again, it is ended: no second read, and its answer holds.
    expect(await steps.planSource(step)).toBeNull();
    expect(await steps.endRead(step)).toEqual({ state: 'ready' });
  });

  it('a DWG the reader cannot read ends refused with the reason, and shows no part', async () => {
    const designId = await aSitedDesign();
    const fileId = await stored(owner(), designId, DWG, 'image/vnd.dwg');
    const reply = await addCadPlan(owner(), designId, {
      name: 'broken.dwg',
      fileId,
    });
    const steps = world.http.app.get(StudioPictureService);
    const step = { tenantId: here.company.tenantId, pictureId: reply.body.id };
    expect(
      await steps.keepPlan({ ...step, read: { kind: 'refused', refusal: 'no_lines' } }),
    ).toEqual({
      state: 'refused',
    });
    const refused = await read(owner(), designId, reply.body.id);
    expect(refused.body).toMatchObject({
      state: 'refused',
      refusal: 'no_lines',
      facts: null,
      files: [],
    });
  });

  it('our server reads a DWG or a binary DXF alone: a JPEG sent to it is refused', async () => {
    const designId = await aSitedDesign();
    const fileId = await stored(owner(), designId, JPEG);
    const reply = await addCadPlan(owner(), designId, {
      name: 'photo.dwg',
      fileId,
    });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(codeOf(reply)).toBe('DESIGN_PICTURE_FILE_REFUSED');
  });

  it('a 20 MB DWG is taken, one byte more is not; a JPEG stays under 2 MB', async () => {
    const designId = await aSitedDesign();
    const declare = (contentType: string, byteSize: number) =>
      owner().call(
        'POST',
        '/files',
        {
          subjectKind: 'design',
          subjectRef: designId,
          contentType,
          byteSize,
          checksumSha256: sha256Of(JPEG),
        },
        retryKey(),
      );
    expect((await declare('image/vnd.dwg', CAD_PLAN_MAX_BYTES)).status).toBe(HttpStatus.CREATED);
    expect((await declare('image/vnd.dwg', CAD_PLAN_MAX_BYTES + 1)).status).toBe(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect((await declare('image/jpeg', FILE_MAX_BYTES + 1)).status).toBe(
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  });

  it('the document keeps where the picture and the plan lie, and an old save reads with neither', async () => {
    const designId = await aSitedDesign();
    const made = await add(owner(), designId, await aPhoto(owner(), designId));
    await takeTurn(owner(), designId);
    const laid = {
      pictureId: made.body.id,
      at: { east: 1.5, north: -2 },
      turnDeg: -15,
      metresPerUnit: 0.05,
      scaleFrom: 'guess' as const,
    };
    const document = {
      ...EMPTY_STUDIO_DOCUMENT,
      picture: 'own' as const,
      ownPicture: laid,
      plan: { ...laid, seeThrough: 80, locked: false, hidden: false, page: 1 },
    };
    const saved = await owner().call('PUT', `/designs/${designId}/document`, {
      baseVersion: 0,
      document,
      opening: randomUUID(),
    });
    expect(saved.status).toBe(HttpStatus.OK);
    expect((await documentOf(owner(), designId)).body.document).toEqual(document);

    const { ownPicture: _own, plan: _plan, ...older } = document;
    const before = await owner().call('PUT', `/designs/${designId}/document`, {
      baseVersion: 1,
      document: older,
      opening: randomUUID(),
    });
    expect(before.status).toBe(HttpStatus.OK);
    const read = (await documentOf(owner(), designId)).body as DesignDocumentWire;
    expect(read.document).not.toHaveProperty('ownPicture');
    expect(read.document).not.toHaveProperty('plan');
  });
});
