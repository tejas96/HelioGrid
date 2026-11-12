import { TARGET_MONTH_NOT_CURRENT } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditEntriesOf } from '../crm/support';
import {
  aStaffedCompany,
  type Caller,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
} from '../projects/support';
import { skipWithoutDatabase } from '../support/fixture';
import { dashboardOf, lastMonth, thisMonth } from './support';

/**
 * The company's monthly target (`M13-17`): the EPC Owner sets and clears this month's inline; the
 * same target again writes and records nothing (`F4-07`); a Sales Manager reads it and never moves
 * it; another month is refused; another company never sees it.
 */

const here = aStaffedCompany('Target EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
});
const elsewhere = aStaffedCompany('Other Target EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'MONTHLY TARGET PROOF',
  'The company target is UNPROVEN on the wire in this run.',
);

const EVENT = 'settings.monthly_target_changed';

describe.skipIf(skip)('the company target, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const manager = () => world.as(here.members.manager);
  const setTarget = (caller: Caller, amount: string | null, month = thisMonth()) =>
    caller.call<{ target: { amount: string } | null }>('PUT', '/dashboards/target', {
      month,
      amount,
    });
  const recorded = async () => (await auditEntriesOf(world, here.company.tenantId, EVENT)).length;

  beforeAll(async () => {
    world = await openProjectsWorld([here, elsewhere]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the EPC Owner sets this month’s target; the same target again records nothing', async () => {
    const set = await setTarget(owner(), '500000.00');
    expect(set.status).toBe(HttpStatus.OK);
    expect(set.body).toEqual({ target: { amount: '500000.00' } });
    expect(await recorded()).toBe(1);
    const again = await setTarget(owner(), '500000.00');
    expect(again.body).toEqual(set.body);
    expect(await recorded()).toBe(1);
    expect((await dashboardOf(owner())).target).toEqual({ amount: '500000.00' });
    expect(await dashboardOf(manager())).toMatchObject({
      target: { amount: '500000.00' },
      canSetTarget: false,
    });
    expect((await dashboardOf(world.as(elsewhere.members.owner))).target).toBeNull();
  });

  it('a changed target records once, and clearing it twice records once', async () => {
    await setTarget(owner(), '500000.00');
    const before = await recorded();
    await setTarget(owner(), '650000.00');
    expect(await recorded()).toBe(before + 1);
    const cleared = await setTarget(owner(), null);
    expect(cleared.body).toEqual({ target: null });
    expect(await recorded()).toBe(before + 2);
    await setTarget(owner(), null);
    expect(await recorded()).toBe(before + 2);
    expect((await dashboardOf(owner())).target).toBeNull();
  });

  it('is not a Sales Manager’s to set', async () => {
    const before = await recorded();
    const refused = await setTarget(manager(), '100000.00');
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    expect(await recorded()).toBe(before);
  });

  it('refuses any month but this one', async () => {
    const refused = await setTarget(owner(), '100000.00', lastMonth());
    expect(refused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refused.body).toMatchObject({ error: { code: TARGET_MONTH_NOT_CURRENT } });
  });

  it('refuses a zero target on its field — clearing is null', async () => {
    const refused = await setTarget(owner(), '0.00');
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
    expect(refused.body).toMatchObject({
      error: { code: 'VALIDATION_FAILED', details: [{ path: 'amount' }] },
    });
  });

  it('refuses a target finer than the currency on its field, never a 500', async () => {
    const before = await recorded();
    const refused = await setTarget(owner(), '100000.123');
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
    expect(refused.body).toMatchObject({
      error: { code: 'VALIDATION_FAILED', details: [{ path: 'amount' }] },
    });
    expect(await recorded()).toBe(before);
  });
});
