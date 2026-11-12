import { randomUUID } from 'node:crypto';
import type { MoneyDue } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { aProjectAt, payKey, paymentsOf, recordPayment } from './payments-support';
import {
  acted,
  aStaffedCompany,
  dayFromToday,
  detailOf,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
  walk,
} from './support';

/**
 * Who sees and asks for a project's money (`M11-53`, `M11-54`, `M11-56`): the request shared,
 * Money due across projects, the UPI request for exactly what is owed — and nothing for the crew.
 */

const here = aStaffedCompany('Project Money Reach EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  finance: [preset.finance],
  installer: [preset.installation_team_member],
});

const skip = skipWithoutDatabase(
  'PROJECT MONEY REACH PROOF',
  'A project’s money is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('who sees and asks for a project’s money, over HTTP', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const finance = () => world.as(here.members.finance);
  const installer = () => world.as(here.members.installer);
  const ownerId = () => here.people.owner.userId;
  const aProject = (finalValue?: string) => aProjectAt(owner(), ownerId(), finalValue);
  const record = recordPayment;
  const _key = payKey;

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('notes who shared a request, so nobody asks twice (ruling 2026-11-10)', async () => {
    const projectId = await aProject();
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const shared = await acted(owner(), projectId, `parts/${first?.id}/shared`);
    expect(shared).toMatchObject({});
    const after = await paymentsOf(owner(), projectId);
    expect(after.parts[0]?.lastShared).toMatchObject({ by: { userId: ownerId() } });
  });

  it('Money due lists every unpaid due part, longest waiting first (M11-54)', async () => {
    const projectId = await aProject();
    const due = (await finance().call<MoneyDue>('GET', '/payments/due?page=1&limit=100')).body;
    expect(due.rows.items.some((row) => row.projectId === projectId)).toBe(true);
    const days = due.rows.items.map((row) => row.dueOn);
    expect(days).toEqual([...days].sort());
  });

  it('shows the crew no money at all (M11-56)', async () => {
    const projectId = await aProject();
    await walk(owner(), projectId, ['material_ordered']);
    await acted(owner(), projectId, 'dispatch', {
      crew: [here.people.installer.userId],
      leftOn: dayFromToday(0),
    });
    const read = await installer().call('GET', `/projects/${projectId}/payments`);
    expect(read.status).toBe(HttpStatus.NOT_FOUND);
    expect((await detailOf(installer(), projectId)).body.money ?? null).toBeNull();
    const recorded = await record(installer(), projectId, { partId: randomUUID(), amount: '1.00' });
    expect(recorded.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('asks by UPI for exactly what is owed once the company has a UPI ID, and not above the limit', async () => {
    const saved = await owner().call('PUT', '/settings/collections', {
      upiId: 'payments.epc@okaxis',
      payee: 'Payments EPC',
    });
    expect(saved.status).toBe(HttpStatus.OK);
    const small = await paymentsOf(owner(), await aProject('450000.00'));
    expect(small.requests[0]?.upiUri).toContain(`am=${small.requests[0]?.amount}`);
    expect(small.requests[0]?.message.text).toContain('payments.epc@okaxis');
    const large = await paymentsOf(owner(), await aProject('30000000.00'));
    expect(large.requests[0]).toMatchObject({ overUpiLimit: true, upiUri: null });
    const malformed = await owner().call('PUT', '/settings/collections', {
      upiId: 'not-an-id',
      payee: 'Payments EPC',
    });
    expect(malformed.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    const byManager = await world.as(here.members.pm).call('GET', '/settings/collections');
    expect(byManager.status).toBe(HttpStatus.FORBIDDEN);
  });
});
