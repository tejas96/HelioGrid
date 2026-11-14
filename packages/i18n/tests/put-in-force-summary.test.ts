import { formatMoneyPlainly, IN_FORMATS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { putInForceWords } from '../src/copy/proposal-after-in-force';
import { proposalVersionsWords } from '../src/copy/proposal-after-versions';
import { createTranslator } from '../src/runtime';

const formats = {
  money: (amount: string, beside?: readonly string[]) =>
    formatMoneyPlainly(IN_FORMATS, amount, beside),
  due: String,
  day: String,
};

const preview = (paid: string, surplus: string | null) =>
  ({
    version: 3,
    currencyCode: 'INR',
    newTotal: '114345.00',
    paid,
    remaining: '95287.50',
    surplus,
    plan: [],
  }) as Parameters<ReturnType<typeof putInForceWords>['summary']>[0];

describe('Put in force prints its summary column in one form, never rounded (M08-50)', () => {
  it.each<[string, string, string | null, readonly string[]]>([
    [
      'a paisa in one figure keeps it in every figure',
      '19057.50',
      null,
      ['₹1,14,345.00', '₹19,057.50', '₹95,287.50'],
    ],
    [
      'a surplus joins the same column',
      '19057.50',
      '0.50',
      ['₹1,14,345.00', '₹19,057.50', '₹95,287.50', '₹0.50'],
    ],
  ])('%s', async (_, paid, surplus, printed) => {
    const { t } = await createTranslator('en');
    const words = putInForceWords(t, formats, { version: 3, customerName: null, segment: null });
    expect(words.summary(preview(paid, surplus)).map((row) => row.value)).toEqual(printed);
  });
});

describe('a version change prints its old and new amount in one form (M06-42)', () => {
  it.each<[string, string, string, readonly [string, string]]>([
    [
      'a paisa on the new side keeps it on the old',
      '230000.00',
      '235000.50',
      ['₹2,30,000.00', '₹2,35,000.50'],
    ],
    [
      'two whole amounts leave the fraction unsaid',
      '230000.00',
      '235000.00',
      ['₹2,30,000', '₹2,35,000'],
    ],
  ])('%s', async (_, from, to, printed) => {
    const { t } = await createTranslator('en');
    const words = proposalVersionsWords(t, { ...formats, number: String, when: String });
    const row = words.change({
      fact: 'price',
      from: { kind: 'money', amount: from },
      to: { kind: 'money', amount: to },
    } as Parameters<typeof words.change>[0]);
    expect([row.from, row.to]).toEqual(printed);
  });
});
