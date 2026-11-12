import type { OwnerDashboard } from '@heliogrid/contracts';
import { winRateOf } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { ownerDashboardCsv } from '../src/copy/owner-dashboard';
import { createTranslator } from '../src/runtime';

const view: OwnerDashboard = {
  scope: 'team',
  today: '2026-11-12',
  month: '2026-11',
  currencyCode: 'INR',
  needsYou: {
    unassigned: { count: 2, oldestHours: 26 },
    paymentsLate: {
      count: 3,
      amount: '185000.00',
      oldestDays: 9,
      oldestProjectId: '01a70000-0000-7000-8000-000000000009',
    },
    blockedOnUs: { count: 0, oldest: null },
    waitingLongest: [
      {
        leadId: '01a70000-0000-7000-8000-000000000001',
        name: '=HYPERLINK("x")',
        stage: 'survey',
        days: 34,
      },
    ],
    myOverdueTasks: 1,
  },
  cash: {
    collectedThisMonth: '1840000.00',
    collectedLastMonth: '1640000.00',
    toCollect: '620000.00',
    late: { count: 3, amount: '185000.00' },
  },
  won: {
    thisMonth: { count: 6, amount: '2460000.00' },
    lastMonth: { count: 5, amount: '2100000.00' },
    median: { amount: '310000.00', of: 13 },
  },
  target: null,
  canSetTarget: false,
  pipeline: [{ stage: 'new', count: 8 }],
  winLoss: { windowDays: 90, won: 1, lost: 2, lostReasons: [{ reason: 'price', count: 2 }] },
};

const format = {
  money: (amount: string) => `₹${amount}`,
  percent: (basisPoints: number) => `${basisPoints / 100}%`,
  day: (date: string) => date,
};

/** The export carries what the screen carried (`M13-53`) and stays text in a spreadsheet. */
describe('ownerDashboardCsv', () => {
  it('every figure keeps its label, its provenance and its caveat', async () => {
    const { t } = await createTranslator('en');
    const csv = ownerDashboardCsv(t, view, winRateOf(1, 2), format);
    for (const line of [
      '"Collected","So far this month","₹1840000.00","Measured"',
      '"Won so far","So far this month","₹2460000.00","Derived"',
      '"Forecast","","Starts with proposals"',
      '"Pipeline by stage","Contacted","0",""',
      '"Pipeline by stage","","","Stage values come with proposals."',
      'Too few closed deals for a rate yet · 1 won, 2 lost',
      '"Target for this month","","No target set",""',
      '"Why deals were lost","Price","2",""',
    ]) {
      expect(csv).toContain(line);
    }
  });

  it("a lead's name that a spreadsheet would run stays text", async () => {
    const { t } = await createTranslator('en');
    const csv = ownerDashboardCsv(t, view, winRateOf(1, 2), format);
    expect(csv).toContain(`"'=HYPERLINK(""x"") · 34 days in Survey"`);
  });
});
