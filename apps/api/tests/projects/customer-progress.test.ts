import type { ComposedMessage } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ProjectsCustomerService } from '../../src/modules/projects/projects.public';
import {
  aStaffedCompany,
  type Caller,
  openProposalsWorld,
  type ProposalsWorld,
  pageOf,
  preset,
  refusalOf,
} from '../customer-link/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  ACCEPTED_PAYABLE,
  aWonAcceptedDeal,
  type HandoffTeam,
  paise,
  sumOf,
} from './handoff-support';
import { paymentsOf, recordPayment } from './payments-support';
import { acted, actOn, aWonProject, dayFromToday, detailOf } from './support';

/**
 * A won deal as its customer reads it on their link, and the installation day they are told
 * (`T-F5-002`, `T-F5-003`, `T-M11-015`; `F5-57`…`F5-73`, `M08-15`, `M08-24`…`M08-29`, `M08-39`): the
 * stages with the market's own labels, the wait as published — never its internal note — the four
 * installation facts, the payment plan with each receipt the moment it is recorded, and the
 * evening-before message a person sends.
 */

const here = aStaffedCompany('Customer Progress EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  seller: [preset.sales_executive],
  installer: [preset.installation_team_member],
});
const there = aStaffedCompany('Customer Progress Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'CUSTOMER PROGRESS PROOF',
  'The progress page’s facts, the installation day and the crew message are UNPROVEN in this run.',
);

/** What the pack's typical net-metering approval takes at its longer end: six weeks, in days. */
const UTILITY_APPROVAL_DAYS = 42;
/** Less than the advance, so the part stays owed. */
const PART_OF_ADVANCE = '5000.00';
/** The chain's nine stages less the incentive claim a commercial deal never walks. */
const STAGES_WITHOUT_INCENTIVE = 8;
const SECRET_NOTE = 'Internal: supplier Acme missed the lorry';
const DISTURBANCE = 'The power is off for about two hours.';

describe.skipIf(skip)(
  'a won deal on its customer’s link, over HTTP against a migrated database',
  () => {
    let world: ProposalsWorld;
    const owner = () => world.as(here.members.owner);
    const pm = () => world.as(here.members.pm);
    const seller = () => world.as(here.members.seller);
    const pmId = () => here.people.pm.userId;
    const tenantId = () => here.company.tenantId;
    const service = () => world.http.app.get(ProjectsCustomerService);
    const team = (): HandoffTeam => ({
      owner: owner(),
      seller: seller(),
      sellerId: here.people.seller.userId,
      managerId: pmId(),
    });
    const aWonDeal = () => aWonAcceptedDeal(world, team());
    const progressOf = async (token: string) => {
      const page = await pageOf(world, token);
      if (page.body.progress === undefined) throw new Error(`no progress: ${page.body.kind}`);
      return { page: page.body, progress: page.body.progress };
    };
    const crewMessageOf = (caller: Caller, projectId: string) =>
      caller.call<ComposedMessage>('GET', `/projects/${projectId}/crew-message`);

    beforeAll(async () => {
      world = await openProposalsWorld([here, there]);
    });

    afterAll(async () => {
      await world.close();
    });

    it('the same link shows progress after Won: the deal’s own stages, the system, the plan (F5-61, F5-62)', async () => {
      const deal = await aWonDeal();
      const { page, progress } = await progressOf(deal.token);
      expect(page.kind).toBe('progress');
      expect(progress).toMatchObject({
        capacityKw: 3,
        systemType: 'on_grid',
        cancelledOn: null,
        wait: null,
      });
      expect(progress.stages.map((row) => row.stage)).toEqual([
        'won',
        'material_ordered',
        'dispatched',
        'installation',
        'electrical_metering',
        'utility_inspection',
        'commissioned',
        'incentive_claimed',
        'handed_over',
      ]);
      expect(progress.stages[0]).toMatchObject({ state: 'current', on: dayFromToday(0) });
      expect(
        progress.stages.slice(1).every((row) => row.state === 'ahead' && row.on === null),
      ).toBe(true);
      expect(progress.stages.every((row) => row.label.trim() !== '')).toBe(true);
      // The plan is the accepted version's, to the paisa; the part due at Won asks exactly its amount.
      expect(sumOf(progress.payments.parts.map((part) => part.amount))).toBe(
        paise(ACCEPTED_PAYABLE),
      );
      const [first] = progress.payments.parts;
      expect(progress.payments.due).toMatchObject({ label: first?.label, amount: first?.amount });
      // A company that saved neither a UPI ID nor a bank offers no instrument, and none is made up (F5-58).
      expect(progress.payments.due).toMatchObject({
        upiUri: null,
        payTo: { upiId: null, bank: null },
      });
      // Nothing is scheduled yet beyond the promised day.
      expect(progress.installation).toMatchObject({
        startTime: null,
        durationDays: null,
        crewLead: null,
      });
    });

    it('a stage the deal does not walk is absent, never an empty row (F5-62)', async () => {
      const won = await aWonProject(owner(), pmId(), 'commercial');
      const progress = await service().progressOf(tenantId(), won.leadId);
      expect(progress?.stages.map((row) => row.stage)).not.toContain('incentive_claimed');
      expect(progress?.stages).toHaveLength(STAGES_WITHOUT_INCENTIVE);
      expect(progress).toMatchObject({ capacityKw: null, systemType: null });
    });

    it('a wait reads as published — party, reason, since, the pack’s typical length — never its note (M08-24…M08-29, F5-63, F5-64)', async () => {
      const deal = await aWonDeal();
      await acted(pm(), deal.projectId, 'wait', {
        party: 'utility',
        reason: 'utility_approval',
        startedOn: dayFromToday(0),
        note: SECRET_NOTE,
      });
      const { page, progress } = await progressOf(deal.token);
      expect(progress.wait).toEqual({
        party: 'utility',
        reason: 'utility_approval',
        since: dayFromToday(0),
        typicalDays: UTILITY_APPROVAL_DAYS,
      });
      expect(progress.stages[0]?.state).toBe('waiting');
      expect(JSON.stringify(page)).not.toContain('Acme');
      // A wait the pack times nothing for states no length, never an invented one (F5-66).
      await acted(pm(), deal.projectId, 'wait/end');
      await acted(pm(), deal.projectId, 'wait', {
        party: 'customer',
        reason: 'site_access',
        startedOn: dayFromToday(0),
        note: null,
      });
      expect((await progressOf(deal.token)).progress.wait).toMatchObject({
        party: 'customer',
        typicalDays: null,
      });
    });

    it('a receipt states the amount received to the paisa, never rounded (M11-41, F1-07)', async () => {
      const deal = await aWonDeal();
      const [first] = (await paymentsOf(owner(), deal.projectId)).parts;
      if (first === undefined) throw new Error('no schedule');
      const paid = await recordPayment(owner(), deal.projectId, {
        partId: first.id,
        amount: '1000.50',
      });
      expect(paid.status).toBe(HttpStatus.CREATED);
      const [part] = (await progressOf(deal.token)).progress.payments.parts;
      expect(part?.receipts[0]?.text).toContain('₹1,000.50');
    });

    it('a recorded payment is on the page at once, as recorded by the company (M11-45, M11-55, F5-57, F5-59)', async () => {
      const deal = await aWonDeal();
      const before = await paymentsOf(owner(), deal.projectId);
      const [first] = before.parts;
      if (first === undefined) throw new Error('no schedule');
      const paid = await recordPayment(owner(), deal.projectId, {
        partId: first.id,
        amount: first.amount,
      });
      expect(paid.status).toBe(HttpStatus.CREATED);
      const { progress } = await progressOf(deal.token);
      const [part] = progress.payments.parts;
      expect(part).toMatchObject({
        state: 'received',
        received: first.amount,
        outstanding: '0.00',
      });
      expect(part?.receipts).toHaveLength(1);
      expect(part?.receipts[0]).toMatchObject({
        amount: first.amount,
        receivedOn: dayFromToday(0),
      });
      expect(part?.receipts[0]?.number).toMatch(/^RCPT-\d{4,}$/);
      expect(part?.receipts[0]?.text).toContain(part?.receipts[0]?.number ?? 'RCPT');
      expect(part?.receipts[0]?.text).not.toMatch(/confirmed by (the|your) bank/i);
      // The later parts are not due yet: nothing is asked, and nothing else on the page changed (F5-24).
      expect(progress.payments.due).toBeNull();
      expect(progress.stages[0]?.state).toBe('current');
      // The first receipt is the advance-receipt row's proof: nobody uploads it (M08-46).
      const rows = (await detailOf(pm(), deal.projectId)).body.documents;
      expect(rows.find((row) => row.row === 'advance_receipt')?.state).toBe('done');
    });

    it('the installation day’s four facts are the manager’s, and reach the customer’s page (F5-68)', async () => {
      const deal = await aWonDeal();
      const installerId = here.people.installer.userId;
      // A month from its day, no message is due.
      expect((await detailOf(pm(), deal.projectId)).body.crewMessageDue).toBe(false);
      const notCrew = await actOn(pm(), deal.projectId, 'details', { crewLeadId: installerId });
      expect(notCrew.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(refusalOf(notCrew)).toBe('not_on_crew');

      await acted(pm(), deal.projectId, 'move', { to: 'material_ordered' });
      await acted(pm(), deal.projectId, 'dispatch', {
        crew: [installerId],
        leftOn: dayFromToday(0),
      });
      const changed = await acted(pm(), deal.projectId, 'details', {
        expectedInstallOn: dayFromToday(0),
        installStartTime: '09:30',
        installDurationDays: 2,
        installDisturbance: DISTURBANCE,
        crewLeadId: installerId,
      });
      const day = {
        on: dayFromToday(0),
        startTime: '09:30',
        durationDays: 2,
        disturbance: DISTURBANCE,
        crewLead: { userId: installerId },
      };
      expect(changed.installation).toMatchObject(day);
      expect((await progressOf(deal.token)).progress.installation).toMatchObject(day);
      // The message is due from the evening before until the day ends, on the company's clock.
      expect(changed.crewMessageDue).toBe(true);

      const message = await crewMessageOf(pm(), deal.projectId);
      expect(message.status).toBe(HttpStatus.OK);
      expect(message.body.text).toContain(DISTURBANCE);
      expect(message.body.text).toContain('2 days');
      expect(message.body.text).toContain(changed.installation?.crewLead?.name ?? 'no lead');
      expect(message.body.text).not.toMatch(/<[a-zA-Z]+>/);
      expect(message.body.link).toBeNull();
      // The crew message is the manager's to send; another company's project is not found.
      expect((await crewMessageOf(seller(), deal.projectId)).status).toBe(HttpStatus.FORBIDDEN);
      expect((await crewMessageOf(world.as(there.members.owner), deal.projectId)).status).toBe(
        HttpStatus.NOT_FOUND,
      );
      // Clearing a fact leaves it unsaid, never a placeholder.
      const cleared = await acted(pm(), deal.projectId, 'details', {
        installDisturbance: null,
        crewLeadId: null,
      });
      expect(cleared.installation).toMatchObject({ disturbance: null, crewLead: null });
      expect((await crewMessageOf(pm(), deal.projectId)).body.text).not.toContain(DISTURBANCE);
    });

    it('a cancelled project says so honestly, shows what was paid and asks for nothing (F5 §F5.3)', async () => {
      const deal = await aWonDeal();
      const before = await paymentsOf(owner(), deal.projectId);
      const [first] = before.parts;
      if (first === undefined) throw new Error('no schedule');
      // Part of the advance came in: the rest is still owed on paper, and a cancelled page asks for none of it.
      await recordPayment(owner(), deal.projectId, { partId: first.id, amount: PART_OF_ADVANCE });
      await acted(pm(), deal.projectId, 'wait', {
        party: 'customer',
        reason: 'customer_decision',
        startedOn: dayFromToday(0),
        note: null,
      });
      await acted(pm(), deal.projectId, 'cancel', { reason: 'customer_backed_out', note: null });
      const progress = await service().progressOf(tenantId(), deal.leadId);
      expect(progress).toMatchObject({ cancelledOn: dayFromToday(0), wait: null });
      expect(progress?.payments.due).toBeNull();
      expect(progress?.payments.parts.map((part) => part.label)).toEqual([first.label]);
      expect(
        progress?.stages.some((row) => row.state === 'current' || row.state === 'waiting'),
      ).toBe(false);
    });
  },
);
