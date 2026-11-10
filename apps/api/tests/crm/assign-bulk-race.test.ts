import type { BulkAssigned } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { aLeadBy, assignOne, ownerOf, trailOf } from './assign-support';
import { aStaffedCompany, type CrmWorld, openCrmWorld, preset } from './support';

/**
 * A selection sent from the inbox while someone takes one of its leads (`M02-29`, `M02-67`), as a
 * Sales Manager sends it: the taking moves the lead out of their scope, and their selection still
 * names who took it — never unavailable, never assigned over the winner — and assigns the rest.
 */

const here = aStaffedCompany('Bulk Race EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  rajesh: [preset.sales_executive],
  sunita: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'BULK ASSIGN RACE PROOF',
  'A selection that loses a lead to a race is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)(
  'a bulk assign that loses a race, over HTTP against a migrated database',
  () => {
    let world: CrmWorld;
    const owner = () => world.as(here.members.owner);
    const manager = () => world.as(here.members.manager);
    const person = (who: keyof typeof here.people) => here.people[who].userId;

    beforeAll(async () => {
      world = await openCrmWorld([here]);
    });

    afterAll(async () => {
      await world.close();
    });

    it("a Sales Manager's selection that loses a lead to a race names who took it", async () => {
      const contested = await aLeadBy(owner(), 'Contested Lead');
      const waiting = await aLeadBy(owner(), 'Waiting Lead');
      // The owner's tap waits first and wins; the manager's selection waits behind it.
      const held = await holdLock(sql`select 1 from lead where id = ${contested} for update`);
      const tap = assignOne(owner(), contested, person('rajesh'), null);
      await held.waitForWaiters(1);
      const selection = manager().call<BulkAssigned>('POST', '/leads/assign', {
        leadIds: [contested, waiting],
        assigneeId: person('sunita'),
      });
      await held.waitForWaiters(2);
      await held.release();

      expect((await tap).status).toBe(HttpStatus.OK);
      const sent = await selection;
      expect({ status: sent.status, results: sent.body.results }).toEqual({
        status: HttpStatus.OK,
        results: [
          {
            leadId: contested,
            outcome: 'already_assigned',
            owner: { userId: person('rajesh'), name: 'rajesh' },
          },
          { leadId: waiting, outcome: 'assigned' },
        ],
      });
      expect([await ownerOf(world, contested), await ownerOf(world, waiting)]).toEqual([
        person('rajesh'),
        person('sunita'),
      ]);
      expect(await trailOf(world, contested)).toHaveLength(1);
    });
  },
);
