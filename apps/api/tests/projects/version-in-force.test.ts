import { lead, project } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aStaffedCompany,
  auditEntriesOf,
  openProposalsWorld,
  type ProposalsWorld,
  preset,
  refusalOf,
} from '../customer-link/support';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  aNewerVersion,
  aWonAcceptedDeal,
  type HandoffTeam,
  paise,
  previewOf,
  putInForce,
  sumOf,
} from './handoff-support';
import { paymentsOf, recordPayment } from './payments-support';
import { dayFromToday, detailOf } from './support';

/**
 * A newer proposal version put in force on a won deal, on the wire (`M08-50`, `M11-14`,
 * `T-M06-025`): the lead's owner or the project's manager records that the customer agreed; what
 * is paid stays with its receipts, the rest is the new version's plan to the paisa, and money
 * collected past the new total is stated as a surplus.
 */

const here = aStaffedCompany('Version In Force EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  seller: [preset.sales_executive],
  colleague: [preset.sales_executive],
});
const there = aStaffedCompany('Version In Force Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'VERSION IN FORCE PROOF',
  'A newer proposal version put in force on a project is UNPROVEN in this run.',
);

const NEW_TOTAL = '305000.00';
/** A total whose rest after the paid first part (₹2,30,942.50) the 60 / 20 / 10 shares round apart by a paisa. */
const UNEVEN_TOTAL = '250000.00';
/** A version the proposal never generated. */
const NO_SUCH_VERSION = 9;
/** How many of the plan's first parts the surplus proof pays in full. */
const PARTS_PAID = 2;
const WHOLE_PERCENT = 100;
/** The proposal's third version: generated after the surplus step put version 2 in force. */
const THIRD_VERSION = 3;

describe.skipIf(skip)('a version put in force, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const pm = () => world.as(here.members.pm);
  const seller = () => world.as(here.members.seller);
  const pmId = () => here.people.pm.userId;
  const db = () => world.pools.admin.db;
  const team = (): HandoffTeam => ({
    owner: owner(),
    seller: seller(),
    sellerId: here.people.seller.userId,
    managerId: pmId(),
  });

  beforeAll(async () => {
    world = await openProposalsWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  /** The deal won, its first part paid in full, and version 2 generated at a new price. */
  const aDealWithANewerVersion = async (newPrice = NEW_TOTAL) => {
    const deal = await aWonAcceptedDeal(world, team());
    const before = await paymentsOf(owner(), deal.projectId);
    const [first] = before.parts;
    if (first === undefined) throw new Error('the won deal has no schedule');
    const paid = await recordPayment(owner(), deal.projectId, {
      partId: first.id,
      amount: first.amount,
    });
    if (paid.status !== HttpStatus.CREATED) throw new Error(`record: got ${paid.status}`);
    await aNewerVersion(owner(), deal.proposalId, newPrice);
    return { ...deal, first, before };
  };

  it('previews the new total, what is paid and stays, and the plan for the rest — to the paisa', async () => {
    const deal = await aDealWithANewerVersion();
    const offered = (await detailOf(pm(), deal.projectId)).body;
    expect(offered.newerVersion).toBe(2);
    expect(offered.acts.versionInForce).toBe(true);

    const reply = await previewOf(pm(), deal.projectId, 2);
    expect(reply.status).toBe(HttpStatus.OK);
    const preview = reply.body;
    expect(preview).toMatchObject({
      version: 2,
      newTotal: NEW_TOTAL,
      paid: deal.first.amount,
      surplus: null,
    });
    expect(paise(preview.remaining)).toBe(paise(NEW_TOTAL) - paise(deal.first.amount));
    expect(preview.plan[0]).toMatchObject({
      label: deal.first.label,
      amount: deal.first.amount,
      state: 'paid',
    });
    expect(preview.plan.slice(1).every((part) => part.state === 'new')).toBe(true);
    expect(sumOf(preview.plan.map((part) => part.amount))).toBe(paise(NEW_TOTAL));
  });

  it('names when each part falls: the day a kept part was paid, a new part’s stage and share of the rest', async () => {
    const deal = await aDealWithANewerVersion();
    const { plan } = (await previewOf(pm(), deal.projectId, 2)).body;
    expect(plan[0]).toMatchObject({ paidOn: dayFromToday(0), shareOfRest: null });
    const fresh = plan.slice(1);
    expect(fresh.every((part) => part.paidOn === null && part.dueOnStage !== null)).toBe(true);
    // Every new part but the last says its share of what is left; the last takes the rest.
    expect(fresh.at(-1)?.shareOfRest).toBeNull();
    const shares = fresh.slice(0, -1).map((part) => Number(part.shareOfRest));
    expect(shares.every((share) => share > 0 && share < WHOLE_PERCENT)).toBe(true);
  });

  it('puts it in force: the paid part and its receipt stay, the rest is the new plan', async () => {
    const deal = await aDealWithANewerVersion();
    const preview = (await previewOf(pm(), deal.projectId, 2)).body;
    const reply = await putInForce(pm(), deal.projectId, 2);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.proposalVersion).toMatchObject({ version: 2 });
    expect(reply.body.newerVersion).toBeNull();
    expect(reply.body.acts.versionInForce).toBe(false);
    // The signed-proposal row now stands on the act that put v2 in force, and on whoever recorded it.
    const signed = reply.body.documents.find((one) => one.row === 'signed_proposal');
    expect(signed?.proof).toEqual({
      version: 2,
      linkLabel: null,
      at: expect.any(String),
      act: 'put_in_force',
    });
    expect(signed?.changedBy?.userId).toBe(pmId());

    const money = await paymentsOf(owner(), deal.projectId);
    expect(money.parts.map((part) => [part.label, part.amount])).toEqual(
      preview.plan.map((part) => [part.label, part.amount]),
    );
    expect(money.parts[0]).toMatchObject({
      id: deal.first.id,
      state: 'received',
      received: deal.first.amount,
    });
    expect(money.money.total).toBe(NEW_TOTAL);
    // The live plan is numbered 1…n over the parts in force; the replaced ones are not counted.
    expect(money.parts.map((part) => part.position)).toEqual(money.parts.map((_, at) => at + 1));
    // Every earlier receipt is still there (`M11-14`).
    expect(money.entries.filter((entry) => entry.kind === 'payment')).toHaveLength(1);
    // The earlier schedule remains viewable: its replaced parts, under the version they were, with
    // when and by whom they were replaced (`T-M06-025`, `M11-14`).
    const replaced = deal.before.parts.slice(1);
    expect(money.earlierPlans).toEqual([
      {
        version: 1,
        replacedAt: expect.any(String),
        replacedBy: expect.objectContaining({ userId: pmId() }),
        parts: replaced.map((part) => ({
          id: part.id,
          label: part.label,
          amount: part.amount,
          dueOnStage: part.dueOnStage,
        })),
      },
    ]);

    const audited = await auditEntriesOf(
      world,
      here.company.tenantId,
      'proposals.version_put_in_force',
    );
    expect(audited.some((entry) => entry.actorRef === pmId())).toBe(true);
  });

  it('splits what is left by shares that do not divide it, and the plan in force sums to the total to the paisa', async () => {
    const deal = await aDealWithANewerVersion(UNEVEN_TOTAL);
    expect((await putInForce(pm(), deal.projectId, 2)).status).toBe(HttpStatus.OK);
    const money = await paymentsOf(owner(), deal.projectId);
    const amounts = money.parts.map((part) => part.amount);
    // The shares leave paise on at least one new part: this total does not divide.
    expect(amounts.some((amount) => paise(amount) % paise('1.00') !== 0)).toBe(true);
    expect(sumOf(amounts)).toBe(paise(UNEVEN_TOTAL));
    expect(paise(money.money.total)).toBe(paise(UNEVEN_TOTAL));
    const owed = sumOf(money.parts.map((part) => part.outstanding));
    expect(paise(money.money.collected) + owed).toBe(paise(UNEVEN_TOTAL));
  });

  it('only the lead’s owner or the project’s manager may, and nobody from another company', async () => {
    const deal = await aDealWithANewerVersion();
    // The EPC Owner reaches the project, but is neither of the two the customer deals with.
    expect((await previewOf(owner(), deal.projectId, 2)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await putInForce(owner(), deal.projectId, 2)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await detailOf(owner(), deal.projectId)).body.acts.versionInForce).toBe(false);
    // A colleague's scope does not reach the deal at all.
    const colleague = world.as(here.members.colleague);
    expect((await previewOf(colleague, deal.projectId, 2)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await putInForce(colleague, deal.projectId, 2)).status).toBe(HttpStatus.NOT_FOUND);
    const stranger = world.as(there.members.owner);
    expect((await previewOf(stranger, deal.projectId, 2)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await putInForce(stranger, deal.projectId, 2)).status).toBe(HttpStatus.NOT_FOUND);
    // The lead's owner may.
    expect((await previewOf(seller(), deal.projectId, 2)).status).toBe(HttpStatus.OK);
    expect((await putInForce(seller(), deal.projectId, 2)).status).toBe(HttpStatus.OK);
  });

  it('refuses the version already in force and one the proposal does not hold', async () => {
    const deal = await aDealWithANewerVersion();
    const same = await putInForce(pm(), deal.projectId, 1);
    expect(same.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(same)).toBe('version_already_in_force');
    const unknown = await putInForce(pm(), deal.projectId, NO_SUCH_VERSION);
    expect(unknown.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(unknown)).toBe('version_unknown');
    expect((await previewOf(pm(), deal.projectId, NO_SUCH_VERSION)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  it('states a surplus when more was collected than the new total, and asks nothing new', async () => {
    const deal = await aWonAcceptedDeal(world, team());
    const before = await paymentsOf(owner(), deal.projectId);
    const firstParts = before.parts.slice(0, PARTS_PAID);
    for (const part of firstParts) {
      const paid = await recordPayment(owner(), deal.projectId, {
        partId: part.id,
        amount: part.amount,
      });
      expect(paid.status).toBe(HttpStatus.CREATED);
    }
    const collected = sumOf(firstParts.map((part) => part.amount));
    const smaller = '100000.00';
    await aNewerVersion(owner(), deal.proposalId, smaller);
    const preview = (await previewOf(pm(), deal.projectId, 2)).body;
    expect(preview).toMatchObject({ newTotal: smaller, remaining: '0.00' });
    expect(paise(preview.surplus ?? '0')).toBe(collected - paise(smaller));
    expect(preview.plan.every((part) => part.state === 'paid')).toBe(true);
    expect((await putInForce(pm(), deal.projectId, 2)).status).toBe(HttpStatus.OK);
    const money = await paymentsOf(owner(), deal.projectId);
    expect(money.entries.filter((entry) => entry.kind === 'payment')).toHaveLength(PARTS_PAID);
    expect(money.parts).toHaveLength(PARTS_PAID);
    // The replaced parts keep their positions, so the next version's parts take new ones.
    await aNewerVersion(owner(), deal.proposalId, NEW_TOTAL);
    expect((await putInForce(pm(), deal.projectId, THIRD_VERSION)).status).toBe(HttpStatus.OK);
    const after = await paymentsOf(owner(), deal.projectId);
    expect(sumOf(after.parts.map((part) => part.amount))).toBe(paise(NEW_TOTAL));
  });

  it('decides who may under the project’s lock: a seller who lost the lead while waiting is refused', async () => {
    const deal = await aDealWithANewerVersion();
    const held = await holdLock(
      sql`select 1 from ${project} where ${project.id} = ${deal.projectId} for update`,
    );
    const asked = putInForce(seller(), deal.projectId, 2);
    await held.waitForWaiters(1);
    await db()
      .update(lead)
      .set({ ownerUserId: here.people.colleague.userId })
      .where(eq(lead.id, deal.leadId));
    await held.release();
    expect((await asked).status).toBe(HttpStatus.FORBIDDEN);
    expect((await detailOf(pm(), deal.projectId)).body.acts.versionInForce).toBe(true);
  });
});
