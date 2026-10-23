import { join } from 'node:path';
import { IN_FORMATS } from '@heliogrid/domain';
import {
  createTranslator,
  LANGUAGE_META,
  PROFILE_PREFERENCES,
  presetName,
  settingsRowName,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll, expectNothingClipped } from '../support/layout';
import { pngOf } from '../support/png';
import { resolvedColour, resolvedLength, resolvedShadow } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { ProfilePreferencesAsHeld } from './ProfilePreferences.story';

/**
 * Profile & preferences at the board's two widths (`SCR-M01-11`): at 375 the phone's page — the
 * account tile, the languages as option cards in their own scripts, each line's source in secondary
 * text; at 1536 one column of section cards at most 760 wide, segmented controls with captions.
 * A tap applies at once; a refused save shows on its own control; Hindi and Marathi clip nothing.
 * Each frame's picture is saved beside the suite's results for the board comparison.
 */
const en = await createTranslator('en');
const W = (key: keyof typeof PROFILE_PREFERENCES) => en.t(PROFILE_PREFERENCES[key]);
const TITLE = settingsRowName(en.t, 'profile');
const MARKET_DEFAULT = en.t(PROFILE_PREFERENCES.marketDefault, { market: IN_FORMATS.name.en });
const ROLE = (preset: Parameters<typeof presetName>[1]) => presetName(en.t, preset);
/** Every box that holds words — the boxes a clipped line would show in. */
const TEXT =
  '.hg-profile-preferences-title, .hg-profile-preferences-overline, .hg-list-row-title, .hg-chip, .hg-option-card-titles, .hg-segmented-control-segment, .hg-value-source, .hg-settings-section-title, .hg-settings-section-label, .hg-settings-section-caption, .hg-profile-preferences-name-words, .hg-switch-label';
/** A saved photo, as its download link would draw it. */
const PHOTO = `data:image/png;base64,${pngOf(8, 8).toString('base64')}`;
const PICTURES = join(import.meta.dirname, '../../../.qa/components/profile-preferences');

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('m-default: the account tile, the languages in their own scripts, each source line', async ({
    mount,
    page,
  }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" />);
    await expect(card.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    await expect(card.getByRole('heading', { level: 2, name: W('account') })).toBeVisible();
    await expect(
      card.getByRole('heading', { level: 2, name: W('languageAndUnits') }),
    ).toBeVisible();
    await expect(card.getByText('Anjali Kulkarni')).toBeVisible();
    await expect(card.getByText(W('yourRole'), { exact: true })).toBeVisible();
    await expect(card.getByText(ROLE('sales_executive'))).toBeVisible();
    const languages = card.getByRole('radiogroup', { name: W('language') }).getByRole('radio');
    await expect(languages).toHaveCount(3);
    for (const lang of ['en', 'hi', 'mr'] as const) {
      await expect(
        card.locator(`[lang="${lang}"]`, { hasText: LANGUAGE_META[lang].endonym }).first(),
      ).toBeVisible();
    }
    await expect(card.getByText(W('deviceLanguage'))).toBeVisible();
    await expect(card.getByText(MARKET_DEFAULT)).toBeVisible();
    const secondary = await resolvedColour(page, '--text-secondary');
    for (const line of await card.locator('.hg-value-source').all()) {
      await expect(line).toHaveCSS('color', secondary);
    }
    await expect(card.getByRole('radio', { name: W('metres') })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const tile = card.locator('.hg-profile-preferences-tile');
    await expect(tile).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
    for (const row of await tile.locator('.hg-list-row').all()) {
      expect((await row.boundingBox())?.height).toBeGreaterThanOrEqual(64);
    }
    await expectTouchFloor(await card.getByRole('radio').all());
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/m-default.png`, fullPage: true });
  });

  test('a tap applies at once, and the moved line reads "Your choice"', async ({ mount }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" />);
    await card.getByRole('radio', { name: LANGUAGE_META.mr.endonym }).click();
    await expect(card).toHaveAttribute('data-language', 'mr');
    await card.getByRole('radio', { name: W('feet') }).click();
    await expect(card).toHaveAttribute('data-units', 'imperial');
    await expect(card.getByText(W('yourChoice'))).toHaveCount(2);
  });

  test('a refused save shows on the control that made it, and on no other', async ({ mount }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" refused={['units']} />);
    await expect(card.getByText(W('notSaved'))).toHaveCount(1);
    await expect(card.getByRole('radiogroup', { name: W('measurements') })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(card.getByRole('radiogroup', { name: W('language') })).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('two refused saves each show on their own control, together', async ({ mount }) => {
    const card = await mount(
      <ProfilePreferencesAsHeld reader="en" refused={['language', 'units']} />,
    );
    await expect(card.getByText(W('notSaved'))).toHaveCount(2);
  });

  test('the name row: the saved photo, and Edit name opens the editor', async ({ mount }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" photo={PHOTO} />);
    const row = card.locator('.hg-profile-preferences-tile .hg-list-row').first();
    await expect(row.locator('img')).toHaveAttribute('src', PHOTO);
    const edit = row.getByRole('button', { name: W('editName') });
    await expectTouchFloor([edit]);
    await edit.click();
    await expect(card).toHaveAttribute('data-edit-opened', 'true');
  });

  test('the role row is a button: a tab stop, and Enter, Space and a tap each open the card', async ({
    mount,
    page,
  }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" />);
    const row = card.getByRole('button', { name: W('yourRole') });
    await expect(row.locator('.hg-shell-glyph')).toHaveCount(1);
    await row.focus();
    await expect(row).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('data-role-opened', '1');
    await page.keyboard.press('Space');
    await expect(card).toHaveAttribute('data-role-opened', '2');
    await row.click();
    await expect(card).toHaveAttribute('data-role-opened', '3');
  });

  test('m-empty: a set holding only the language in use', async ({ mount, page }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" onlyLanguage />);
    await expect(
      card.getByRole('radiogroup', { name: W('language') }).getByRole('radio'),
    ).toHaveCount(1);
    await page.screenshot({ path: `${PICTURES}/m-empty.png`, fullPage: true });
  });

  test('m-multi-role: every preset a badge, wrapped, no count', async ({ mount, page }) => {
    const card = await mount(
      <ProfilePreferencesAsHeld
        reader="en"
        name="Vikram Deshpande"
        roles={['survey_engineer', 'design_engineer', 'installation_team_member']}
      />,
    );
    await expect(card.getByText(W('yourRoles'), { exact: true })).toBeVisible();
    for (const preset of [
      'survey_engineer',
      'design_engineer',
      'installation_team_member',
    ] as const)
      await expect(card.getByText(ROLE(preset))).toBeVisible();
    await expect(card.getByText(/^\+\d/)).toHaveCount(0);
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/m-multi-role.png`, fullPage: true });
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} nothing clips and nothing scrolls sideways`, async ({ mount, page }) => {
      await mount(
        <ProfilePreferencesAsHeld
          reader={reader}
          roles={['survey_engineer', 'design_engineer', 'installation_team_member']}
        />,
      );
      await expectNothingClipped(page, TEXT);
      await expectNoSidewaysScroll(page);
      await page.screenshot({ path: `${PICTURES}/m-${reader}.png`, fullPage: true });
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('d-default: one column of section cards, segmented controls with captions', async ({
    mount,
    page,
  }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" />);
    await expect(card.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    const sections = card.locator('.hg-settings-section');
    await expect(sections).toHaveCount(3);
    await expect(sections.first()).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
    await expect(sections.first()).toHaveCSS(
      'border-top-left-radius',
      `${await resolvedLength(page, '--r-tile')}px`,
    );
    const page760 = await card.locator('.hg-profile-preferences').boundingBox();
    expect(page760?.width).toBeLessThanOrEqual(760);
    await expect(card.getByRole('heading', { level: 2, name: W('account') })).toBeVisible();
    // Language, units, and the four push groups a Sales Executive is shown.
    await expect(card.locator('.hg-settings-section-row')).toHaveCount(6);
    for (const row of await card.locator('.hg-settings-section-row').all()) {
      expect((await row.boundingBox())?.height).toBeGreaterThanOrEqual(64);
    }
    await expect(card.locator('.hg-segmented-control-segment span[lang="hi"]')).toHaveText(
      LANGUAGE_META.hi.endonym,
    );
    await expect(card.getByText(W('deviceLanguage'))).toBeVisible();
    await expect(card.getByText(MARKET_DEFAULT)).toBeVisible();
    await expect(card.locator('.hg-option-card')).toHaveCount(0);
    await page.screenshot({ path: `${PICTURES}/d-default.png`, fullPage: true });
    await expect(
      card.getByRole('radiogroup', { name: W('language') }).getByRole('radio'),
    ).toHaveCount(3);
    await card.getByRole('radio', { name: LANGUAGE_META.hi.endonym }).click();
    await expect(card).toHaveAttribute('data-language', 'hi');
    await expectNoSidewaysScroll(page);
  });

  test('d-default: the name row ends with Edit name, beside the saved photo', async ({ mount }) => {
    const card = await mount(<ProfilePreferencesAsHeld reader="en" photo={PHOTO} />);
    const row = card.locator('.hg-profile-preferences-name');
    await expect(row.locator('img')).toHaveAttribute('src', PHOTO);
    const edit = row.getByRole('button', { name: W('editName') });
    const rowBox = await row.boundingBox();
    const editBox = await edit.boundingBox();
    expect(
      (rowBox?.x ?? 0) + (rowBox?.width ?? 0) - ((editBox?.x ?? 0) + (editBox?.width ?? 0)),
    ).toBeLessThanOrEqual((await resolvedLength(card.page(), '--sp-6')) + 1);
    await edit.click();
    await expect(card).toHaveAttribute('data-edit-opened', 'true');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`in ${reader} nothing clips`, async ({ mount, page }) => {
      await mount(<ProfilePreferencesAsHeld reader={reader} />);
      await expectNothingClipped(page, TEXT);
      await page.screenshot({ path: `${PICTURES}/d-${reader}.png`, fullPage: true });
    });
  }
});
