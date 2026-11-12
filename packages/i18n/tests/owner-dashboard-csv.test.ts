import type { OwnerDashboard } from '@heliogrid/contracts';
import { winRateOf } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { ownerDashboardCsv } from '../src/copy/owner-dashboard-csv';
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
      '"Collected","Late","₹185000.00","3 payments are late"',
      '"Won so far","So far this month","₹2460000.00","Derived"',
      '"Won so far","Middle of 13 won deals","₹310000.00","Derived"',
      '"Forecast","","Starts with proposals"',
      '"Pipeline by stage","Contacted","0",""',
      '"Pipeline by stage","","","Stage values come with proposals."',
      '"Target for this month","","","No target set"',
      '"Why deals were lost","Price","2",""',
    ]) {
      expect(csv).toContain(line);
    }
  });

  it('opens on its header row and ends on the day it was taken', async () => {
    const { t } = await createTranslator('en');
    const lines = ownerDashboardCsv(t, view, winRateOf(1, 2), format).split('\r\n');
    // The byte-order mark leads, so a spreadsheet reads the file as UTF-8.
    expect(lines[0]).toBe('\uFEFF"Section","Figure","Value","Note"');
    expect(lines.at(-2)).toBe('"Taken on 2026-11-12"');
    expect(lines.at(-1)).toBe('');
  });

  it('leaves out what needs nobody, as the screen does', async () => {
    const { t } = await createTranslator('en');
    const csv = ownerDashboardCsv(t, view, winRateOf(1, 2), format);
    expect(csv).toContain('"Needs you now","2 leads have no owner","",""');
    expect(csv).toContain('"Needs you now","1 of your tasks is overdue","",""');
    expect(csv).not.toContain('blocked on us');
    const quiet = ownerDashboardCsv(
      t,
      {
        ...view,
        needsYou: {
          ...view.needsYou,
          unassigned: { count: 0, oldestHours: null },
          myOverdueTasks: 0,
          waitingLongest: [],
        },
      },
      winRateOf(1, 2),
      format,
    );
    expect(quiet).not.toContain('no owner');
    expect(quiet).not.toContain('overdue');
    expect(quiet).not.toContain('Waiting longest');
  });

  it.each([
    [
      'too few to read',
      winRateOf(1, 2),
      '"Last 90 days","","Too few closed deals for a rate yet · 1 won, 2 lost"',
    ],
    [
      'a rate',
      { kind: 'rate', won: 13, lost: 29, basisPoints: 3095 } as const,
      '"Last 90 days","30.95%","13 won · 29 lost"',
    ],
  ])('the win/loss row reads %s: the rate or nothing as its value', async (_, rate, line) => {
    const { t } = await createTranslator('en');
    expect(ownerDashboardCsv(t, view, rate, format)).toContain(line);
  });

  it("a lead's name that a spreadsheet would run stays text", async () => {
    const { t } = await createTranslator('en');
    const csv = ownerDashboardCsv(t, view, winRateOf(1, 2), format);
    expect(csv).toContain(
      `"Needs you now","Waiting longest","","'=HYPERLINK(""x"") · 34 days in Survey"`,
    );
  });

  it('a deal that came in today waits in its stage since today', async () => {
    const { t } = await createTranslator('en');
    const lead = {
      leadId: '01a70000-0000-7000-8000-000000000001',
      name: 'Kavita Joshi',
      stage: 'survey',
      days: 0,
    } as const;
    const csv = ownerDashboardCsv(
      t,
      { ...view, needsYou: { ...view.needsYou, waitingLongest: [lead] } },
      winRateOf(1, 2),
      format,
    );
    expect(csv).toContain('"Kavita Joshi · in Survey since today"');
  });
});
