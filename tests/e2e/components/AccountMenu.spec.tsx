import { accountMenuWords, createTranslator } from '@heliogrid/i18n';
import { AccountMenu } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

const en = await createTranslator('en');
const words = accountMenuWords(en.t, 'Amit Rane');

test('opens the grievance contact and sign-out, neither destructive', async ({ mount, page }) => {
  let signOuts = 0;
  const menu = await mount(
    <AccountMenu
      {...words}
      name="Amit Rane"
      align="start"
      onGrievance={() => undefined}
      onSignOut={() => {
        signOuts += 1;
      }}
    />,
  );

  await menu.getByRole('button', { name: words.triggerName }).click();
  const items = page.getByRole('menuitem');

  await expect(items).toHaveText([words.grievanceLabel, words.signOutLabel]);
  await page.getByRole('menuitem', { name: words.signOutLabel }).click();
  await expect.poll(() => signOuts).toBe(1);
});
