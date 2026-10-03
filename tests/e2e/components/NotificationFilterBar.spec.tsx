import { createTranslator, NOTIFICATION_CENTRE, TYPE_GROUP_NAME } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { MIN_TOUCH_TARGET } from '../support/touch-target';
import { FilterBarAsHeld } from './NotificationFilterBar.story';

/** The centre's filter bar (`SCR-SHELL-03`, the owner's board change), at the web panel's 456. */
const en = await createTranslator('en');
const sales = en.t(TYPE_GROUP_NAME.sales);
const delivery = en.t(TYPE_GROUP_NAME.delivery);
const unreadOnly = en.t(NOTIFICATION_CENTRE.unreadOnly);

test.use({ viewport: { width: 456, height: 200 } });

test('one type group at a time: another replaces it, and tapping it again closes it', async ({
  mount,
}) => {
  const bar = await mount(<FilterBarAsHeld />);
  const toolbar = bar.getByRole('toolbar', { name: en.t(NOTIFICATION_CENTRE.filterBar) });
  const salesButton = toolbar.getByRole('button', { name: sales });
  const deliveryButton = toolbar.getByRole('button', { name: delivery });

  await salesButton.click();
  await expect(salesButton).toHaveAttribute('aria-pressed', 'true');
  await expect(salesButton).toContainText(sales);

  await deliveryButton.click();
  await expect(deliveryButton).toHaveAttribute('aria-pressed', 'true');
  await expect(salesButton).toHaveAttribute('aria-pressed', 'false');

  await deliveryButton.click();
  await expect(deliveryButton).toHaveAttribute('aria-pressed', 'false');
});

test('Unread toggles on its own and stays on beside a group', async ({ mount }) => {
  const bar = await mount(<FilterBarAsHeld />);
  const unread = bar.getByRole('button', { name: unreadOnly });
  await unread.click();
  await bar.getByRole('button', { name: sales }).click();
  await expect(unread).toHaveAttribute('aria-pressed', 'true');
  await unread.click();
  await expect(unread).toHaveAttribute('aria-pressed', 'false');
  await expect(bar.getByRole('button', { name: sales })).toHaveAttribute('aria-pressed', 'true');
});

test('every button is a 44 target, and a pressed one keeps the focus', async ({ mount }) => {
  const bar = await mount(<FilterBarAsHeld />);
  for (const button of await bar.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  }
  const salesButton = bar.getByRole('button', { name: sales });
  await salesButton.focus();
  await salesButton.press('Enter');
  await expect(salesButton).toBeFocused();
  await expect(salesButton).toHaveAttribute('aria-pressed', 'true');
});
