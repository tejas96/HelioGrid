import { randomUUID } from 'node:crypto';
import { type DeclaredFile, OBJECT_STORE, type ProjectDetail } from '@heliogrid/contracts';
import { file } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PDFDocument } from 'pdf-lib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type MemoryObjectStore,
  sha256Of,
} from '../../src/modules/file/internal/object-store.memory';
import { ProjectsPackService } from '../../src/modules/projects/projects.pack.service';
import { retryKey } from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  actOn,
  aStaffedCompany,
  aWonProject,
  type Caller,
  detailOf,
  openProjectsWorld,
  type ProjectsWorld,
  refusalOf,
  TO_COMMISSIONED,
  walk,
} from './support';

/**
 * The handover pack (`M08-46`, `M08-48`) made the way the workflow's one step makes it — through
 * the api's own service, no Temporal: one PDF of every done row's file in the pack's row order and
 * every other file shown to the customer, put on the `handover_pack` row once.
 */

const here = aStaffedCompany('Project Pack EPC', { owner: [FOUNDER_ROLE] });

/** Pages in each stored PDF, and in the pack they make: the warranty's, then the shown drawing's. */
const WARRANTY_PAGES = 2;
const DRAWING_PAGES = 1;
const HIDDEN_PAGES = 4;

const skip = skipWithoutDatabase(
  'PROJECT HANDOVER PACK',
  'The handover pack is UNPROVEN on the wire in this run.',
);

/** A PDF of `pages` blank pages, stored for the project through the person's own upload. */
async function aStoredPdf(
  world: ProjectsWorld,
  caller: Caller,
  projectId: string,
  pages: number,
): Promise<string> {
  const pdf = await PDFDocument.create();
  for (let page = 0; page < pages; page++) pdf.addPage();
  return aStoredBytes(world, caller, projectId, await pdf.save());
}

/** These bytes stored for the project as a PDF, through the person's own upload. */
async function aStoredBytes(
  world: ProjectsWorld,
  caller: Caller,
  projectId: string,
  bytes: Uint8Array,
): Promise<string> {
  const declared = await caller.call<DeclaredFile>(
    'POST',
    '/files',
    {
      subjectKind: 'project',
      subjectRef: projectId,
      contentType: 'application/pdf',
      byteSize: bytes.length,
      checksumSha256: sha256Of(bytes),
    },
    retryKey(),
  );
  if (declared.status !== HttpStatus.CREATED) {
    throw new Error(`declare: got ${declared.status} ${JSON.stringify(declared.body)}`);
  }
  const store = world.http.app.get<MemoryObjectStore>(OBJECT_STORE);
  if (!store.receive(declared.body.upload?.url ?? '', bytes)) throw new Error('upload refused');
  const done = await caller.call('POST', `/files/${declared.body.file.id}/complete`);
  if (done.status !== HttpStatus.OK) throw new Error(`complete: got ${done.status}`);
  return declared.body.file.id;
}

describe.skipIf(skip)('the handover pack, made as its workflow step makes it', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;
  const make = (projectId: string) =>
    world.http.app
      .get(ProjectsPackService)
      .make({ tenantId: here.company.tenantId, projectId }, Date.now());
  const packRowOf = (detail: ProjectDetail) =>
    detail.documents.find((one) => one.row === 'handover_pack');

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a project not handed over, or gone, has no pack made for it — the run ends', async () => {
    expect(await make(randomUUID())).toEqual({ attached: false });
    const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
    expect(await make(projectId)).toEqual({ attached: false });
    const unmade = (await detailOf(owner(), projectId)).body;
    expect(packRowOf(unmade)?.files).toEqual([]);
    expect(unmade.packLeftOut).toBeNull();
  });

  it('joins every done row and every shown other file into one PDF on the pack row, once', async () => {
    const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
    await walk(owner(), projectId, TO_COMMISSIONED);
    const warranty = await aStoredPdf(world, owner(), projectId, WARRANTY_PAGES);
    const shown = await aStoredPdf(world, owner(), projectId, DRAWING_PAGES);
    const hidden = await aStoredPdf(world, owner(), projectId, HIDDEN_PAGES);
    const put = (fileId: string, slot: string, slotKey: string | null, name: string) =>
      acted(owner(), projectId, 'files', { fileId, slot, slotKey, name });
    await put(warranty, 'document', 'warranty_documents', 'Warranty.pdf');
    // A damaged file on a done row: the pack is made without it, never stuck on it.
    const damaged = await aStoredBytes(
      world,
      owner(),
      projectId,
      new TextEncoder().encode('%PDF-1.4 not a pdf'),
    );
    await put(damaged, 'document', 'utility_approval', 'Approval.pdf');
    const withOthers = await put(shown, 'other', null, 'Structure drawing.pdf');
    await put(hidden, 'other', null, 'Internal costing.pdf');
    const drawing = withOthers.otherFiles.find((one) => one.fileId === shown);
    await acted(owner(), projectId, 'files/show', { projectFileId: drawing?.id, shown: true });
    const pending = (await detailOf(owner(), projectId)).body.documents.filter(
      (one) => one.state === 'pending' && one.row !== 'handover_pack',
    );
    for (const row of pending) {
      await acted(owner(), projectId, 'documents/not-needed', {
        row: row.row,
        reason: 'Handled outside HelioGrid',
      });
    }
    await acted(owner(), projectId, 'handover');
    expect((await detailOf(owner(), projectId)).body.packLeftOut).toBeNull();

    expect(await make(projectId)).toEqual({ attached: true });
    const packed = (await detailOf(owner(), projectId)).body;
    expect(packed.packLeftOut).toBe(1);
    const pack = packRowOf(packed)?.files ?? [];
    expect(pack).toHaveLength(1);
    const store = world.http.app.get<MemoryObjectStore>(OBJECT_STORE);
    const link = await owner().call<{ url: string }>(
      'GET',
      `/files/${pack[0]?.fileId}/download-url`,
    );
    expect(link.status).toBe(HttpStatus.OK);
    const [kept] = await world.pools.admin.db
      .select({ key: file.externalId, type: file.contentType })
      .from(file)
      .where(eq(file.id, pack[0]?.fileId ?? ''));
    expect(kept?.type).toBe('application/pdf');
    // The warranty's two pages, then the shown drawing's one — never the hidden file's four.
    const made = await PDFDocument.load(await store.read(kept?.key ?? ''));
    expect(made.getPageCount()).toBe(WARRANTY_PAGES + DRAWING_PAGES);

    expect(await make(projectId)).toEqual({ attached: false });
    expect(packRowOf((await detailOf(owner(), projectId)).body)?.files).toHaveLength(1);
  });

  it('with no file it can read, no pack is made, and the project says every file was left out', async () => {
    const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
    await walk(owner(), projectId, TO_COMMISSIONED);
    const damaged = await aStoredBytes(
      world,
      owner(),
      projectId,
      new TextEncoder().encode('%PDF-1.4 not a pdf'),
    );
    await acted(owner(), projectId, 'files', {
      fileId: damaged,
      slot: 'document',
      slotKey: 'warranty_documents',
      name: 'Warranty.pdf',
    });
    const pending = (await detailOf(owner(), projectId)).body.documents.filter(
      (one) => one.state === 'pending' && one.row !== 'handover_pack',
    );
    for (const row of pending) {
      await acted(owner(), projectId, 'documents/not-needed', {
        row: row.row,
        reason: 'Handled outside HelioGrid',
      });
    }
    await acted(owner(), projectId, 'handover');

    expect(await make(projectId)).toEqual({ attached: false });
    const unmade = (await detailOf(owner(), projectId)).body;
    expect(packRowOf(unmade)?.files).toEqual([]);
    expect(unmade.packLeftOut).toBe(1);
  });

  it('a handed-over project switches no file to the customer any more', async () => {
    const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
    await walk(owner(), projectId, TO_COMMISSIONED);
    const drawing = await aStoredPdf(world, owner(), projectId, DRAWING_PAGES);
    const filed = await acted(owner(), projectId, 'files', {
      fileId: drawing,
      slot: 'other',
      slotKey: null,
      name: 'Drawing.pdf',
    });
    const rows = filed.documents.filter(
      (one) => one.state === 'pending' && one.row !== 'handover_pack',
    );
    for (const row of rows) {
      await acted(owner(), projectId, 'documents/not-needed', { row: row.row, reason: 'Outside' });
    }
    await acted(owner(), projectId, 'handover');
    const reply = await actOn(owner(), projectId, 'files/show', {
      projectFileId: filed.otherFiles[0]?.id,
      shown: true,
    });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('project_closed');
  });
});
