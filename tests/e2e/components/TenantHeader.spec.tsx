import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Button, TenantHeader } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('a tenant header is a heading on the page — no fill, no shadow', async ({ mount, page }) => {
  const header = await mount(
    <TenantHeader
      name={tryAgain}
      actions={
        <Button variant="secondary" size="sm">
          {tryAgain}
        </Button>
      }
    />,
  );

  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(header).toHaveCSS('box-shadow', 'none');
  await expect(header).toHaveCSS('border-radius', '0px');
  await expect(header.getByRole('button', { name: tryAgain })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--bg-well'),
  );
});
