import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { ReorderList } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const items = [en.t(COMPANY_SIGNUP.companyName), en.t(COMPANY_SIGNUP.city)];

/* A row's own controls are ghost arrows with no fill of their own, so there is no white control to
   read here: the row's grey and its flat rest are the whole of the tile. */
test('a reorder row is a grey tile with no shadow', async ({ mount, page }) => {
  const list = await mount(<ReorderList items={items} />);
  const row = list.getByRole('listitem').first();

  await expect(row).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(row).toHaveCSS('box-shadow', 'none');
});
