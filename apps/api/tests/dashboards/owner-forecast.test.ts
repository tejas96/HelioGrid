import { lead } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aLead,
  answerOn,
  aShared,
  aStaffedCompany,
  aWin,
  customersLink,
  linkAct,
  markWon,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
} from '../customer-link/support';
import { skipWithoutDatabase } from '../support/fixture';
import { dashboardOf } from './support';

/**
 * The owner home's pipeline value, forecast and "proposals not opened" on the wire (`T-M13-007`;
 * `M13-03`, `M13-14`, `M13-15`): each open proposal counts at its latest SHARED version's payable,
 * the forecast weighs it by the market's likelihood for where it stands — a projection, never in a
 * total with Won — and a shared proposal leaves "what needs you" at its link's first open.
 */

const here = aStaffedCompany('Owner Forecast EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
  manager: [preset.sales_manager],
});
const elsewhere = aStaffedCompany('Other Forecast EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'OWNER FORECAST PROOF',
  'The owner home’s forecast and pipeline value are UNPROVEN on the wire in this run.',
);

/** Every sample proposal asks ₹1,90,575 (`M06-35`'s worked case), in paise. */
const PAYABLE_PAISE = 19_057_500;
const PAISE_PER_RUPEE = 100;
const WHOLE_PERCENT = 100;
const MONEY_DIGITS = 2;
/** India's likelihood for each stage an open proposal stands at, in percent (`IN_PROPOSAL_FACTS`). */
const LIKELY = { shared: 30, negotiating: 50, accepted: 90 } as const;
const SHARED = 2;
const OPEN_PROPOSALS = 4;
const DAY_MS = 86_400_000;
const SNOOZED_DAYS = 7;
const rupees = (paise: number) => (paise / PAISE_PER_RUPEE).toFixed(MONEY_DIGITS);
/** A stage's expectation: an estimate, so whole rupees, half a rupee up. */
const weighed = (paise: number, percent: number) =>
  Math.round((paise * percent) / WHOLE_PERCENT / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;

describe.skipIf(skip)('the owner home’s forecast, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;
  const unopened: { proposalId: string; token: string } = { proposalId: '', token: '' };
  let acceptedLead = '';

  /** A shared proposal with the customer's token, and what the customer then did on it. */
  const aDeal = async (act?: 'opened' | 'negotiate' | 'accept') => {
    const leadId = await aLead(owner());
    const proposal = await aShared(owner(), leadId);
    const { token } = await customersLink(owner(), leadId);
    const body =
      act === 'opened'
        ? { deviceClass: 'phone' }
        : act === 'negotiate'
          ? { ...(await answerOn(world, token)), words: 'A little lower, please' }
          : await answerOn(world, token);
    if (act !== undefined) {
      const done = await linkAct(world, token, act, body);
      if (done.status >= HttpStatus.BAD_REQUEST) throw new Error(`${act}: got ${done.status}`);
    }
    return { leadId, proposalId: proposal.id, token };
  };

  beforeAll(async () => {
    world = await openProposalsWorld([here, elsewhere]);
    Object.assign(unopened, await aDeal());
    await aDeal('opened');
    await aDeal('negotiate');
    acceptedLead = (await aDeal('accept')).leadId;
  });

  afterAll(async () => {
    await world.close();
  });

  it('weighs each open proposal by where it stands, at the market’s likelihood (M13-03)', async () => {
    const { forecast } = await dashboardOf(owner());
    expect(forecast).toMatchObject({ tier: 'assumed', count: OPEN_PROPOSALS });
    expect(forecast?.stages).toEqual([
      {
        stage: 'shared',
        count: SHARED,
        total: rupees(SHARED * PAYABLE_PAISE),
        likelihoodPercent: `${LIKELY.shared}.00`,
        expected: rupees(weighed(SHARED * PAYABLE_PAISE, LIKELY.shared)),
      },
      {
        stage: 'negotiating',
        count: 1,
        total: rupees(PAYABLE_PAISE),
        likelihoodPercent: `${LIKELY.negotiating}.00`,
        expected: rupees(weighed(PAYABLE_PAISE, LIKELY.negotiating)),
      },
      {
        stage: 'accepted',
        count: 1,
        total: rupees(PAYABLE_PAISE),
        likelihoodPercent: `${LIKELY.accepted}.00`,
        expected: rupees(weighed(PAYABLE_PAISE, LIKELY.accepted)),
      },
    ]);
    const expected =
      weighed(SHARED * PAYABLE_PAISE, LIKELY.shared) +
      weighed(PAYABLE_PAISE, LIKELY.negotiating) +
      weighed(PAYABLE_PAISE, LIKELY.accepted);
    expect(forecast?.expected).toBe(rupees(expected));
  });

  it('each funnel stage carries the value of its open proposals; a stage none prices carries none (M13-14)', async () => {
    const { pipeline } = await dashboardOf(owner());
    const worthOf = (stage: string) => pipeline.find((row) => row.stage === stage)?.value;
    // Two shared and the accepted one stand at `proposal`; a Negotiate moved its lead on.
    expect(worthOf('proposal')).toBe(rupees((SHARED + 1) * PAYABLE_PAISE));
    expect(worthOf('negotiating')).toBe(rupees(PAYABLE_PAISE));
    expect(worthOf('new')).toBeNull();
    expect(worthOf('qualified')).toBeNull();
  });

  it('a shared proposal nobody opened needs the owner, and leaves at its first open (M13-15)', async () => {
    const before = (await dashboardOf(owner())).needsYou.proposalsUnopened;
    expect(before).toMatchObject({
      count: 1,
      oldest: { proposalId: unopened.proposalId, days: 0 },
    });
    const opened = await linkAct(world, unopened.token, 'opened', { deviceClass: 'phone' });
    expect(opened.status).toBeLessThan(HttpStatus.BAD_REQUEST);
    const after = (await dashboardOf(owner())).needsYou.proposalsUnopened;
    expect(after).toEqual({ count: 0, oldest: null });
  });

  it('a won deal leaves the forecast and is never summed into it (M13-03)', async () => {
    const before = await dashboardOf(owner());
    const won = await markWon(
      owner(),
      acceptedLead,
      aWin(ownerId(), { finalValue: rupees(PAYABLE_PAISE) }),
    );
    expect(won.status).toBe(HttpStatus.CREATED);
    const after = await dashboardOf(owner());
    expect(after.forecast?.count).toBe(OPEN_PROPOSALS - 1);
    expect(after.forecast?.stages.find((row) => row.stage === 'accepted')).toMatchObject({
      count: 0,
      total: '0.00',
      expected: '0.00',
    });
    const dropped = weighed(PAYABLE_PAISE, LIKELY.accepted);
    expect(Number(after.forecast?.expected)).toBeCloseTo(
      Number(before.forecast?.expected) - dropped / PAISE_PER_RUPEE,
      MONEY_DIGITS,
    );
    // Won grew by the deal's value; the forecast is the open proposals alone.
    expect(Number(after.won.thisMonth.amount) - Number(before.won.thisMonth.amount)).toBeCloseTo(
      PAYABLE_PAISE / PAISE_PER_RUPEE,
      MONEY_DIGITS,
    );
    expect(after.pipeline.find((row) => row.stage === 'proposal')?.value).toBe(
      rupees(SHARED * PAYABLE_PAISE),
    );
  });

  it('another company’s proposals are never counted, and a rep reads no owner home', async () => {
    const other = await dashboardOf(world.as(elsewhere.members.owner));
    expect(other.forecast).toMatchObject({ count: 0, expected: '0.00' });
    expect(other.needsYou.proposalsUnopened).toEqual({ count: 0, oldest: null });
    const rep = await world.as(here.members.rep).call('GET', '/dashboards/owner');
    expect(rep.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('a Sales Manager’s home leaves out a proposal outside their team, in all three figures (M13-30)', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.rep.userId);
    const outside = await aShared(owner(), leadId);
    const company = await dashboardOf(owner());
    const team = await dashboardOf(world.as(here.members.manager));
    const sharedWorth = (home: typeof company) =>
      Number(home.pipeline.find((row) => row.stage === 'proposal')?.value ?? 0);
    expect(team.forecast?.count).toBe((company.forecast?.count ?? 0) - 1);
    // Each stage is rounded to the rupee, so one proposal less moves the figure by its own share ±₹1.
    const less = Number(company.forecast?.expected) - Number(team.forecast?.expected);
    expect(
      Math.abs(less - weighed(PAYABLE_PAISE, LIKELY.shared) / PAISE_PER_RUPEE),
    ).toBeLessThanOrEqual(1);
    expect(Number.isInteger(Number(team.forecast?.expected))).toBe(true);
    expect(sharedWorth(team)).toBeCloseTo(
      sharedWorth(company) - PAYABLE_PAISE / PAISE_PER_RUPEE,
      MONEY_DIGITS,
    );
    const unopenedOf = (home: typeof company) => home.needsYou.proposalsUnopened;
    expect(unopenedOf(company)?.oldest?.proposalId).toBe(outside.id);
    expect(unopenedOf(team)?.count).toBe((unopenedOf(company)?.count ?? 0) - 1);
    expect(unopenedOf(team)?.oldest?.proposalId).not.toBe(outside.id);
  });

  it('a snoozed or dormant lead’s open proposal still counts, in the forecast and the stage values', async () => {
    const snoozed = await aDeal();
    const dormant = await aDeal();
    const before = await dashboardOf(owner());
    const snooze = await owner().call('POST', `/leads/${snoozed.leadId}/snooze`, {
      wakeOn: new Date(Date.now() + SNOOZED_DAYS * DAY_MS).toISOString().slice(0, 10),
      capturedAt: new Date().toISOString(),
    });
    expect(snooze.status).toBe(HttpStatus.OK);
    await world.pools.admin.db
      .update(lead)
      .set({ lifecycleState: 'dormant' })
      .where(eq(lead.id, dormant.leadId));
    const after = await dashboardOf(owner());
    expect(after.forecast?.count).toBe(before.forecast?.count);
    expect(after.forecast?.expected).toBe(before.forecast?.expected);
    const values = (home: typeof before) => home.pipeline.map((row) => [row.stage, row.value]);
    expect(values(after)).toEqual(values(before));
  });
});
