import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { DateSet } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const entries = [
  { date: '2026-10-20', name: en.t(COMPANY_SIGNUP.companyName), origin: 'tenant' as const },
];

/* A row's one control is a ghost delete with no fill of its own, so there is no white control to
   read here: the row's grey and its flat rest are the whole of the tile. */
test('a date row is a grey tile with no shadow, and the calendar stays on the page', async ({
  mount,
  page,
}) => {
  const dateSet = await mount(
    <DateSet entries={entries} month="2026-10-01" onMonthChange={() => undefined} />,
  );
  const row = dateSet.getByRole('listitem');

  await expect(row).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(row).toHaveCSS('box-shadow', 'none');
  await expect(dateSet.locator('.hg-date-set-grid')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  );
});
