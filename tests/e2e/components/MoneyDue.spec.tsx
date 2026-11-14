import { createTranslator, moneyDueWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { MoneyDueOfOnePart } from './MoneyDue.story';

const en = await createTranslator('en');
const words = moneyDueWords(en.t);

const PAISE = '19057.50';
const due = {
  today: '2026-11-14',
  currencyCode: 'INR',
  toCollect: PAISE,
  groups: {
    late: { count: 1, amount: PAISE },
    due: { count: 0, amount: '0.00' },
    part: { count: 0, amount: '0.00' },
  },
  collectedThisMonth: '1200.50',
  rows: {
    items: [
      {
        projectId: '018f0000-0000-7000-8000-000000000101',
        number: 'PRJ-0007',
        name: 'Anil Sharma',
        partId: '018f0000-0000-7000-8000-000000000102',
        label: 'Delivery',
        state: 'due',
        outstanding: PAISE,
        dueOn: '2026-11-10',
        group: 'late' as const,
      },
    ],
    totalCount: 1,
  },
  canRemind: false,
};

/*
 * Money owed or received is never rounded (§9): the hero, its tile, what came in and the row each
 * print the paise — both halves read them from one logic, `dueFiguresOf` and `dueRowOf`.
 */
test('Money due prints a paise amount exactly — ₹19,057.50, never ₹19,058', async ({ mount }) => {
  const frame = await mount(<MoneyDueOfOnePart due={due} />);
  await expect(frame.locator('.hg-money-due-figure')).toHaveText('₹19,057.50');
  await expect(frame.locator('.hg-money-due-tile-late .hg-money-due-amount')).toHaveText(
    '₹19,057.50',
  );
  await expect(
    frame.getByText(words.collectedThisMonth('₹1,200.50'), { exact: true }),
  ).toBeVisible();
  await expect(frame.locator('.hg-money-due-row-end .hg-money-due-amount')).toHaveText(
    '₹19,057.50',
  );
  await expect(frame.getByText('₹19,058')).toHaveCount(0);
});
