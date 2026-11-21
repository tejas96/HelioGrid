import { randomUUID } from 'node:crypto';
import type { DesignDocumentWire } from '@heliogrid/contracts';
import { designDocument } from '@heliogrid/db';
import { EMPTY_STUDIO_DOCUMENT, FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uncoveredLatitude } from '../../src/modules/studio/internal/sky-picture-source.memory';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDesign,
  aLead,
  aSite,
  aStaffedCompany,
  detailOf,
  documentOf,
  giveTurn,
  openStudioWorld,
  ownLead,
  preset,
  refusalOf,
  type StudioWorld,
  saveDocument,
  saveSite,
  skyPictureOf,
  takeTurn,
} from './support';

/**
 * The design document on the wire (`T-M05-002a`): one document per design, saved whole over the
 * version it was changed from; one editor at a time; a save that started from an older version is
 * refused with who saved first and when; the sky picture fetched for each opening; and every route
 * answers another company and a lead out of scope as no such design.
 */

const here = aStaffedCompany('Design Document EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  seller: [preset.sales_executive],
  other: [preset.sales_executive],
  pm: [preset.project_manager],
  accounts: [preset.finance],
});
const there = aStaffedCompany('Design Document Other EPC', { owner: [FOUNDER_ROLE] });

/** A moment ago: a turn that ran out a second before now. */
const A_SECOND_MS = 1_000;

const skip = skipWithoutDatabase(
  'DESIGN DOCUMENT PROOF',
  'Who may save a design, one editor at a time and the refused stale save are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('The design document, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const manager = () => world.as(here.members.manager);

  beforeAll(async () => {
    world = await openStudioWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  /** A design on a new lead of the company, with its site in Sangli. */
  async function aSitedDesign(): Promise<string> {
    const made = await aDesign(owner(), await aLead(owner()));
    expect((await saveSite(owner(), made.design.id)).status).toBe(HttpStatus.OK);
    return made.design.id;
  }

  it('a design no one has saved reads as the empty document, version 0, with no editor', async () => {
    const designId = await aSitedDesign();
    const read = await documentOf(owner(), designId);
    expect(read.status).toBe(HttpStatus.OK);
    expect(read.body).toEqual<DesignDocumentWire>({
      document: { ...EMPTY_STUDIO_DOCUMENT, roofs: [] },
      version: 0,
      savedAt: null,
      savedBy: null,
      editTurn: null,
    });
  });

  it('each save counts one version, reads back whole, and names who saved it', async () => {
    const designId = await aSitedDesign();
    const before = (await detailOf(owner(), designId)).body.design.updatedAt;
    const first = await saveDocument(owner(), designId, 0, 'none');
    expect(first.status).toBe(HttpStatus.OK);
    expect(first.body.version).toBe(1);
    const second = await saveDocument(owner(), designId, 1, 'sky');
    expect(second.body.version).toBe(2);
    const read = await documentOf(owner(), designId);
    expect(read.body.version).toBe(2);
    expect(read.body.document.picture).toBe('sky');
    expect(read.body.savedBy?.userId).toBe(here.people.owner.userId);
    expect(read.body.savedAt).toBe(second.body.savedAt);
    expect(read.body.editTurn).toEqual({
      editor: { userId: here.people.owner.userId, name: expect.any(String) },
      mine: true,
    });
    expect((await detailOf(owner(), designId)).body.design.updatedAt > before).toBe(true);
  });

  it('one editor at a time: a second editor reads whose turn it is and their save is refused', async () => {
    const designId = await aSitedDesign();
    expect((await takeTurn(owner(), designId)).body).toMatchObject({ mine: true });
    const seen = await takeTurn(manager(), designId);
    expect(seen.status).toBe(HttpStatus.OK);
    expect(seen.body).toMatchObject({
      editor: { userId: here.people.owner.userId },
      mine: false,
    });
    const refused = await saveDocument(manager(), designId, 0);
    expect(refused.status).toBe(HttpStatus.CONFLICT);
    expect(refused.body).toMatchObject({
      error: {
        code: 'DESIGN_EDIT_TURN_HELD',
        facts: { editor: { userId: here.people.owner.userId } },
      },
    });
    expect((await documentOf(owner(), designId)).body.version).toBe(0);
    expect((await giveTurn(owner(), designId)).status).toBe(HttpStatus.NO_CONTENT);
    expect((await takeTurn(manager(), designId)).body).toMatchObject({ mine: true });
  });

  it('a turn its studio stops renewing runs out, and another editor takes it', async () => {
    const designId = await aSitedDesign();
    await takeTurn(owner(), designId);
    await world.pools.admin.db
      .update(designDocument)
      .set({ editorUntil: new Date(Date.now() - A_SECOND_MS) })
      .where(eq(designDocument.designId, designId));
    expect((await documentOf(manager(), designId)).body.editTurn).toBeNull();
    expect((await takeTurn(manager(), designId)).body).toMatchObject({ mine: true });
    expect((await saveDocument(manager(), designId, 0)).status).toBe(HttpStatus.OK);
  });

  it('a save made over an older version is refused with who saved first and when; nothing merges', async () => {
    const designId = await aSitedDesign();
    const first = await saveDocument(owner(), designId, 0, 'none');
    await giveTurn(owner(), designId);
    const stale = await saveDocument(manager(), designId, 0, 'sky');
    expect(stale.status).toBe(HttpStatus.CONFLICT);
    expect(stale.body).toMatchObject({
      error: {
        code: 'DESIGN_SAVED_FIRST',
        facts: {
          version: 1,
          savedAt: first.body.savedAt,
          savedBy: { userId: here.people.owner.userId },
          byThisOpening: false,
        },
      },
    });
    const kept = await documentOf(manager(), designId);
    expect(kept.body.document.picture).toBe('none');
    expect((await saveDocument(manager(), designId, 1, 'sky')).body.version).toBe(2);
  });

  it('a save sent again after its answer was lost is known as its own opening’s; the same person on another device is not', async () => {
    const designId = await aSitedDesign();
    const opening = randomUUID();
    expect((await saveDocument(owner(), designId, 0, 'none', opening)).status).toBe(HttpStatus.OK);
    const again = await saveDocument(owner(), designId, 0, 'none', opening);
    expect(again.status).toBe(HttpStatus.CONFLICT);
    expect(again.body).toMatchObject({
      error: { code: 'DESIGN_SAVED_FIRST', facts: { version: 1, byThisOpening: true } },
    });
    const otherDevice = await saveDocument(owner(), designId, 0, 'sky', randomUUID());
    expect(otherDevice.body).toMatchObject({
      error: { code: 'DESIGN_SAVED_FIRST', facts: { byThisOpening: false } },
    });
    expect((await documentOf(owner(), designId)).body.document.picture).toBe('none');
  });

  it('a giving back of a turn another holds leaves it with them', async () => {
    const designId = await aSitedDesign();
    await takeTurn(owner(), designId);
    expect((await giveTurn(manager(), designId)).status).toBe(HttpStatus.NO_CONTENT);
    expect((await documentOf(manager(), designId)).body.editTurn).toMatchObject({
      editor: { userId: here.people.owner.userId },
      mine: false,
    });
  });

  it.each([
    ['a Project Manager', 'pm'],
    ['Finance', 'accounts'],
  ] as const)('%s may not take the turn, give it back or save', async (_, who) => {
    const designId = await aSitedDesign();
    const caller = world.as(here.members[who]);
    expect((await takeTurn(caller, designId)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await giveTurn(caller, designId)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await saveDocument(caller, designId, 0)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await documentOf(owner(), designId)).body.version).toBe(0);
  });

  it('a Sales Executive edits the design of a lead they own, and finds none of a lead they do not', async () => {
    const mine = await aDesign(owner(), await aLead(owner()));
    const theirs = await aDesign(owner(), await aLead(owner()));
    await ownLead(world, mine.subject.leadId, here.people.seller.userId);
    await ownLead(world, theirs.subject.leadId, here.people.other.userId);
    const seller = world.as(here.members.seller);
    expect((await takeTurn(seller, mine.design.id)).body).toMatchObject({ mine: true });
    expect((await saveDocument(seller, mine.design.id, 0)).status).toBe(HttpStatus.OK);
    for (const reply of [
      await documentOf(seller, theirs.design.id),
      await saveDocument(seller, theirs.design.id, 0),
      await takeTurn(seller, theirs.design.id),
      await giveTurn(seller, theirs.design.id),
      await skyPictureOf(seller, theirs.design.id),
    ]) {
      expect(reply.status).toBe(HttpStatus.NOT_FOUND);
    }
  });

  it("another company's design is not found on any route, and stays as it was", async () => {
    const designId = await aSitedDesign();
    await saveDocument(owner(), designId, 0, 'sky');
    const stranger = world.as(there.members.owner);
    for (const reply of [
      await documentOf(stranger, designId),
      await saveDocument(stranger, designId, 1, 'none'),
      await takeTurn(stranger, designId),
      await giveTurn(stranger, designId),
      await skyPictureOf(stranger, designId),
    ]) {
      expect(reply.status).toBe(HttpStatus.NOT_FOUND);
    }
    const kept = await documentOf(owner(), designId);
    expect(kept.body.version).toBe(1);
    expect(kept.body.document.picture).toBe('sky');
  });

  it('a lead marked lost gives no turn to edit and takes no save of its design', async () => {
    const made = await aDesign(owner(), await aLead(owner()));
    const lost = await owner().call('POST', `/leads/${made.subject.leadId}/lost`, {
      reason: 'price',
      capturedAt: new Date().toISOString(),
    });
    expect(lost.status).toBe(HttpStatus.OK);
    const turn = await takeTurn(owner(), made.design.id);
    expect(turn.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(turn)).toBe('host_closed');
    const refused = await saveDocument(owner(), made.design.id, 0);
    expect(refused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(refused)).toBe('host_closed');
    expect((await documentOf(owner(), made.design.id)).status).toBe(HttpStatus.OK);
  });

  it('a document of a shape the studio does not know is refused field by field', async () => {
    const designId = await aSitedDesign();
    const reply = await owner().call('PUT', `/designs/${designId}/document`, {
      baseVersion: 0,
      document: { ...EMPTY_STUDIO_DOCUMENT, schemaVersion: 2, roofs: [] },
    });
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect((await documentOf(owner(), designId)).body.version).toBe(0);
  });

  it('the sky picture is fetched for the site and travels as the image; a place with none says why', async () => {
    const designId = await aSitedDesign();
    const picture = await skyPictureOf(owner(), designId);
    expect(picture.status).toBe(HttpStatus.OK);
    expect(picture.body).toMatchObject({
      kind: 'picture',
      source: 'google',
      takenOn: '2025-10-17',
      pieces: [{ image: expect.stringMatching(/^data:image\/png;base64,/), west: -50, east: 50 }],
      around: [{ image: expect.stringMatching(/^data:image\/png;base64,/), west: -200, east: 200 }],
    });
    const uncovered = await aDesign(owner(), await aLead(owner()));
    await saveSite(
      owner(),
      uncovered.design.id,
      aSite({ pin: { latitude: uncoveredLatitude, longitude: 74.5966 } }),
    );
    expect((await skyPictureOf(owner(), uncovered.design.id)).body).toEqual({
      kind: 'none',
      gap: 'not_covered',
    });
    const unsited = await aDesign(owner(), await aLead(owner()));
    expect((await skyPictureOf(owner(), unsited.design.id)).body).toEqual({
      kind: 'none',
      gap: 'not_covered',
    });
  });
});
