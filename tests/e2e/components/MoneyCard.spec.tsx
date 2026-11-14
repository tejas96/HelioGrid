import { createTranslator, moneyCardWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { MoneyCardOnAProject } from './MoneyCard.story';

const en = await createTranslator('en');
const words = moneyCardWords(en.t);

const money = {
  currencyCode: 'INR',
  total: '214345.50',
  collected: '19057.50',
  toCollect: '195288.00',
  next: '0.00',
  duePart: {
    id: '018f0000-0000-7000-8000-000000000001',
    label: 'Delivery',
    outstanding: '195288.00',
    dueOn: '2026-11-10',
    lastShared: null,
  },
};

test('the card never rounds money: a paisa shows, and the card’s amounts share one form (M11-43)', async ({
  mount,
}) => {
  const frame = await mount(<MoneyCardOnAProject money={money} />);

  await expect(
    frame.getByText(words.collectedOf('₹19,057.50', '₹2,14,345.50'), { exact: true }),
  ).toBeVisible();
  await expect(
    frame.getByText(words.duePartLine('Delivery', '₹1,95,288.00'), { exact: true }),
  ).toBeVisible();
});
