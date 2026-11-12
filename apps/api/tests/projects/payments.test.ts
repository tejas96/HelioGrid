import type { ProjectPayments } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aProjectAt,
  freshUtr,
  payKey,
  paymentsOf,
  recordPayment,
  spaced,
  wonAt,
} from './payments-support';
import {
  aStaffedCompany,
  boardOf,
  dayFromToday,
  detailOf,
  now,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
  refusalOf,
  walk,
} from './support';

/**
 * A project's money acts on the wire (`M11`, owner rulings 2026-11-10 and 2026-11-11): the
 * schedule made at Mark won from the company's payment terms, money recorded by hand with its UTR
 * guarded against reuse, part payments, retries, reversals and waivers with their reasons, and each
 * part falling due when its stage is reached.
 */

const here = aStaffedCompany('Project Payments EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  finance: [preset.finance],
  installer: [preset.installation_team_member],
});

const skip = skipWithoutDatabase(
  'PROJECT PAYMENTS PROOF',
  'A project’s money is UNPROVEN on the wire in this run.',
);

/** A part payment, in rupees. */
const partPayment = 5000;

describe.skipIf(skip)('a project’s money acts, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const finance = () => world.as(here.members.finance);
  const _installer = () => world.as(here.members.installer);
  const ownerId = () => here.people.owner.userId;
  const aProject = (finalValue?: string) => aProjectAt(owner(), ownerId(), finalValue);
  const record = recordPayment;
  const key = payKey;

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('makes the schedule at Mark won from the default terms, summing to the final value (M11-08)', async () => {
    const projectId = await aProject();
    const payments = await paymentsOf(owner(), projectId);
    const total = payments.parts.reduce((sum, part) => sum + Number(part.amount), 0);
    expect(total).toBe(wonAt);
    expect(payments.money).toMatchObject({ total: '450000.00', collected: '0.00' });
    expect(payments.parts[0]).toMatchObject({ dueOnStage: 'won', state: 'due' });
    expect(payments.parts.slice(1).every((part) => part.state === 'upcoming')).toBe(true);
    expect(payments.money.toCollect).toBe(payments.parts[0]?.amount);
    expect(payments.requests[0]).toMatchObject({ partId: payments.parts[0]?.id, upiUri: null });
    expect(payments.modes).toEqual(['upi', 'neft', 'cheque', 'cash']);
  });

  it('records a payment, numbers its receipt and clears the part (M11-34, M11-41)', async () => {
    const projectId = await aProject();
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reply = await record(finance(), projectId, {
      partId: first?.id,
      amount: first?.amount,
      reference: '4321 8765 3390',
    });
    expect(reply.status).toBe(HttpStatus.CREATED);
    expect(reply.body.parts[0]).toMatchObject({ state: 'received', outstanding: '0.00' });
    expect(reply.body.entries[0]).toMatchObject({
      kind: 'payment',
      reference: '4321 8765 3390',
      receiptNumber: expect.stringMatching(/^RCPT-\d{4,}$/),
      recordedBy: { userId: here.people.finance.userId },
      reversed: false,
    });
  });

  it('refuses a UTR already on a receipt that stands, however it is typed', async () => {
    const projectId = await aProject();
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reference = freshUtr('9');
    await record(owner(), projectId, { partId: first?.id, amount: '1000.00', reference });
    const again = await record(owner(), projectId, {
      partId: first?.id,
      amount: '1000.00',
      reference: spaced(reference),
    });
    expect(again.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(again)).toBe('reference_used');
  });

  it('a part payment leaves the part part-received with the rest stated (M11-36)', async () => {
    const projectId = await aProject();
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reply = await record(owner(), projectId, {
      partId: first?.id,
      amount: partPayment.toFixed(2),
    });
    expect(reply.body.parts[0]).toMatchObject({
      state: 'part_received',
      outstanding: (Number(first?.amount) - partPayment).toFixed(2),
    });
  });

  it('a retry with the same key answers the first recording and writes once (F4-07)', async () => {
    const projectId = await aProject();
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const same = key();
    const body = { partId: first?.id, amount: '2000.00', capturedAt: now() };
    await record(owner(), projectId, body, same);
    const retried = await record(owner(), projectId, body, same);
    expect(retried.status).toBe(HttpStatus.CREATED);
    expect(retried.body.entries).toHaveLength(1);
    const reused = await record(owner(), projectId, { ...body, amount: '3000.00' }, same);
    expect(reused.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it.each([
    ['nothing', { amount: '0.00' }, 'amount_not_positive'],
    ['a mode the market does not declare', { mode: 'payment_link' }, 'mode_unknown'],
    ['money that arrives tomorrow', { receivedOn: dayFromToday(1) }, 'date_in_future'],
  ])('refuses %s', async (_, typed, refusal) => {
    const projectId = await aProject();
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reply = await record(owner(), projectId, {
      partId: first?.id,
      amount: '100.00',
      ...typed,
    });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe(refusal);
    expect((await paymentsOf(owner(), projectId)).entries).toHaveLength(0);
  });

  it('a reversal takes the money back, keeps both rows and frees the UTR (M11-46, M11-47)', async () => {
    const projectId = await aProject();
    const [first] = (await paymentsOf(owner(), projectId)).parts;
    const reference = freshUtr('7');
    const paid = await record(owner(), projectId, {
      partId: first?.id,
      amount: first?.amount,
      reference,
    });
    const entryId = paid.body.entries[0]?.id;
    const reversed = await owner().call<ProjectPayments>(
      'POST',
      `/projects/${projectId}/payments/${entryId}/reverse`,
      { reason: 'Recorded on the wrong project', capturedAt: now() },
    );
    expect(reversed.status).toBe(HttpStatus.OK);
    expect(reversed.body.parts[0]).toMatchObject({ state: 'due', received: '0.00' });
    expect(reversed.body.entries).toHaveLength(2);
    expect(reversed.body.entries[0]).toMatchObject({ reversed: true });
    expect(reversed.body.entries[1]).toMatchObject({
      kind: 'reversal',
      reversesId: entryId,
      reason: 'Recorded on the wrong project',
    });
    const twice = await owner().call('POST', `/projects/${projectId}/payments/${entryId}/reverse`, {
      reason: 'again',
      capturedAt: now(),
    });
    expect(twice.status, JSON.stringify(twice.body)).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(twice)).toBe('already_reversed');
    const reRecorded = await record(owner(), projectId, {
      partId: first?.id,
      amount: '10.00',
      reference,
    });
    expect(reRecorded.status).toBe(HttpStatus.CREATED);
  });

  it('a waived part leaves what is owed and takes no more money (M11-49)', async () => {
    const projectId = await aProject();
    const parts = (await paymentsOf(owner(), projectId)).parts;
    const last = parts.at(-1);
    const waived = await owner().call<ProjectPayments>(
      'POST',
      `/projects/${projectId}/parts/${last?.id}/waive`,
      { reason: 'Customer discount', capturedAt: now() },
    );
    expect(waived.body.parts.at(-1)).toMatchObject({
      state: 'waived',
      outstanding: '0.00',
      waived: { reason: 'Customer discount', by: { userId: ownerId() } },
    });
    const paid = await record(owner(), projectId, { partId: last?.id, amount: '10.00' });
    expect(refusalOf(paid)).toBe('tranche_waived');
  });

  it('a part falls due when its stage is reached and the board asks for the money (M11-11, M11-53)', async () => {
    const projectId = await aProject();
    const [first, second] = (await paymentsOf(owner(), projectId)).parts;
    await record(owner(), projectId, { partId: first?.id, amount: first?.amount });
    expect((await detailOf(owner(), projectId)).body.money?.duePart).toBeNull();
    await walk(owner(), projectId, ['material_ordered']);
    const detail = (await detailOf(owner(), projectId)).body;
    expect(detail.money?.duePart).toMatchObject({ id: second?.id, outstanding: second?.amount });
    const card = (await boardOf(owner())).live.find((one) => one.id === projectId);
    expect(card).toMatchObject({ todo: 'money_due', money: { duePart: { id: second?.id } } });
  });
});
