import { IN_PACK } from '@heliogrid/domain';
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_SIGNUP,
  createTranslator,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { bottomOf, expectNoSidewaysScroll, expectSharedEdge, rightOf } from '../support/layout';
import { resolvedColour, resolvedLength } from '../support/token';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The company profile from the door's breakpoint (`SCR-M01-05`, `d-default`, `d-tax-invalid`): the
 * wordmark, the heading, the list and the act on one left edge at the list's wide measure, the act
 * at its natural width, and beside them a letterhead that shows only what the fields hold. The
 * positions are the brief's (rulings 10 and 31) and the RFC's frame map.
 */
const en = await createTranslator('en');

const EDITOR_LEFT = 96;
const MEASURE = 600;
const PREVIEW = { left: 880, right: 1520 };
const SHEET = { left: 980, width: 440 };
const ACT = 48;
/* A full-width act would be the measure wide; the board's is 175. */
const ACT_WIDEST = 300;
/* The phone's column, the narrowest the list is ever drawn. */
const PHONE_COLUMN = 335;

const SAVE = en.t(COMPANY_PROFILE.saveSpoken);
const TAX_LABEL = IN_PACK.formats.taxIdLabel;
const BANK_LABEL = en.t(COMPANY_PROFILE.letterheadBank);
/* The board's malformed value (`d-tax-invalid`): one character short. */
const ONE_SHORT = '27AAACH7409R1Z';
const WELL_FORMED = '27AAACH7409R1ZV';
const BANK = {
  bankName: 'HDFC Bank',
  accountName: 'Suryodaya Solar Solutions Pvt Ltd',
  accountNumber: '50100234564821',
  bankRoutingIdentifier: 'HDFC0001234',
};

const preview = (profile: Locator) => profile.locator('.hg-company-profile-preview');
const sheet = (profile: Locator) => profile.locator('.hg-company-profile-sheet');
const bars = (profile: Locator) => sheet(profile).locator('.hg-company-profile-bar');
/* The value beside a label on the sheet: the cell that follows it. */
const beside = (profile: Locator, label: string) =>
  sheet(profile).getByText(label, { exact: true }).locator('xpath=following-sibling::*[1]');

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 1000 } });

  test('everything the owner fills stands on one left edge at the list’s measure, the act at its own width, and the letterhead in its track', async ({
    mount,
    page,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" />);
    const title = profile.getByRole('heading', { level: 1 });
    const lede = profile.getByText(en.t(COMPANY_PROFILE.lede));
    const headers = profile.locator('.hg-accordion-toggle');
    const field = profile.locator('.hg-input-shell');
    const act = profile.getByRole('button', { name: SAVE });
    await expect(headers).toHaveCount(5);

    await expectSharedEdge(
      [profile.locator('.hg-door-wordmark-desktop'), title, lede, headers.first(), field, act],
      'left',
    );
    expect((await title.boundingBox())?.x).toBe(EDITOR_LEFT);
    for (const header of await headers.all()) {
      expect(await header.boundingBox()).toMatchObject({ x: EDITOR_LEFT, width: MEASURE });
    }
    expect(await field.boundingBox()).toMatchObject({ x: EDITOR_LEFT, width: MEASURE });

    const actBox = await act.boundingBox();
    expect(actBox?.height).toBe(ACT);
    expect(actBox?.width).toBeLessThan(ACT_WIDEST);

    await expect(title).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-h1')}px`);
    expect((await lede.boundingBox())?.y).toBe(
      (await bottomOf(title)) + (await resolvedLength(page, '--sp-3')),
    );
    expect((await headers.first().boundingBox())?.y).toBe(
      (await bottomOf(lede)) + (await resolvedLength(page, '--sp-8')),
    );

    const previewBox = await preview(profile).boundingBox();
    expect(previewBox?.x).toBe(PREVIEW.left);
    expect(await rightOf(preview(profile))).toBe(PREVIEW.right);
    expect(await sheet(profile).boundingBox()).toMatchObject({ x: SHEET.left, width: SHEET.width });
    await expectNoSidewaysScroll(page);
  });

  test('a new company’s letterhead holds its name and its city, a bar for each part not added, and nothing a person can reach', async ({
    mount,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" />);
    await expect(preview(profile)).toHaveAttribute('aria-hidden', 'true');
    await expect(
      preview(profile).locator('a, button, input, select, textarea, [tabindex]'),
    ).toHaveCount(0);
    await expect(preview(profile).getByText(en.t(COMPANY_PROFILE.letterhead))).toBeVisible();
    await expect(sheet(profile).getByText(en.t(COMPANY_PROFILE.letterheadLogo))).toBeVisible();
    await expect(sheet(profile).getByText('Suryodaya Solar Solutions Pvt Ltd')).toBeVisible();
    await expect(sheet(profile).getByText('Pune', { exact: true })).toBeVisible();
    await expect(beside(profile, TAX_LABEL)).toHaveClass(/hg-company-profile-bar/);
    await expect(beside(profile, BANK_LABEL)).toHaveClass(/hg-company-profile-bar/);
  });

  test('the letterhead fills as its fields are typed: the address as one line, a registration that reads well, the bank only with all four facts', async ({
    mount,
    page,
  }) => {
    const profile = await mount(
      <CompanyProfileAsHeld
        reader="en"
        open="address"
        typed={{ taxRegistration: WELL_FORMED, ...BANK, bankRoutingIdentifier: '' }}
      />,
    );
    await profile.getByRole('textbox', { name: en.t(COMPANY_PROFILE.postalCode) }).fill('411045');
    await expect(sheet(profile).getByText('Pune 411045', { exact: true })).toBeVisible();
    await profile
      .getByRole('textbox', { name: en.t(COMPANY_PROFILE.street) })
      .fill('Plot 14, Baner Road');
    await expect(sheet(profile).getByText('Plot 14, Baner Road, Pune 411045')).toBeVisible();

    const registration = beside(profile, TAX_LABEL);
    await expect(registration).toHaveText(WELL_FORMED);
    await expect(registration).toHaveCSS('font-family', /Mono/);
    await expect(registration).toHaveCSS('color', await resolvedColour(page, '--text-primary'));

    await expect(beside(profile, BANK_LABEL)).toHaveClass(/hg-company-profile-bar/);
    await profile
      .locator('.hg-accordion-toggle')
      .filter({ hasText: en.t(COMPANY_PROFILE_PART_TITLE.bank) })
      .click();
    await profile
      .getByRole('textbox', { name: IN_PACK.formats.bankRoutingLabel })
      .fill('HDFC0001234');
    await expect(beside(profile, BANK_LABEL)).toHaveText(
      en.t(COMPANY_PROFILE.letterheadBankLine, { bankName: 'HDFC Bank', ending: '4821' }),
    );
  });

  test('a registration that does not read as the format shows on the letterhead as typed, in the danger tone, and the act stays live', async ({
    mount,
    page,
  }) => {
    const profile = await mount(
      <CompanyProfileAsHeld reader="en" open="tax" typed={{ taxRegistration: ONE_SHORT }} />,
    );
    const header = profile
      .locator('.hg-accordion-toggle')
      .filter({ hasText: en.t(COMPANY_PROFILE_PART_TITLE.tax) });
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(header).toHaveAttribute('aria-invalid', 'true');
    expect(await profile.locator('.hg-input-shell').boundingBox()).toMatchObject({
      x: EDITOR_LEFT,
      width: MEASURE,
    });
    const registration = beside(profile, TAX_LABEL);
    await expect(registration).toHaveText(ONE_SHORT);
    await expect(registration).toHaveCSS('font-family', /Mono/);
    await expect(registration).toHaveCSS('color', await resolvedColour(page, '--danger-text'));
    await expect(bars(profile)).toHaveCount(7);

    const act = profile.getByRole('button', { name: SAVE });
    await expect(act).toBeEnabled();
    expect((await act.boundingBox())?.x).toBe(EDITOR_LEFT);
    await act.click();
    await expect(profile.getByTestId('pressed')).toHaveText('save');
  });
});

test.describe('at the door’s breakpoint', () => {
  test.use({ viewport: { width: 968, height: 800 } });

  test('both halves fit: the list no narrower than a phone’s, the sheet whole, nothing scrolling sideways', async ({
    mount,
    page,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" />);
    const header = profile.locator('.hg-accordion-toggle').first();
    expect((await header.boundingBox())?.width).toBeGreaterThanOrEqual(PHONE_COLUMN);
    expect(await rightOf(header)).toBeLessThanOrEqual(
      (await preview(profile).boundingBox())?.x ?? 0,
    );
    expect((await sheet(profile).boundingBox())?.width).toBe(SHEET.width);
    expect(await rightOf(sheet(profile))).toBeLessThanOrEqual(await rightOf(preview(profile)));
    await expectNoSidewaysScroll(page);
  });
});

test.describe('one pixel under the breakpoint', () => {
  test.use({ viewport: { width: 967, height: 800 } });

  test('the phone’s column stands alone: no letterhead, and the act as wide as the list', async ({
    mount,
    page,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" />);
    await expect(preview(profile)).toBeHidden();
    const header = profile.locator('.hg-accordion-toggle').first();
    const act = profile.getByRole('button', { name: SAVE });
    expect((await act.boundingBox())?.width).toBe((await header.boundingBox())?.width);
    await expect(
      profile.getByRole('textbox', { name: en.t(COMPANY_SIGNUP.companyName) }),
    ).toBeVisible();
    await expectNoSidewaysScroll(page);
  });
});
