import { entitlement } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  acted,
  aLead,
  aStaffedCompany,
  aWin,
  aWonProject,
  markWon,
  openProjectsWorld,
  type ProjectsWorld,
} from './support';

/**
 * The plan's active-project cap at *Mark won* (`M08-07`, `T-M12-009`'s gate): creating a project
 * past it is refused with the upgrade path; a live project keeps working whatever the plan; and two
 * wins at once take turns on the company's counter, so the cap counts each once.
 */

const here = aStaffedCompany('Project Cap EPC', { owner: [FOUNDER_ROLE] });
/** A company that has never won a deal: no counter row until its first win. */
const fresh = aStaffedCompany('Project First Win EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROJECT CAP PROOF',
  'The active-project cap at Mark won is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the active-project cap at Mark won, over HTTP (M08-07)', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;
  /** The company's plan holds `limit` live projects — written as the plan moves write it. */
  const capAt = (limit: number, company = here) =>
    world.pools.admin.db
      .insert(entitlement)
      .values({
        tenantId: company.company.tenantId,
        entitlementKey: 'active_projects',
        limitKind: 'count',
        limitValue: limit,
        source: 'plan',
        recomputedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [entitlement.tenantId, entitlement.entitlementKey],
        set: { limitValue: limit },
      });

  beforeAll(async () => {
    world = await openProjectsWorld([here, fresh]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a win past the cap is refused with the upgrade path, and the live project keeps working', async () => {
    const live = await aWonProject(owner(), ownerId());
    await capAt(1);
    const refused = await markWon(owner(), await aLead(owner()), aWin(ownerId()));
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    expect(refused.body).toMatchObject({
      error: {
        code: 'ENTITLEMENT_BLOCKED',
        blocked: { reason: 'cap', capability: 'sell_and_deliver', key: 'active_projects' },
      },
    });
    const moved = await acted(owner(), live.projectId, 'move', { to: 'material_ordered' });
    expect(moved.stage).toBe('material_ordered');
  });

  it('two wins at once with room for one: one starts its project, the other is refused', async () => {
    // One project is live from the case before: a cap of two leaves room for one more.
    await capAt(2);
    const first = await aLead(owner());
    const second = await aLead(owner());
    const held = await holdLock(
      sql`select 1 from tenant_counter where tenant_id = ${here.company.tenantId} and kind = 'project' for update`,
    );
    const both = Promise.all([
      markWon(owner(), first, aWin(ownerId())),
      markWon(owner(), second, aWin(ownerId())),
    ]);
    await held.waitForWaiters(2);
    await held.release();
    const statuses = (await both).map((reply) => reply.status).sort();
    expect(statuses).toEqual([HttpStatus.CREATED, HttpStatus.FORBIDDEN].sort());
  });

  it("a company's first two wins at once, with room for one: one starts its project, the other is refused", async () => {
    const owner = () => world.as(fresh.members.owner);
    const ownerId = fresh.people.owner.userId;
    await capAt(1, fresh);
    const first = await aLead(owner());
    const second = await aLead(owner());
    // Neither win finds a counter row: both make it, so the hold is on making it.
    const held = await holdLock(
      sql`insert into tenant_counter (tenant_id, kind, last_number) values (${fresh.company.tenantId}, 'project', 0)`,
    );
    const both = Promise.all([
      markWon(owner(), first, aWin(ownerId)),
      markWon(owner(), second, aWin(ownerId)),
    ]);
    await held.waitForWaiters(2);
    await held.release();
    const statuses = (await both).map((reply) => reply.status).sort();
    expect(statuses).toEqual([HttpStatus.CREATED, HttpStatus.FORBIDDEN].sort());
  });
});
