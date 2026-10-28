import { join } from 'node:path';
import { createTranslator, PROFILE_PREFERENCES, SIGN_IN, TYPE_GROUP_NAME } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectNothingClipped, settledBox } from '../support/layout';
import { resolvedColour } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { ProfilePreferencesAsHeld } from './ProfilePreferences.story';

/**
 * Profile & preferences' push section and the push read's frames (`SCR-M01-11`, `F6-15`): a switch
 * per group the person is shown, on while push is on; the Owner's Billing on, locked, its reason
 * one tap away; the page's loading bars and error banner while the read is out or failed; a
 * refused write on its own switch (D219). Each frame's picture is saved for the board comparison.
 */
const en = await createTranslator('en');
const W = (key: keyof typeof PROFILE_PREFERENCES) => en.t(PROFILE_PREFERENCES[key]);
const GROUP = (group: keyof typeof TYPE_GROUP_NAME) => en.t(TYPE_GROUP_NAME[group]);
const FOUR = ['sales', 'delivery', 'payments', 'team'] as const;
const PICTURES = join(import.meta.dirname, '../../../.qa/components/profile-preferences');
const TEXT =
  '.hg-profile-preferences-overline, .hg-switch-label, .hg-profile-preferences-locked-name, .hg-settings-section-title, .hg-settings-section-label';

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('m-default: four switches, all on, About push beside the heading, no Billing', async ({
    mount,
    page,
  }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" />);
    await expect(card.getByRole('heading', { level: 2, name: W('push') })).toBeVisible();
    await card.getByRole('button', { name: W('aboutPush') }).click();
    await expect(page.getByText(W('aboutPushLine'))).toBeVisible();
    await page.keyboard.press('Escape');
    const switches = card.getByRole('switch');
    await expect(switches).toHaveCount(4);
    for (const group of FOUR) {
      await expect(card.getByRole('switch', { name: GROUP(group) })).toBeChecked();
    }
    await expect(card.getByRole('switch', { name: GROUP('billing') })).toHaveCount(0);
    await expectTouchFloor(await card.locator('.hg-switch').all());
  });

  test('m-muted: Delivery and Payments off; a tap turns a group back on at once', async ({
    mount,
    page,
  }) => {
    const card = await mount(
      <ProfilePreferencesAsHeld reader="en" muted={['delivery', 'payments']} />,
    );
    await expect(card.getByRole('switch', { name: GROUP('delivery') })).not.toBeChecked();
    await expect(card.getByRole('switch', { name: GROUP('payments') })).not.toBeChecked();
    await expect(card.getByRole('switch', { name: GROUP('sales') })).toBeChecked();
    await page.screenshot({ path: `${PICTURES}/m-muted.png`, fullPage: true });
    await card.locator('.hg-switch', { hasText: GROUP('payments') }).click();
    await expect(card).toHaveAttribute('data-muted', 'delivery');
    await expect(card.getByRole('switch', { name: GROUP('payments') })).toBeChecked();
  });

  test('m-locked: the Owner’s Billing is on, disabled, named in primary text, its reason on a tap', async ({
    mount,
    page,
  }) => {
    const card = await mount(
      <ProfilePreferencesAsHeld reader="en" roles={['epc_owner']} name="Rajesh Kulkarni" />,
    );
    await expect(card.getByRole('switch')).toHaveCount(5);
    const billing = card.getByRole('switch', { name: GROUP('billing') });
    await expect(billing).toBeChecked();
    await expect(billing).toBeDisabled();
    await expect(card.locator('.hg-profile-preferences-locked-name label')).toHaveCSS(
      'color',
      await resolvedColour(page, '--text-primary'),
    );
    await card.getByRole('button', { name: W('whyBilling') }).click();
    await expect(page.getByText(W('whyBillingLine'))).toBeVisible();
    await page.keyboard.press('Escape');
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/m-locked.png`, fullPage: true });
  });

  test('m-loading: the whole page is its loading bars, named', async ({ mount, page }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" push="loading" />);
    await expect(card.getByLabel(W('loading'))).toBeVisible();
    await expect(card.getByRole('switch')).toHaveCount(0);
    await expect(card.getByRole('radiogroup')).toHaveCount(0);
    await page.screenshot({ path: `${PICTURES}/m-loading.png`, fullPage: true });
  });

  test('m-error: the danger banner says nothing changed; Try again asks again and focus stays on the page', async ({
    mount,
    page,
  }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" push="error" />);
    await expect(card.getByText(W('loadFailed'))).toBeVisible();
    await expect(card.getByText(W('nothingChanged'))).toBeVisible();
    await expect(card.getByRole('switch')).toHaveCount(0);
    await page.screenshot({ path: `${PICTURES}/m-error.png`, fullPage: true });
    await card.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
    await expect(card).toHaveAttribute('data-retried', 'true');
    await expect(card.getByRole('heading', { level: 1 })).toBeFocused();
  });

  test('a refused write shows on its own switch, and on no other (D219)', async ({ mount }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" refusedGroups={['sales']} />);
    await expect(card.getByText(W('notSaved'))).toHaveCount(1);
    await expect(card.getByRole('switch', { name: GROUP('sales') })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(card.getByRole('switch', { name: GROUP('team') })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`the Owner's push section in ${reader} clips nothing`, async ({ mount, page }) => {
      await mount(<ProfilePreferencesAsHeld reader={reader} roles={['epc_owner']} />);
      await expectNothingClipped(page, TEXT);
      await expectNoSidewaysScroll(page);
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('d-owner: the push card, each row a label and a switch, Billing locked with its reason', async ({
    mount,
    page,
  }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" roles={['epc_owner']} />);
    const push = card.locator('.hg-settings-section', {
      has: page.getByRole('heading', { level: 2, name: W('push') }),
    });
    await expect(push.getByRole('button', { name: W('aboutPush') })).toBeVisible();
    const rows = push.locator('.hg-settings-section-row');
    await expect(rows).toHaveCount(5);
    for (const row of await rows.all()) {
      expect((await settledBox(row))?.height).toBeGreaterThanOrEqual(64);
    }
    await expect(push.getByRole('switch', { name: GROUP('billing') })).toBeDisabled();
    await expect(rows.last().getByRole('button', { name: W('whyBilling') })).toBeVisible();
    await push.getByText(GROUP('team'), { exact: true }).click();
    await expect(card).toHaveAttribute('data-muted', 'team');
    await page.screenshot({ path: `${PICTURES}/d-owner.png`, fullPage: true });
  });

  test('d-error: the title, then the danger banner', async ({ mount, page }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" push="error" />);
    await expect(card.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(card.getByText(W('loadFailed'))).toBeVisible();
    await expect(card.locator('.hg-settings-section')).toHaveCount(0);
    await page.screenshot({ path: `${PICTURES}/d-error.png`, fullPage: true });
  });
});
