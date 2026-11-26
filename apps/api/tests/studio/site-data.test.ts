import { ROOF_DATA_PORT } from '@heliogrid/contracts';
import { coordinateOf, FOUNDER_ROLE } from '@heliogrid/domain';
import { gridFromWire, heightAt } from '@heliogrid/domain/studio-kernel';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type MemoryRoofData,
  memorySite,
  sharpestLongitude,
  unansweredLatitude,
} from '../../src/modules/studio/internal/roof-data.memory';
import { surroundsUnansweredLongitude } from '../../src/modules/studio/internal/site-surrounds.memory';
import { uncoveredLatitude } from '../../src/modules/studio/internal/sky-picture-source.memory';
import { skipWithoutDatabase } from '../support/fixture';
import { costLinesOf, place } from './site-data-support';
import {
  aDesign,
  aLead,
  aSite,
  aStaffedCompany,
  documentOf,
  openStudioWorld,
  ownLead,
  preset,
  type StudioWorld,
  saveSite,
  siteDataOf,
  skyPictureOf,
} from './support';

/**
 * A design's site data over HTTP (`T-M05-002`, part g): every member who reads the lead reads it;
 * another company and a lead out of scope find no design. Google's height map at the site, its
 * buildings and eaves and faces; where Google has none, OpenStreetMap's outlines; the far hills,
 * the time zone and the credits; each source that does not answer said in the gaps. What is kept
 * and capped is `site-data-kept.test.ts`'s.
 */

const here = aStaffedCompany('Site Data EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
  other: [preset.sales_executive],
  pm: [preset.project_manager],
  accounts: [preset.finance],
  looper: [preset.sales_manager],
  campus: [preset.sales_manager],
});
const there = aStaffedCompany('Site Data Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'SITE DATA PROOF',
  'Who reads a site’s height data, the fallbacks and the cost lines are UNPROVEN on the wire in this run.',
);

/** The memory site's grid, its walls and its ridge of far hills (`roof-data.memory.ts`). */
const MEMORY_STEP_M = 0.5;
const MEMORY_EAVES_MIN = 6;
const MEMORY_RIDGE_DEG = 12;
/** A second pin this far east of the first, inside the first's kept cell. */
const BESIDE_M = 3;
/** The memory house's east wall, from the pin it stands round. */
const HOUSE_EAST_EDGE_M = 6;

describe.skipIf(skip)('A design’s site data, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const memory = () => world.http.app.get(ROOF_DATA_PORT) as MemoryRoofData;

  beforeAll(async () => {
    world = await openStudioWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  async function aSitedDesign(pin = place()): Promise<string> {
    const made = await aDesign(owner(), await aLead(owner()));
    expect((await saveSite(owner(), made.design.id, aSite({ pin }))).status).toBe(HttpStatus.OK);
    return made.design.id;
  }

  it('Google’s height map: the house at its height above the datum, its buildings, eaves and faces', async () => {
    const reply = await siteDataOf(owner(), await aSitedDesign());
    expect(reply.status).toBe(HttpStatus.OK);
    const data = reply.body;
    expect(data).toMatchObject({
      source: 'google_solar',
      quality: 'base',
      dataOn: '2025-10-17',
      timeZone: 'Asia/Kolkata',
      credits: ['google_solar', 'pvgis'],
      gaps: [],
    });
    const [area] = data.areas;
    const grid = area === undefined ? null : gridFromWire(area.grid);
    expect(grid?.stepM).toBe(MEMORY_STEP_M);
    expect(
      heightAt(
        grid ?? { west: 0, south: 0, stepM: 1, cols: 0, rows: 0, heights: new Float32Array() },
        { east: 0, north: 0 },
      ),
    ).toBeCloseTo(memorySite.deckM, 1);
    expect(data.buildings).toHaveLength(2);
    expect(data.eaves.length).toBeGreaterThanOrEqual(MEMORY_EAVES_MIN);
    expect(data.faces).toEqual([expect.objectContaining({ slopeDeg: 1, facingDeg: 180 })]);
    expect(data.faces[0]?.heightM).toBeCloseTo(memorySite.deckM, 1);
    expect(data.straightDown).not.toBeNull();
    expect(data.farHorizon?.stepDeg).toBe(2);
    expect(Math.max(...(data.farHorizon?.elevationsDeg ?? []))).toBe(MEMORY_RIDGE_DEG);
  });

  it('where Google holds nothing: OpenStreetMap’s outline with its floors, and nothing billed', async () => {
    const designId = await aSitedDesign(place(uncoveredLatitude));
    const data = (await siteDataOf(owner(), designId)).body;
    expect(data).toMatchObject({
      source: 'openstreetmap',
      quality: null,
      areas: [],
      credits: ['openstreetmap'],
      gaps: ['heights_not_covered'],
      farHorizon: null,
    });
    expect(data.buildings).toEqual([expect.objectContaining({ floorsAbove: 2, heightM: null })]);
    expect(await costLinesOf(world, designId)).toEqual([]);
  });

  it('Google not answering: said, and the outlines stand in', async () => {
    const data = (await siteDataOf(owner(), await aSitedDesign(place(unansweredLatitude)))).body;
    expect(data.gaps).toContain('heights_not_answered');
    expect(data.source).toBe('none');
  });

  it('neither the outlines nor the far hills answering: each said, nothing waits', async () => {
    const data = (
      await siteDataOf(
        owner(),
        await aSitedDesign(place(uncoveredLatitude, surroundsUnansweredLongitude)),
      )
    ).body;
    expect(data.source).toBe('none');
    expect(data.gaps).toEqual(
      expect.arrayContaining([
        'heights_not_covered',
        'outlines_not_answered',
        'horizon_not_answered',
      ]),
    );
    expect(data.farHorizon).toBeNull();
  });

  it('a sharp map kept for one pin is laid where it was read for a pin a few metres off', async () => {
    const first = { latitude: 48.14, longitude: sharpestLongitude };
    await siteDataOf(owner(), await aSitedDesign(first));
    const second = coordinateOf(first, { east: BESIDE_M, north: 0 });
    const asked = memory().asked;
    const data = (await siteDataOf(owner(), await aSitedDesign(second))).body;
    const [area] = data.areas;
    const grid = area === undefined ? null : gridFromWire(area.grid);
    expect(grid).not.toBeNull();
    if (grid === null) return;
    // The memory house stands round the first pin: here it is BESIDE_M to the west.
    expect(heightAt(grid, { east: -BESIDE_M, north: 0 })).toBeCloseTo(memorySite.deckM, 1);
    expect(heightAt(grid, { east: HOUSE_EAST_EDGE_M - BESIDE_M + 1, north: 0 })).toBeLessThan(1);
    expect(memory().asked - asked).toBe(1);
  });

  it('the straight-down picture of a sharp site comes from the map kept for its pin', async () => {
    // A sharp map is kept at its group's own middle, never at the pin's snapped cell.
    const designId = await aSitedDesign({ latitude: 48.16, longitude: sharpestLongitude });
    await siteDataOf(owner(), designId);
    const picture = await skyPictureOf(owner(), designId, 'straight_down');
    expect(picture.status).toBe(HttpStatus.OK);
    expect(picture.body.kind).toBe('picture');
  });

  it('a design with no place has no data, and says so', async () => {
    const made = await aDesign(owner(), await aLead(owner()));
    expect((await siteDataOf(owner(), made.design.id)).body).toMatchObject({
      source: 'none',
      gaps: ['heights_not_covered'],
    });
  });

  it('a Sales Manager reads it, as every member who reads the lead does', async () => {
    const reply = await siteDataOf(world.as(here.members.looper), await aSitedDesign());
    expect(reply.status).toBe(HttpStatus.OK);
  });

  it.each([
    ['a Project Manager', 'pm'],
    ['Finance', 'accounts'],
  ] as const)(
    '%s, whose presets reach no lead before its project, finds no design, as with its document',
    async (_, name) => {
      const designId = await aSitedDesign();
      const caller = world.as(here.members[name]);
      expect((await siteDataOf(caller, designId)).status).toBe(HttpStatus.NOT_FOUND);
      expect((await documentOf(caller, designId)).status).toBe(HttpStatus.NOT_FOUND);
    },
  );

  it('a Sales Executive reads the data of a lead they own, and finds no design of one they do not', async () => {
    const mine = await aSitedDesign();
    const theirs = await aSitedDesign();
    const seller = world.as(here.members.seller);
    const { subject: mineSubject } = await aDesignOf(mine);
    const { subject: theirsSubject } = await aDesignOf(theirs);
    await ownLead(world, mineSubject.leadId, here.people.seller.userId);
    await ownLead(world, theirsSubject.leadId, here.people.other.userId);
    expect((await siteDataOf(seller, mine)).status).toBe(HttpStatus.OK);
    expect((await siteDataOf(seller, theirs)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it("another company's design is not found, and asks no source", async () => {
    const designId = await aSitedDesign();
    const asked = memory().asked;
    expect((await siteDataOf(world.as(there.members.owner), designId)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
    expect(memory().asked).toBe(asked);
  });

  /** The lead a design hangs on, read back from the route. */
  async function aDesignOf(designId: string) {
    const reply = await owner().call<{ subject: { leadId: string } }>(
      'GET',
      `/designs/${designId}`,
    );
    return reply.body;
  }
});
