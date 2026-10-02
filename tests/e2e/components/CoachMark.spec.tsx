import { accountMenuWords, createTranslator, firstRunMarkWords, SHELL } from '@heliogrid/i18n';
import { AccountMenu, CoachMark } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

const en = await createTranslator('en');
const menu = accountMenuWords(en.t, 'Amit Rane');
const mark = firstRunMarkWords(en.t, 'centre-action', 'sales_executive', 'add_lead');

test('an Escape that closes a menu leaves the mark open; the next one passes it', async ({
  mount,
  page,
}) => {
  let dismissals = 0;
  const shell = await mount(
    <div>
      <AccountMenu
        {...menu}
        name="Amit Rane"
        align="start"
        onGrievance={() => undefined}
        onSignOut={() => undefined}
      />
      <CoachMark
        open
        title={mark?.title ?? ''}
        body={mark?.body}
        dismissLabel={en.t(SHELL.gotIt)}
        onDismiss={() => {
          dismissals += 1;
        }}
        autoFocus={false}
      />
    </div>,
  );

  await shell.getByRole('button', { name: menu.triggerName }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(page.getByRole('menu')).toBeHidden();
  expect(dismissals).toBe(0);

  await page.keyboard.press('Escape');
  await expect.poll(() => dismissals).toBe(1);
});
