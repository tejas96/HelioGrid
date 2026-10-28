import { COMPANY_LOGO_LIMITS, companyLogoRefusal } from '@heliogrid/domain';
import {
  COMPANY_LOGO,
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_STANDING_WORD,
  COMPANY_SIGNUP,
  companyLogoWords,
  createTranslator,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { REFUSED_IMAGE } from '../support/company-logo';
import { expectNoSidewaysScroll, expectNothingClipped, settledBox } from '../support/layout';
import { resolvedColour } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The logo's capture area on the company profile (`SCR-M01-05`: `m-default`, `m-logo-invalid`,
 * `m-normal`'s first part, `d-default`): off until a screen can upload, then at rest, refused and
 * held; the hint by pointer, and the letterhead's tile.
 */
const en = await createTranslator('en');

const PHONE = { width: 375, height: 812 };
const WIDE = { width: 1536, height: 1000 };

/* The area's words as the catalog gives them; the story's refused image misses both limits. */
const WORDS = companyLogoWords(en.t, {
  limits: COMPANY_LOGO_LIMITS,
  refusal: companyLogoRefusal(REFUSED_IMAGE, COMPANY_LOGO_LIMITS),
});
const LIMITS = WORDS.limits;
const TAP = en.t(COMPANY_LOGO.hinted, { how: WORDS.hintTouch, limits: LIMITS });
const DROP = en.t(COMPANY_LOGO.hinted, { how: WORDS.hintDrop, limits: LIMITS });
const REFUSAL = WORDS.refusal ?? '';
const IDENTITY = en.t(COMPANY_PROFILE_PART_TITLE.identity);
const ADDRESS = en.t(COMPANY_PROFILE_PART_TITLE.address);
const SAVE = en.t(COMPANY_PROFILE.saveSpoken);
/** A one-pixel picture: the tile and the thumbnail only need something to draw. */
const PICTURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const header = (profile: Locator, title: string) =>
  profile.locator('.hg-accordion-toggle').filter({ hasText: title });
const area = (profile: Locator) => profile.locator('.hg-dropzone');

test.describe('at 375, under a finger', () => {
  test.use({ viewport: PHONE, hasTouch: true });

  test('a screen that cannot upload yet holds the company name alone', async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" />);
    await expect(profile.getByLabel(en.t(COMPANY_SIGNUP.companyName))).toBeVisible();
    await expect(area(profile)).toHaveCount(0);
  });

  test('at rest the area stands above the name, states the limits, offers only what is taken, and reports the file chosen', async ({
    mount,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" logo="empty" />);
    await expect(area(profile).locator('.hg-dropzone-label')).toHaveText(WORDS.add);
    await expect(area(profile).locator('.hg-dropzone-line')).toHaveText(TAP);
    const name = profile.getByLabel(en.t(COMPANY_SIGNUP.companyName));
    const areaBox = await settledBox(area(profile));
    const nameBox = await settledBox(name);
    expect((areaBox?.y ?? 0) + (areaBox?.height ?? 0)).toBeLessThanOrEqual(nameBox?.y ?? 0);

    const input = area(profile).locator('input[type="file"]');
    await expect(input).toHaveAttribute('accept', 'image/png,image/jpeg');
    await expect(input).not.toHaveAttribute('multiple', /.*/);
    await input.setInputFiles({
      name: 'suryodaya-logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('logo'),
    });
    await expect(profile.getByTestId('chosen')).toHaveText('suryodaya-logo.png:image/png');

    // None of `Dropzone`'s own English is reached: every word it shows was handed to it.
    await expect(profile.getByText(/Add roof photos|tap to browse|That file is over/i)).toHaveCount(
      0,
    );
    await expect(area(profile).locator('.hg-dropzone-error')).toHaveCount(0);
    await expect(area(profile).locator('.hg-dropzone-thumb')).toHaveCount(0);
  });

  test('a refused image is told what it missed under the area, in the danger tone, and nothing else is taken away', async ({
    mount,
    page,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" logo="refused" />);
    const refusal = area(profile).getByRole('alert');
    await expect(refusal).toHaveText(REFUSAL);
    await expect(refusal).toHaveCSS('color', await resolvedColour(page, '--danger-text'));
    await expect(area(profile).locator('.hg-dropzone-label')).toHaveText(WORDS.add);
    await expect(area(profile).locator('.hg-dropzone-line')).toHaveText(TAP);
    await expect(profile.getByRole('button', { name: SAVE })).toBeEnabled();
    await header(profile, ADDRESS).click();
    await expect(header(profile, IDENTITY)).toContainText(
      en.t(COMPANY_PROFILE_STANDING_WORD.name_only),
    );
  });

  test('a held logo is named, keeps the limits alone, shows one thumbnail and no way to take it out', async ({
    mount,
  }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" logo="held" picture={PICTURE} />);
    await expect(area(profile).locator('.hg-dropzone-label')).toHaveText(WORDS.held);
    await expect(area(profile).locator('.hg-dropzone-line')).toHaveText(LIMITS);
    await expect(area(profile).locator('.hg-dropzone-thumb')).toHaveCount(1);
    await expect(area(profile).getByRole('img', { name: WORDS.held })).toHaveAttribute(
      'src',
      PICTURE,
    );
    await expect(area(profile).locator('.hg-dropzone-thumb-remove')).toHaveCount(0);
    await header(profile, ADDRESS).click();
    await expect(header(profile, IDENTITY)).toContainText(
      en.t(COMPANY_PROFILE_STANDING_WORD.added),
    );
  });

  test('a held logo with no picture yet shows its thumbnail without one', async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" logo="held" />);
    await expect(area(profile).locator('.hg-dropzone-thumb')).toHaveCount(1);
    await expect(area(profile).locator('img')).toHaveCount(0);
  });

  test('the capture surface meets the touch floor', async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" logo="empty" />);
    await expectTouchFloor([area(profile).locator('.hg-dropzone-surface')]);
  });
});

test.describe('at 1536', () => {
  test.use({ viewport: WIDE });

  test('a pointer is told it can drop a file', async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" logo="empty" />);
    await expect(area(profile).locator('.hg-dropzone-line')).toHaveText(DROP);
  });

  test('the letterhead’s tile holds a word until the screen has the logo’s picture, then the picture alone', async ({
    mount,
  }) => {
    const tile = (profile: Locator) => profile.locator('.hg-company-profile-sheet-logo');
    const without = await mount(<CompanyProfileAsHeld reader="en" logo="held" />);
    await expect(tile(without)).toHaveText(en.t(COMPANY_PROFILE.letterheadLogo));
    await expect(tile(without).locator('img')).toHaveCount(0);
    await without.unmount();

    const withPicture = await mount(
      <CompanyProfileAsHeld reader="en" logo="held" picture={PICTURE} />,
    );
    await expect(tile(withPicture)).toHaveText('');
    const picture = tile(withPicture).locator('img');
    await expect(picture).toHaveAttribute('src', PICTURE);
    expect(await settledBox(picture)).toEqual(await settledBox(tile(withPicture)));
    await expect(withPicture.locator('.hg-company-profile-preview')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});

test.describe('at 1536, under a finger', () => {
  test.use({ viewport: WIDE, hasTouch: true });

  test('a finger is told to tap, whatever the width', async ({ mount }) => {
    const profile = await mount(<CompanyProfileAsHeld reader="en" logo="empty" />);
    await expect(area(profile).locator('.hg-dropzone-line')).toHaveText(TAP);
  });
});

for (const reader of ['hi', 'mr'] as const) {
  for (const viewport of [PHONE, WIDE]) {
    test.describe(`in ${reader} at ${viewport.width}`, () => {
      test.use({ viewport });

      test('the refused state clips nothing, scrolls nowhere sideways and keeps the act on screen', async ({
        mount,
        page,
      }) => {
        const profile = await mount(<CompanyProfileAsHeld reader={reader} logo="refused" />);
        await expect(area(profile).getByRole('alert')).toBeVisible();
        await expectNothingClipped(
          page,
          '.hg-text, .hg-dropzone-label, .hg-dropzone-line, .hg-dropzone-error',
        );
        await expect(profile.locator('.hg-door-footer').getByRole('button')).toBeInViewport();
        await expectNoSidewaysScroll(page);
      });
    });
  }
}
