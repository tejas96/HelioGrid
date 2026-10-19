import { join } from 'node:path';
import {
  backToSettings,
  COMPANY_PROFILE,
  createTranslator,
  SIGN_IN,
  settingsRowName,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { bottomOf, expectNoSidewaysScroll } from '../support/layout';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The company profile's settings life (`SCR-M01-05`, `m-settings`, `d-settings`; the brief's
 * rulings 54–56): titled by the row that opens it, the parts at the functional density while every
 * field keeps its size, and `Save changes` after the list. The sizes are the brief's
 * (rulings 55–57, `d-settings`).
 */
const readers = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};
const { en } = readers;

const HEADER = 56;
const CARD = 70;
const FIELD = 54;
const ACT = 48;
const SAVE = en.t(COMPANY_PROFILE.saveChangesSpoken);
const TITLE = settingsRowName(en.t, 'company_profile');
/* One picture per language and width, so the fit can be seen by eye. */
const PICTURES = join(import.meta.dirname, '../../../.qa/components/company-profile-settings');

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('titled by its row, the parts drawn tight, the size field at its own size, and the act after the list with the re-seed line', async ({
    mount,
    page,
  }) => {
    const profile = await mount(
      <CompanyProfileAsHeld reader="en" life="settings" open="declarations" />,
    );
    await expect(profile.getByRole('heading', { level: 1 })).toHaveText(TITLE);
    await expect(profile.getByText(en.t(COMPANY_PROFILE.settingsLede))).toBeVisible();
    await expect(profile.locator('.hg-door')).toHaveCount(0);

    const headers = profile.locator('.hg-accordion-toggle');
    await expect(headers).toHaveCount(5);
    for (const header of await headers.all()) {
      expect((await header.boundingBox())?.height).toBe(HEADER);
    }
    for (const card of await profile.getByRole('radio').all()) {
      // The record measures whole pixels; the card draws a half one under it.
      expect(Math.round((await card.boundingBox())?.height ?? 0)).toBe(CARD);
    }
    expect((await profile.locator('.hg-number-field-box').boundingBox())?.height).toBe(FIELD);

    const act = profile.getByRole('button', { name: SAVE });
    await expect(act).toHaveText(en.t(COMPANY_PROFILE.saveChanges));
    expect((await act.boundingBox())?.height).toBe(ACT);
    expect((await act.boundingBox())?.y).toBeGreaterThan(await bottomOf(headers.last()));
    const line = profile.getByText(en.t(COMPANY_PROFILE.reseedScope));
    expect((await line.boundingBox())?.y).toBeGreaterThan(await bottomOf(act));
    await expect(profile.getByRole('button', { name: en.t(COMPANY_PROFILE.onward) })).toHaveCount(
      0,
    );

    await act.click();
    await expect(profile.getByTestId('pressed')).toHaveText('save');
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/en-375.png`, fullPage: true });
  });

  test('every text field keeps its size in settings', async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" life="settings" open="bank" />);
    const fields = profile.locator('.hg-input-shell');
    await expect(fields).toHaveCount(4);
    for (const field of await fields.all()) {
      expect((await field.boundingBox())?.height).toBe(FIELD);
    }
  });

  test('where the phone’s bar holds the title, the page draws none and starts with its line', async ({
    mount,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" life="settings" titleInBar />);
    await expect(profile.getByRole('heading', { level: 1 })).toHaveCount(0);
    await expect(profile.getByText(en.t(COMPANY_PROFILE.settingsLede))).toBeVisible();
  });

  test('a failed save says so once at the same act, with no way on without it', async ({
    mount,
  }) => {
    const profile = await mount(
      <CompanyProfileAsHeld reader="en" life="settings" status="save-failed" />,
    );
    await expect(profile.getByRole('alert')).toHaveText(en.t(COMPANY_PROFILE.notSaved));
    await expect(profile.getByRole('button', { name: SAVE })).toHaveText(
      en.t(COMPANY_PROFILE.saveChanges),
    );
    await expect(profile.locator('.hg-company-profile-act').getByRole('button')).toHaveCount(1);
  });

  test('a profile that could not be read offers the retry alone', async ({ mount }) => {
    const profile = await mount(
      <CompanyProfileAsHeld reader="en" life="settings" status="unread" />,
    );
    await expect(profile.getByText(en.t(COMPANY_PROFILE.unreadTitle))).toBeVisible();
    await expect(profile.getByRole('button')).toHaveCount(1);
    await profile.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
    await expect(profile.getByTestId('pressed')).toHaveText('retry-read');
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`reads in ${reader}: the row’s title, the act and the re-seed line`, async ({
      mount,
      page,
    }) => {
      const { t } = readers[reader];
      const profile = await mount(
        <CompanyProfileAsHeld reader={reader} life="settings" open="declarations" />,
      );
      await expect(profile.getByRole('heading', { level: 1 })).toHaveText(
        settingsRowName(t, 'company_profile'),
      );
      await expect(
        profile.getByRole('button', { name: t(COMPANY_PROFILE.saveChangesSpoken) }),
      ).toHaveText(t(COMPANY_PROFILE.saveChanges));
      await expect(profile.getByText(t(COMPANY_PROFILE.reseedScope))).toBeVisible();
      expect(backToSettings(t)).not.toBe(backToSettings(en.t));
      await expectNoSidewaysScroll(page);
      await page.screenshot({ path: `${PICTURES}/${reader}-375.png`, fullPage: true });
    });
  }
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('the list at the settings measure, the act at its own width under it with its line beside, and the letterhead in its track', async ({
    mount,
    page,
  }) => {
    const profile = await mount(
      <CompanyProfileAsHeld reader="en" life="settings" open="declarations" />,
    );
    const headers = profile.locator('.hg-accordion-toggle');
    for (const header of await headers.all()) {
      expect((await header.boundingBox())?.width).toBe(640);
    }
    const act = profile.getByRole('button', { name: SAVE });
    const actBox = await act.boundingBox();
    expect(actBox?.height).toBe(ACT);
    expect(actBox?.width).toBeLessThan(300);
    expect(actBox?.y).toBeGreaterThan(await bottomOf(headers.last()));
    const line = await profile.getByText(en.t(COMPANY_PROFILE.reseedScope)).boundingBox();
    expect(line?.x).toBeGreaterThan((actBox?.x ?? 0) + (actBox?.width ?? 0));
    await expect(profile.locator('.hg-company-profile-preview')).toBeVisible();
    await expectNoSidewaysScroll(page);
    await page.screenshot({ path: `${PICTURES}/en-1536.png`, fullPage: true });
  });

  test('beside the settings side list at a narrower window the room is too small for both: the column takes it and the letterhead steps aside', async ({
    mount,
    page,
  }) => {
    // The room a 1015 window leaves beside the rail and the 248 side list.
    const profile = await mount(
      <div style={{ width: 599 }}>
        <CompanyProfileAsHeld reader="en" life="settings" open="declarations" />
      </div>,
    );
    await expect(profile.locator('.hg-company-profile-preview')).toBeHidden();
    const room = (await profile.locator('.hg-company-profile-room').boundingBox())?.width;
    expect((await profile.locator('.hg-company-profile-page').boundingBox())?.width).toBe(room);
    await expectNoSidewaysScroll(page);
  });

  for (const reader of ['hi', 'mr'] as const) {
    test(`reads in ${reader} at 1536 with nothing pushed sideways`, async ({ mount, page }) => {
      const { t } = readers[reader];
      const profile = await mount(
        <CompanyProfileAsHeld reader={reader} life="settings" open="declarations" />,
      );
      await expect(profile.getByRole('heading', { level: 1 })).toHaveText(
        settingsRowName(t, 'company_profile'),
      );
      await expect(profile.getByText(t(COMPANY_PROFILE.reseedScope))).toBeVisible();
      await expectNoSidewaysScroll(page);
      await page.screenshot({ path: `${PICTURES}/${reader}-1536.png`, fullPage: true });
    });
  }
});
