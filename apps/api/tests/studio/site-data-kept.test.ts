import { ROOF_DATA_PORT } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FileCacheService } from '../../src/modules/file/file.public';
import type { MemoryRoofData } from '../../src/modules/studio/internal/roof-data.memory';
import { keys, snapped, snappedRadius } from '../../src/modules/studio/internal/site-data-kept';
import { skipWithoutDatabase } from '../support/fixture';
import { aRoof, costLinesOf, place, roofsSaved } from './site-data-support';
import {
  aDesign,
  aLead,
  aSite,
  aStaffedCompany,
  openStudioWorld,
  preset,
  type StudioWorld,
  saveSite,
  siteDataOf,
} from './support';

/**
 * What a site's data keeps and what it costs (`T-M05-002`, part g): a place asked once in 30 days,
 * a roof drawn near the house served from the map kept for it, an answer kept by another release's
 * shape asked again; each billed call one unbilled cost line; a person's openings capped a minute,
 * a campus counted once.
 */

const here = aStaffedCompany('Site Data Kept EPC', {
  owner: [FOUNDER_ROLE],
  looper: [preset.sales_manager],
  campus: [preset.sales_manager],
});

const skip = skipWithoutDatabase(
  'SITE DATA KEPT PROOF',
  'That a site’s height data is kept, capped and metered is UNPROVEN on the wire in this run.',
);

/** The cap is 12 openings a minute that ask Google: the thirteenth is past it. */
const PLACES_UNDER_CAP = 12;
/** A campus: roofs 30 m apart in a row, each in its own snapped cell and its own building call. */
const CAMPUS_ROOFS = 14;
const CAMPUS_APART_M = 30;
/** A roof drawn just past the pin's house, inside the call kept for the pin. */
const NEAR_ROOF_EAST_M = 20;
/** The call round the pin before any roof: 50 m (`site-groups.ts`). */
const PIN_CALL_M = 50;
/** A fresh place costs a building call and a height map call. */
const CALLS_A_PLACE = 2;

describe.skipIf(skip)(
  'What a site’s data keeps and costs, over HTTP against a migrated database',
  () => {
    let world: StudioWorld;
    const owner = () => world.as(here.members.owner);
    const memory = () => world.http.app.get(ROOF_DATA_PORT) as MemoryRoofData;

    beforeAll(async () => {
      world = await openStudioWorld([here]);
    });

    afterAll(async () => {
      await world.close();
    });

    async function aSitedDesign(pin = place()): Promise<string> {
      const made = await aDesign(owner(), await aLead(owner()));
      expect((await saveSite(owner(), made.design.id, aSite({ pin }))).status).toBe(HttpStatus.OK);
      return made.design.id;
    }

    it('a place is asked once: a second opening within 30 days makes no call and costs nothing', async () => {
      const pin = place();
      const first = await aSitedDesign(pin);
      const asked = memory().asked;
      await siteDataOf(owner(), first);
      const afterFirst = memory().asked;
      expect(afterFirst).toBeGreaterThan(asked);
      const second = await aSitedDesign(pin);
      expect((await siteDataOf(owner(), second)).body.source).toBe('google_solar');
      expect(memory().asked).toBe(afterFirst);
      expect(await costLinesOf(world, second)).toEqual([]);
    });

    it('each billed call is one unbilled solar_imagery cost line against the design', async () => {
      const designId = await aSitedDesign();
      await siteDataOf(owner(), designId);
      const lines = await costLinesOf(world, designId);
      expect(lines).toHaveLength(CALLS_A_PLACE);
      for (const line of lines)
        expect(line).toMatchObject({ meter: 'solar_imagery', billable: false });
    });

    it('a campus of many roofs counts as one opening against the cap, and gets its heights', async () => {
      const designId = await aSitedDesign();
      const roofs = Array.from({ length: CAMPUS_ROOFS }, (_, i) => aRoof(i * CAMPUS_APART_M, 0));
      await roofsSaved(owner(), designId, roofs);
      const data = (await siteDataOf(world.as(here.members.campus), designId)).body;
      expect(data.gaps).not.toContain('capped');
      expect(data.source).toBe('google_solar');
      expect(data.areas.length).toBeGreaterThan(1);
    });

    it('a roof drawn near the pin reuses the map kept for it: only its building is asked', async () => {
      const designId = await aSitedDesign();
      await siteDataOf(owner(), designId);
      await roofsSaved(owner(), designId, [aRoof(NEAR_ROOF_EAST_M, 0)]);
      const asked = memory().asked;
      expect((await siteDataOf(owner(), designId)).body.source).toBe('google_solar');
      expect(memory().asked - asked).toBe(1);
    });

    it('an answer kept by a release of another shape is asked again, never served', async () => {
      const pin = place();
      const designId = await aSitedDesign(pin);
      const kept = world.http.app.get(FileCacheService);
      const call = snapped(pin);
      await kept.keep(keys.heightMap(call, snappedRadius(PIN_CALL_M), false), {
        v: 0,
        keptAt: Date.now(),
      });
      await kept.keep(keys.building(pin), { v: 0, keptAt: Date.now(), answer: null });
      const asked = memory().asked;
      expect((await siteDataOf(owner(), designId)).body.source).toBe('google_solar');
      expect(memory().asked - asked).toBe(2);
    });

    it('a person’s openings are capped a minute: past the cap the data says so and Google is not asked', async () => {
      const looper = world.as(here.members.looper);
      const designs: string[] = [];
      for (let i = 0; i <= PLACES_UNDER_CAP; i += 1) {
        const made = await aDesign(owner(), await aLead(owner()));
        await saveSite(owner(), made.design.id, aSite({ pin: place() }));
        designs.push(made.design.id);
      }
      const gaps: string[][] = [];
      for (const designId of designs) gaps.push((await siteDataOf(looper, designId)).body.gaps);
      expect(gaps.slice(0, PLACES_UNDER_CAP).every((one) => !one.includes('capped'))).toBe(true);
      expect(gaps[PLACES_UNDER_CAP]).toContain('capped');
    });
  },
);
