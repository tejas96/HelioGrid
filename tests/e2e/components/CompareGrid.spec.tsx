import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Card, CompareGrid } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const label = en.t(SIGN_IN.mobileNumber);
const attributes = [{ key: 'contact', label }];
const options = [
  { key: 'sms', name: en.t(SIGN_IN.sendCode), values: { contact: en.t(SIGN_IN.sentBySmsTo) } },
  { key: 'call', name: en.t(SIGN_IN.callAgain), values: { contact: en.t(SIGN_IN.triedToCall) } },
];

test('a comparison is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const grid = await mount(<CompareGrid attributes={attributes} options={options} />);

  await expect(grid).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(grid).toHaveCSS('box-shadow', 'none');
  await expect(grid).toHaveCSS('border-radius', '0px');
});

test('a pinned cell paints the ground that holds it', async ({ mount, page }) => {
  const card = await mount(
    <Card>
      <CompareGrid attributes={attributes} options={options} />
    </Card>,
  );
  const pinned = card.getByRole('rowheader', { name: label });

  await expect(pinned).toHaveCSS('position', 'sticky');
  await expect(pinned).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
});
