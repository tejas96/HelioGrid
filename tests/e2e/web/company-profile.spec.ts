import { IN_PACK, inLanguage } from '@heliogrid/domain';
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_STANDING_WORD,
  COMPANY_SIGNUP,
  createTranslator,
  SHELL,
  SIGN_IN,
} from '@heliogrid/i18n';
import { expect, type Page, type Request, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import {
  abortWrites,
  companyProfileAct,
  passWhatYouSellStep,
  reachCompanyProfileStep,
  reachWhatYouSellStep,
} from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';

/**
 * The company profile a new owner meets after the what-you-sell step (`SCR-M01-05`; `M01-24`,
 * `M01-25`). Like the steps before it has no address of its own: the inside group's gate draws it
 * where the shell would be, so this file is named for the screen and holds no look — the screen's
 * measures are `components/CompanyProfile*.spec.tsx`'s.
 */
const en = await createTranslator('en');

const theProfile = '**/settings/business-profile';
const theRegistrations = '**/settings/tax-registrations';
/* The data layer tries a failed read three times, a second apart and then two, before it gives up. */
const afterTheRetries = { timeout: 15_000 };

const [REGISTRATION] = IN_PACK.tax.registrationTypes;
const FORMAT = REGISTRATION === undefined ? '' : inLanguage(REGISTRATION.format, 'en');
/* A registration number as its owner types it, never a word of the product's. */
const WELL_FORMED = '27AAACH7409R1ZV';
const ONE_SHORT = '27AAACH7409R1Z';

const heading = (page: Page) => page.getByRole('heading', { name: en.t(COMPANY_PROFILE.title) });
const shell = (page: Page) => page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });
const parts = (page: Page) => page.locator('.hg-accordion-toggle');
const part = (page: Page, key: keyof typeof COMPANY_PROFILE_PART_TITLE) =>
  parts(page).filter({ hasText: en.t(COMPANY_PROFILE_PART_TITLE[key]) });
const field = (page: Page, name: string) => page.getByRole('textbox', { name });
const street = (page: Page) => field(page, en.t(COMPANY_PROFILE.street));
const taxNumber = (page: Page) =>
  field(page, en.t(COMPANY_PROFILE.optional, { label: IN_PACK.formats.taxIdLabel }));

const endsWith = (path: string) => (request: Request) =>
  request.method() === 'PUT' && request.url().endsWith(path);
/** Every write the page sends from here on, by the end of its address. */
function writesOf(page: Page): string[] {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PUT') writes.push(new URL(request.url()).pathname);
  });
  return writes;
}
const wroteTo = (writes: readonly string[], path: string) =>
  writes.some((write) => write.endsWith(path));

test('a new owner meets the company profile after what-you-sell: five parts, the name read back, and a live act that records the step skipped and opens the home', async ({
  page,
}) => {
  const company = await reachCompanyProfileStep(page, en, freshMobile());
  await expect(parts(page)).toHaveCount(5);
  await expect(part(page, 'identity')).toHaveAttribute('aria-expanded', 'true');
  await expect(field(page, en.t(COMPANY_SIGNUP.companyName))).toHaveValue(company);
  await expect(part(page, 'address')).toContainText(
    en.t(COMPANY_PROFILE_STANDING_WORD.city_only, { city: 'Pune' }),
  );
  await expect(part(page, 'declarations')).toContainText(
    en.t(COMPANY_PROFILE_STANDING_WORD.answered),
  );
  await expect(shell(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  const writes = writesOf(page);
  const recorded = page.waitForRequest(endsWith('/onboarding/progress/business_profile'));
  await companyProfileAct(page, en).click();
  expect((await recorded).postDataJSON()).toEqual({ state: 'skipped' });
  await expect(shell(page)).toBeVisible();
  // Nothing typed changes no registration, so that list is not written.
  expect(writes.map((write) => write.split('/').slice(-2).join('/'))).toEqual([
    'settings/business-profile',
    'progress/business_profile',
  ]);

  await page.reload();
  await expect(shell(page)).toBeVisible();
  await expect(heading(page)).toHaveCount(0);
});

test('a malformed tax number is explained at its field against the market’s format, and never stops the save', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  await part(page, 'tax').click();
  await taxNumber(page).fill(ONE_SHORT);

  await expect(page.getByText(FORMAT)).toHaveCount(1);
  await expect(page.locator('.hg-input-error')).toHaveText(FORMAT);
  await expect(part(page, 'tax')).toHaveAttribute('aria-invalid', 'true');
  await expect(part(page, 'tax')).toContainText(en.t(COMPANY_PROFILE_STANDING_WORD.check_format));
  await expect(companyProfileAct(page, en)).not.toHaveAttribute('aria-disabled', 'true');
  await expectNoSeriousViolations(page);

  const writes = writesOf(page);
  await companyProfileAct(page, en).click();
  await expect(shell(page)).toBeVisible();
  expect(wroteTo(writes, '/settings/business-profile')).toBe(true);
  expect(wroteTo(writes, '/settings/tax-registrations')).toBe(false);
});

test('what the owner types is what is saved: the address, a tax number taken in capitals, and a bank fact typed half way', async ({
  page,
}) => {
  const company = await reachCompanyProfileStep(page, en, freshMobile());
  await part(page, 'address').click();
  await street(page).fill('Plot 14, Baner Road');
  await field(page, en.t(COMPANY_PROFILE.postalCode)).fill('411045');
  await part(page, 'tax').click();
  await taxNumber(page).fill(WELL_FORMED.toLowerCase());
  await part(page, 'bank').click();
  await field(page, en.t(COMPANY_PROFILE.bankName)).fill('HDFC Bank');
  await part(page, 'bank').click();
  await expect(part(page, 'tax')).toContainText(en.t(COMPANY_PROFILE_STANDING_WORD.added));
  await expect(part(page, 'bank')).toContainText(en.t(COMPANY_PROFILE_STANDING_WORD.not_added));

  const profile = page.waitForRequest(endsWith('/settings/business-profile'));
  const registrations = page.waitForRequest(endsWith('/settings/tax-registrations'));
  const recorded = page.waitForRequest(endsWith('/onboarding/progress/business_profile'));
  await companyProfileAct(page, en).click();
  expect((await profile).postDataJSON()).toMatchObject({
    address: 'Plot 14, Baner Road',
    postalCode: '411045',
    bankDetails: null,
    bankDetailsTyped: {
      bankName: 'HDFC Bank',
      accountName: company,
      accountNumber: null,
      bankRoutingIdentifier: null,
    },
  });
  expect((await registrations).postDataJSON()).toEqual({
    registrations: [{ registrationType: REGISTRATION?.type, value: WELL_FORMED }],
  });
  expect((await recorded).postDataJSON()).toEqual({ state: 'completed' });
  await expect(shell(page)).toBeVisible();
  // In setup the next step is the answer: no saved toast (`SCR-M01-05` ruling 59).
  await expect(page.getByText(en.t(COMPANY_PROFILE.saved), { exact: true })).toHaveCount(0);
});

test('a profile that cannot be read is not a wall: Try again reads it, and the parts appear', async ({
  page,
}) => {
  await reachWhatYouSellStep(page, en, freshMobile());
  await page.route(theRegistrations, (route) => route.abort());
  await passWhatYouSellStep(page, en);

  await expect(page.getByText(en.t(COMPANY_PROFILE.unreadTitle))).toBeVisible(afterTheRetries);
  await expect(page.getByText(en.t(COMPANY_PROFILE.unreadLine))).toBeVisible();
  await expect(
    page.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnreadSpoken) }),
  ).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.unroute(theRegistrations);
  await page.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
  await expect(heading(page)).toBeVisible();
  await expect(parts(page)).toHaveCount(5);
});

test('a save that fails keeps what was typed and says so once; Try again saves it and opens the home', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  await abortWrites(page, theProfile);
  await part(page, 'address').click();
  await street(page).fill('Plot 14, Baner Road');
  await companyProfileAct(page, en).click();

  const alert = page.getByRole('alert').filter({ hasText: en.t(COMPANY_PROFILE.notSaved) });
  await expect(alert).toHaveCount(1);
  await expect(street(page)).toHaveValue('Plot 14, Baner Road');
  await expect(part(page, 'address')).toHaveAttribute('aria-expanded', 'true');
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.unroute(theProfile);
  const saved = page.waitForRequest(endsWith('/settings/business-profile'));
  await page.getByRole('button', { name: en.t(COMPANY_PROFILE.retrySaveSpoken) }).click();
  expect((await saved).postDataJSON()).toMatchObject({ address: 'Plot 14, Baner Road' });
  await expect(shell(page)).toBeVisible();
});

test('a save that lands half way is sent again whole: the profile is stored, the registrations fail, and Try again writes them and opens the home', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  await abortWrites(page, theRegistrations);
  await part(page, 'tax').click();
  await taxNumber(page).fill(WELL_FORMED);
  await companyProfileAct(page, en).click();
  await expect(
    page.getByRole('alert').filter({ hasText: en.t(COMPANY_PROFILE.notSaved) }),
  ).toHaveCount(1);
  await expect(taxNumber(page)).toHaveValue(WELL_FORMED);

  await page.unroute(theRegistrations);
  const registrations = page.waitForRequest(endsWith('/settings/tax-registrations'));
  await page.getByRole('button', { name: en.t(COMPANY_PROFILE.retrySaveSpoken) }).click();
  expect((await registrations).postDataJSON()).toEqual({
    registrations: [{ registrationType: REGISTRATION?.type, value: WELL_FORMED }],
  });
  await expect(shell(page)).toBeVisible();
});

test('after a failed save, Continue without it opens the home with nothing written, and the next visit asks again', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  await abortWrites(page, theProfile);
  await part(page, 'address').click();
  await street(page).fill('Plot 14, Baner Road');
  await companyProfileAct(page, en).click();
  await page.getByRole('button', { name: en.t(COMPANY_PROFILE.onwardUnsavedSpoken) }).click();
  await expect(shell(page)).toBeVisible();
  await page.unroute(theProfile);

  // Putting the step off lasts for the session: a fresh load asks again, and nothing typed was stored.
  await page.reload();
  await expect(heading(page)).toBeVisible();
  await part(page, 'address').click();
  await expect(street(page)).toHaveValue('');
});
