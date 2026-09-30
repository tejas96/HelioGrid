import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { Checklist } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const label = en.t(COMPANY_SIGNUP.yourCompany);
const items = [{ id: 'name', title: en.t(COMPANY_SIGNUP.companyName) }];

test('a checklist is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const checklist = await mount(<Checklist label={label} items={items} />);

  await expect(checklist).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(checklist).toHaveCSS('box-shadow', 'none');
  await expect(checklist).toHaveCSS('border-radius', '0px');
});

test('a checklist row is a grey tile with no shadow and its controls are white', async ({
  mount,
  page,
}) => {
  const checklist = await mount(<Checklist label={label} items={items} />);
  const row = checklist.getByRole('listitem');

  await expect(row).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(row).toHaveCSS('box-shadow', 'none');
  await expect(row.locator('.hg-checklist-box')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});
