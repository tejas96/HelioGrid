import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Card } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { fillOf } from '../support/token';
import { WordedCompareGrid } from './CompareGrid.story';

const en = await createTranslator('en');
const label = en.t(SIGN_IN.mobileNumber);
const attributes = [{ key: 'contact', label }];
const options = [
  { key: 'sms', name: en.t(SIGN_IN.sendCode), values: { contact: en.t(SIGN_IN.sentBySmsTo) } },
  { key: 'call', name: en.t(SIGN_IN.callAgain), values: { contact: en.t(SIGN_IN.triedToCall) } },
];

test('a comparison is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const grid = await mount(
    <WordedCompareGrid read={{ kind: 'ready' }} attributes={attributes} options={options} />,
  );

  await expect(grid).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(grid).toHaveCSS('box-shadow', 'none');
  await expect(grid).toHaveCSS('border-radius', '0px');
});

test('a pinned cell paints its holder’s own fill and frosts the columns running under it', async ({
  mount,
}) => {
  const card = await mount(
    <Card>
      <WordedCompareGrid read={{ kind: 'ready' }} attributes={attributes} options={options} />
    </Card>,
  );
  const pinned = card.getByRole('rowheader', { name: label });

  await expect(pinned).toHaveCSS('position', 'sticky');
  await expect(pinned).toHaveCSS('background-color', await fillOf(card));
  await expect(pinned).not.toHaveCSS('backdrop-filter', 'none');
});

test('a numeric row ends its figures on one right edge; a word row stays left (F7-09)', async ({
  mount,
}) => {
  const figures = [
    { key: 'contact', label },
    { key: 'rate', label: en.t(SIGN_IN.sendCode), numeric: true },
  ];
  const priced = options.map((option, index) => ({
    ...option,
    values: { ...option.values, rate: index === 0 ? 6 : 600 },
  }));
  const grid = await mount(
    <WordedCompareGrid read={{ kind: 'ready' }} attributes={figures} options={priced} />,
  );

  const rows = grid.getByRole('row');
  await expect(rows.nth(2).getByRole('cell').first()).toHaveCSS('text-align', 'right');
  await expect(rows.nth(1).getByRole('cell').first()).toHaveCSS('text-align', 'start');
});
