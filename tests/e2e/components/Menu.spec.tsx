import { accountMenuWords, createTranslator, menuWords } from '@heliogrid/i18n';
import { AccountMenu, Menu } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { settledBox } from '../support/layout';

const en = await createTranslator('en');
const words = accountMenuWords(en.t, 'Amit Rane');

// Short enough that the two-item list cannot fit under a trigger at the window's foot.
test.use({ viewport: { width: 375, height: 240 } });

/** The account menu as the web rail draws it, its trigger held at the window's top or foot. */
function menuAt(edge: 'flex-start' | 'flex-end') {
  return (
    <div style={{ display: 'flex', alignItems: edge, height: '100vh' }}>
      <AccountMenu
        {...words}
        name="Amit Rane"
        align="start"
        onGrievance={() => undefined}
        onSignOut={() => undefined}
      />
    </div>
  );
}

test('rises when the list would not fit below', async ({ mount, page }) => {
  const menu = await mount(menuAt('flex-end'));
  const trigger = menu.getByRole('button', { name: words.triggerName });

  await trigger.click();
  const list = await settledBox(page.getByRole('menu'));
  const button = await settledBox(trigger);

  expect(list).not.toBeNull();
  expect(button).not.toBeNull();
  if (list === null || button === null) return;
  expect(list.y).toBeGreaterThanOrEqual(0);
  expect(list.y + list.height).toBeLessThanOrEqual(button.y);
});

test('drops when there is room below', async ({ mount, page }) => {
  const menu = await mount(menuAt('flex-start'));
  const trigger = menu.getByRole('button', { name: words.triggerName });

  await trigger.click();
  const list = await settledBox(page.getByRole('menu'));
  const button = await settledBox(trigger);

  expect(list).not.toBeNull();
  expect(button).not.toBeNull();
  if (list === null || button === null) return;
  expect(list.y).toBeGreaterThanOrEqual(button.y + button.height);
  expect(list.y + list.height).toBeLessThanOrEqual(240);
});

test('draws a destructive row last, behind a gap, wherever the caller put it', async ({
  mount,
  page,
}) => {
  const say = (id: string) => en.t({ id });
  const menu = await mount(
    <Menu
      {...menuWords(en.t)}
      items={[
        { key: 'junk', label: say('Junk'), destructive: true },
        { key: 'referral', label: say('Add a referral') },
        { key: 'merge', label: say('Merge duplicate') },
      ]}
    />,
  );

  await menu.getByRole('button', { name: menuWords(en.t).label }).click();
  const list = page.getByRole('menu');
  await expect(list.getByRole('menuitem')).toHaveText([
    'Add a referral',
    'Merge duplicate',
    'Junk',
  ]);
  await expect(list.locator('.hg-menu-separator + [role="menuitem"]')).toHaveText('Junk');
  await expect(list.getByRole('menuitem', { name: 'Add a referral' })).toBeFocused();
});
