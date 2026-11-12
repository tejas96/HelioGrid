import { randomUUID } from 'node:crypto';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditEntriesOf, retryKey } from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aLead,
  aStaffedCompany,
  aWin,
  aWonProject,
  boardOf,
  dayFromToday,
  detailOf,
  markWon,
  openProjectsWorld,
  ownLead,
  type ProjectsWorld,
  preset,
  type Refused,
  SEEDED_STEPS,
  seededRowsOf,
} from './support';

/**
 * *Mark won* on the wire (`M07-62`, `M08-02`…`M08-05`): the lead is won and its project exists in
 * the same act, numbered by the company's counter, its checklist and install steps seeded from the
 * pack in force — and a win the lead, the manager or the value does not allow is refused.
 */

const here = aStaffedCompany('Mark Won EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  seller: [preset.sales_executive],
});
const there = aStaffedCompany('Mark Won Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'MARK WON PROOF',
  'Mark won and the project it creates are UNPROVEN on the wire in this run.',
);

const sequenceOf = (number: string) => Number(number.replace(/^PRJ-/, ''));

describe.skipIf(skip)('Mark won, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;

  beforeAll(async () => {
    world = await openProjectsWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('creates the project at Won with its number, ten checklist rows and six steps', async () => {
    const leadId = await aLead(owner(), 'residential');
    const reply = await markWon(owner(), leadId, aWin(ownerId()));
    expect(reply.status).toBe(HttpStatus.CREATED);
    expect(reply.body.number).toMatch(/^PRJ-\d{4,}$/);
    const board = await boardOf(owner());
    expect(board.live.find((card) => card.id === reply.body.projectId)).toMatchObject({
      number: reply.body.number,
      stage: 'won',
      segment: 'residential',
      manager: { userId: ownerId() },
      steps: { ticked: 0, total: 6 },
      wait: null,
    });
    const detail = (await detailOf(owner(), reply.body.projectId)).body;
    expect(detail).toMatchObject({ leadId, stage: 'won', incentiveApplies: true });
    expect(detail.documents).toHaveLength(seededRowsOf('residential'));
    expect(detail.documents.every((row) => row.state === 'pending')).toBe(true);
    expect(detail.documents.map((row) => row.row)).toContain('incentive_application');
    expect(detail.steps).toHaveLength(SEEDED_STEPS);
    expect(detail.journey).toMatchObject([{ from: null, to: 'won', cause: 'person' }]);
    const audited = await auditEntriesOf(world, here.company.tenantId, 'projects.project_won');
    expect(audited.filter((one) => one.subjectRef === reply.body.projectId)).toMatchObject([
      { subjectKind: 'project', actorRef: ownerId(), blocked: false },
    ]);
  });

  it('a commercial deal drops the incentive row and walks no incentive stage', async () => {
    const won = await aWonProject(owner(), ownerId(), 'commercial');
    const detail = (await detailOf(owner(), won.projectId)).body;
    expect(detail.incentiveApplies).toBe(false);
    expect(detail.documents).toHaveLength(seededRowsOf('commercial'));
    expect(detail.documents.map((row) => row.row)).not.toContain('incentive_application');
    expect(detail.steps).toHaveLength(SEEDED_STEPS);
  });

  it('two projects in one company take consecutive numbers', async () => {
    const first = await aWonProject(owner(), ownerId());
    const second = await aWonProject(owner(), ownerId());
    expect(sequenceOf(second.number)).toBe(sequenceOf(first.number) + 1);
  });

  it('winning a won lead again is refused, and no second project is made', async () => {
    const won = await aWonProject(owner(), ownerId());
    const again = await markWon(owner(), won.leadId, aWin(ownerId()));
    expect(again.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect((again.body as unknown as Refused).error).toMatchObject({
      code: 'LEAD_TRANSITION_REFUSED',
      facts: { refusal: 'stage_reached' },
    });
    const board = await boardOf(owner());
    expect(board.live.filter((card) => card.number === won.number)).toHaveLength(1);
  });

  it('a retry of the same win with its key answers the project the first send made', async () => {
    const leadId = await aLead(owner());
    const key = retryKey();
    const win = aWin(ownerId());
    const first = await markWon(owner(), leadId, win, key);
    expect(first.status).toBe(HttpStatus.CREATED);
    const retried = await markWon(owner(), leadId, win, key);
    expect(retried.status).toBe(HttpStatus.CREATED);
    expect(retried.body).toEqual(first.body);
  });

  it('the same key on a different win is refused, and nothing is made twice', async () => {
    const leadId = await aLead(owner());
    const key = retryKey();
    expect((await markWon(owner(), leadId, aWin(ownerId()), key)).status).toBe(HttpStatus.CREATED);
    const other = await markWon(owner(), leadId, { ...aWin(ownerId()), finalValue: '1' }, key);
    expect(other.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(other.body).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REUSED' } });
  });

  it.each([
    ['a sales executive', () => here.people.seller.userId],
    ['nobody in the company', () => randomUUID()],
  ])('a manager who is %s is refused on managerId', async (_who, managerId) => {
    const leadId = await aLead(owner());
    const reply = await markWon(owner(), leadId, aWin(managerId()));
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      error: { code: 'VALIDATION_FAILED', details: [{ path: 'managerId' }] },
    });
  });

  it('a project manager may manage the project the owner wins', async () => {
    const leadId = await aLead(owner());
    const reply = await markWon(owner(), leadId, aWin(here.people.pm.userId));
    expect(reply.status).toBe(HttpStatus.CREATED);
  });

  it('a final value finer than the currency is refused on finalValue', async () => {
    const leadId = await aLead(owner());
    const reply = await markWon(owner(), leadId, aWin(ownerId(), { finalValue: '450000.125' }));
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      error: { code: 'VALIDATION_FAILED', details: [{ path: 'finalValue' }] },
    });
  });

  it.each([
    ['0', 'finalValue'],
    ['0.00', 'finalValue'],
  ] as const)(
    'a final value of %s is refused on %s — a won deal is worth something',
    async (finalValue, path) => {
      const leadId = await aLead(owner());
      const reply = await markWon(owner(), leadId, aWin(ownerId(), { finalValue }));
      expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
      expect(reply.body).toMatchObject({
        error: { code: 'VALIDATION_FAILED', details: [{ path }] },
      });
    },
  );

  it.each([
    [-1, HttpStatus.BAD_REQUEST],
    [0, HttpStatus.CREATED],
  ] as const)('an install date %i days from today answers %i', async (days, status) => {
    const leadId = await aLead(owner());
    const win = aWin(ownerId(), { expectedInstallOn: dayFromToday(days) });
    const reply = await markWon(owner(), leadId, win);
    expect(reply.status).toBe(status);
    if (status === HttpStatus.BAD_REQUEST) {
      expect(reply.body).toMatchObject({
        error: { code: 'VALIDATION_FAILED', details: [{ path: 'expectedInstallOn' }] },
      });
    }
  });

  it('a sales executive may win the lead they own; a project manager may not win', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const refused = await markWon(world.as(here.members.pm), leadId, aWin(ownerId()));
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    const won = await markWon(world.as(here.members.seller), leadId, aWin(ownerId()));
    expect(won.status).toBe(HttpStatus.CREATED);
    const detail = (await detailOf(owner(), won.body.projectId)).body;
    expect(detail.soldBy).toMatchObject({ userId: here.people.seller.userId });
  });

  it("another company's lead is not found", async () => {
    const leadId = await aLead(owner());
    const reply = await markWon(
      world.as(there.members.owner),
      leadId,
      aWin(there.people.owner.userId),
    );
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
  });
});
