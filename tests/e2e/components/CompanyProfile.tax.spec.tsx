import { IN_PACK, inLanguage } from '@heliogrid/domain';
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_STANDING_WORD,
  createTranslator,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { bottomOf, expectNoSidewaysScroll, expectNothingClipped } from '../support/layout';
import { resolvedColour } from '../support/token';
import { CompanyProfileAsHeld } from './CompanyProfile.story';

/**
 * The company profile's tax part at the board's phone width (`SCR-M01-05`, `m-tax-invalid`;
 * `M01-25`): one field, the market's format said once — as help, or as the field's error when the
 * value does not read as a registration — and the act live whatever is typed.
 */
const en = await createTranslator('en');

test.use({ viewport: { width: 375, height: 812 } });

const COLUMN = 335;
const FIELD = 54;

const [REGISTRATION] = IN_PACK.tax.registrationTypes;
const FORMAT = REGISTRATION === undefined ? '' : inLanguage(REGISTRATION.format, 'en');
const LABEL = en.t(COMPANY_PROFILE.optional, { label: IN_PACK.formats.taxIdLabel });
const CHECKED = en.t(COMPANY_PROFILE.formatChecked);
const SAVE = en.t(COMPANY_PROFILE.saveSpoken);
const TAX = en.t(COMPANY_PROFILE_PART_TITLE.tax);
const ADDRESS = en.t(COMPANY_PROFILE_PART_TITLE.address);
const CHECK_FORMAT = en.t(COMPANY_PROFILE_STANDING_WORD.check_format);
const ADDED = en.t(COMPANY_PROFILE_STANDING_WORD.added);

/* The board's malformed value (`m-tax-invalid`): one character short. */
const ONE_SHORT = '27AAACH7409R1Z';
const WELL_FORMED = '27AAACH7409R1ZV';

const header = (profile: Locator, title: string) =>
  profile.locator('.hg-accordion-toggle').filter({ hasText: title });

test('the tax part asks one optional registration, says the market’s format as help and what was checked, and reports what is typed', async ({
  mount,
  page,
}) => {
  const profile = await mount(<CompanyProfileAsHeld reader="en" open="tax" />);
  const field = profile.getByRole('textbox', { name: LABEL });
  await expect(field).toHaveValue('');
  await expect(field).toHaveCSS('font-family', /Mono/);
  const boxes = profile.locator('.hg-input-shell');
  await expect(boxes).toHaveCount(1);
  expect(await boxes.boundingBox()).toMatchObject({ width: COLUMN, height: FIELD });

  const secondary = await resolvedColour(page, '--text-secondary');
  const format = profile.getByText(FORMAT);
  await expect(format).toHaveCount(1);
  await expect(format).toHaveCSS('color', secondary);
  expect((await format.boundingBox())?.y).toBeGreaterThanOrEqual(await bottomOf(boxes));
  await expect(profile.locator('.hg-input-error')).toHaveCount(0);
  const checked = profile.getByText(CHECKED);
  await expect(checked).toHaveCSS('color', secondary);
  expect((await checked.boundingBox())?.y).toBeGreaterThanOrEqual(await bottomOf(format));
  await expectNothingClipped(page, '.hg-text, .hg-input-label');

  await expect(profile.getByRole('button', { name: SAVE })).toBeEnabled();

  await field.fill(WELL_FORMED);
  await expect(profile.getByTestId('edits')).toHaveText(`taxRegistration=${WELL_FORMED}`);
  await field.fill('');
  await expect(profile.getByTestId('edits')).toHaveText(/\|taxRegistration=$/);
  await expectNoSidewaysScroll(page);
});

test('a malformed registration is explained at its field by the format, once; its part opens and says so, and the act stays live', async ({
  mount,
  page,
}) => {
  const profile = await mount(
    <CompanyProfileAsHeld reader="en" open={null} typed={{ taxRegistration: ONE_SHORT }} />,
  );
  const tax = header(profile, TAX);
  await expect(profile.getByTestId('open')).toHaveText('tax');
  await expect(tax).toHaveAttribute('aria-expanded', 'true');
  await expect(tax).toHaveAttribute('aria-invalid', 'true');
  await expect(tax).toContainText(CHECK_FORMAT);

  await expect(profile.getByRole('textbox', { name: LABEL })).toHaveValue(ONE_SHORT);
  const error = profile.locator('.hg-input-error');
  await expect(error).toHaveText(FORMAT);
  await expect(error).toHaveCSS('color', await resolvedColour(page, '--danger-text'));
  await expect(profile.getByText(FORMAT)).toHaveCount(1);
  await expect(profile.getByText(CHECKED)).toBeVisible();

  const act = profile.getByRole('button', { name: SAVE });
  await expect(act).toBeEnabled();
  await act.click();
  await expect(profile.getByTestId('pressed')).toHaveText('save');

  await header(profile, ADDRESS).click();
  await expect(profile.getByTestId('open')).toHaveText('address');
  await expect(tax).toHaveAttribute('aria-expanded', 'false');
  await expect(tax).toContainText(CHECK_FORMAT);
});

test('a registration the market’s format accepts has no error, keeps the format as help, and reads Added when shut', async ({
  mount,
  page,
}) => {
  const profile = await mount(
    <CompanyProfileAsHeld reader="en" open="tax" typed={{ taxRegistration: ONE_SHORT }} />,
  );
  const field = profile.getByRole('textbox', { name: LABEL });
  await expect(profile.locator('.hg-input-error')).toHaveText(FORMAT);
  await field.fill(WELL_FORMED);
  await expect(profile.locator('.hg-input-error')).toHaveCount(0);
  await expect(profile.getByText(FORMAT)).toHaveCount(1);
  await expect(header(profile, TAX)).not.toContainText(CHECK_FORMAT);

  await header(profile, TAX).click();
  await expect(header(profile, TAX)).toContainText(ADDED);
  await expect(header(profile, TAX).locator('.hg-accordion-standing-dot')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--success'),
  );
});
