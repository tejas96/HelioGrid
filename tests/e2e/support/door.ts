import { OTP_LENGTH } from '@heliogrid/domain';
import {
  COMPANY_PROFILE,
  COMPANY_SIGNUP,
  inviteWords,
  SETUP_LANGUAGE,
  SETUP_WHAT_YOU_SELL,
  SIGN_IN,
  setupInviteWords,
  type Translator,
} from '@heliogrid/i18n';
import { expect, type Page } from '@playwright/test';
import { codeSentTo } from './api-log';
import { expectNoSidewaysScroll } from './layout';
import type { freshMobile } from './phone';

type Mobile = ReturnType<typeof freshMobile>;

/**
 * Every flow's owner. One fixed name, since a look draws it: only the number must be fresh, and a
 * name carrying the run's number changes the route's pixels on every run.
 */
export const OWNER_NAME = 'Asha Patil';

/**
 * Types the number and asks for its code, on either door (`/login`, `/company-signup`), and
 * returns the code the api sent. The clock is read before the press, so the code is this
 * request's and never an older one's.
 */
export async function requestCode(page: Page, t: Translator, mobile: Mobile): Promise<string> {
  const since = Date.now();
  await page.getByRole('textbox', { name: t.t(SIGN_IN.mobileNumber) }).fill(mobile.national);
  await page.getByRole('button', { name: t.t(SIGN_IN.sendCode) }).click();
  return codeSentTo(mobile.e164, since);
}

/**
 * Waits for the number field to draw its focus ring. The page's HTML focuses the field before React
 * hydrates it; the ring follows only once `PhoneField` has mounted, so a check of focus alone
 * can pass on a field that is not yet ringed.
 */
export async function expectNumberFieldRinged(page: Page, t: Translator): Promise<void> {
  const field = page.getByRole('textbox', { name: t.t(SIGN_IN.mobileNumber) });
  await expect(page.locator('[data-fb-focused]', { has: field })).toBeVisible();
}

/** Types a code into the code step's boxes, which move on to the next box by themselves. */
export async function typeCode(page: Page, t: Translator, code: string): Promise<void> {
  const boxes = page.getByRole('group', { name: t.t(SIGN_IN.codeLabel, { n: OTP_LENGTH }) });
  await boxes.getByRole('textbox').first().click();
  await page.keyboard.type(code);
}

/**
 * A new number through the signup door's first two steps — the number and its code — to the
 * company step, where the three details are filled and nothing is pressed yet.
 */
export async function fillCompanyStep(
  page: Page,
  t: Translator,
  mobile: Mobile,
  company: string,
): Promise<void> {
  await page.goto('/company-signup');
  await expect(
    page.getByRole('heading', { name: t.t(COMPANY_SIGNUP.createYourCompany) }),
  ).toBeVisible();
  await expectNoSidewaysScroll(page);

  const code = await requestCode(page, t, mobile);
  await typeCode(page, t, code);
  await page.getByRole('button', { name: t.t(COMPANY_SIGNUP.verifyAndContinue) }).click();

  await fillCompanyDetails(page, t, company);
  await expectNoSidewaysScroll(page);
}

/** The company step's three details, typed and nothing pressed: the owner is `OWNER_NAME`. */
export async function fillCompanyDetails(
  page: Page,
  t: Translator,
  company: string,
): Promise<void> {
  await page.getByRole('textbox', { name: t.t(COMPANY_SIGNUP.companyName) }).fill(company);
  await page.getByRole('textbox', { name: t.t(COMPANY_SIGNUP.yourName) }).fill(OWNER_NAME);
  await page.getByRole('textbox', { name: t.t(COMPANY_SIGNUP.city) }).fill('Pune');
}

/**
 * A new number through the signup door's three steps — the number, its code, the company — to the
 * language step every new owner meets once (`SCR-M01-03`), with nothing pressed there. Answers the
 * company's name.
 */
export async function reachLanguageStep(
  page: Page,
  t: Translator,
  mobile: Mobile,
): Promise<string> {
  const company = `E2E ${mobile.national}`;
  await fillCompanyStep(page, t, mobile, company);
  await page.getByRole('button', { name: t.t(COMPANY_SIGNUP.createCompany) }).click();
  await expect(page.getByRole('heading', { name: t.t(SETUP_LANGUAGE.title) })).toBeVisible();
  return company;
}

/**
 * The language step passed as it stands: Continue records it, and the next setup step takes its
 * place at the same address.
 */
export async function passLanguageStep(page: Page, t: Translator): Promise<void> {
  const step = page.getByRole('heading', { name: t.t(SETUP_LANGUAGE.title) });
  await expect(step).toBeVisible();
  await page.getByRole('button', { name: t.t(SETUP_LANGUAGE.continue) }).click();
  await expect(step).toBeHidden();
  await expect(page).toHaveURL(/\/home$/);
}

/**
 * A new number through signup and the language step to the what-you-sell step every new owner
 * meets next (`SCR-M01-04`), with nothing answered there. Answers the company's name.
 */
export async function reachWhatYouSellStep(
  page: Page,
  t: Translator,
  mobile: Mobile,
): Promise<string> {
  const company = await reachLanguageStep(page, t, mobile);
  await passLanguageStep(page, t);
  await expect(page.getByRole('heading', { name: t.t(SETUP_WHAT_YOU_SELL.title) })).toBeVisible();
  return company;
}

/** The step's two answers given and nothing pressed: the first kind of business, and a size. */
export async function answerWhatYouSell(page: Page, t: Translator, kwp = '5'): Promise<void> {
  await page.getByRole('radio').first().click();
  const size = page.getByRole('textbox', { name: t.t(SETUP_WHAT_YOU_SELL.sizeLabel) });
  await size.fill(kwp);
  await size.blur();
}

/** The what-you-sell step answered and passed: Continue saves both answers, and the next setup step takes its place. */
export async function passWhatYouSellStep(page: Page, t: Translator): Promise<void> {
  const step = page.getByRole('heading', { name: t.t(SETUP_WHAT_YOU_SELL.title) });
  await expect(step).toBeVisible();
  await answerWhatYouSell(page, t);
  await page.getByRole('button', { name: t.t(SETUP_LANGUAGE.continue) }).click();
  await expect(step).toBeHidden();
}

/**
 * A new number through signup and the two steps before it to the company profile every new owner
 * meets next (`SCR-M01-05`), read and with nothing typed there. Answers the company's name.
 */
export async function reachCompanyProfileStep(
  page: Page,
  t: Translator,
  mobile: Mobile,
): Promise<string> {
  const company = await reachWhatYouSellStep(page, t, mobile);
  await passWhatYouSellStep(page, t);
  await expect(page.getByRole('heading', { name: t.t(COMPANY_PROFILE.title) })).toBeVisible();
  await expect(companyProfileAct(page, t)).not.toHaveAttribute('aria-disabled', 'true');
  return company;
}

/** Every write to `pattern` fails from here on, as with no answer; its reads still pass. */
export async function abortWrites(page: Page, pattern: string): Promise<void> {
  await page.route(pattern, (route) =>
    route.request().method() === 'PUT' ? route.abort() : route.continue(),
  );
}

/**
 * A new number to the company profile by the step before's second way on: its save fails at
 * `failing` — a route pattern, aborted for a write and lifted again here — and `Finish later`
 * opens the profile with that step unrecorded. The profile is read and nothing is typed there.
 */
export async function reachCompanyProfileByFinishLater(
  page: Page,
  t: Translator,
  mobile: Mobile,
  failing: string,
): Promise<void> {
  await reachWhatYouSellStep(page, t, mobile);
  await abortWrites(page, failing);
  await answerWhatYouSell(page, t);
  await page.getByRole('button', { name: t.t(SETUP_LANGUAGE.continue) }).click();
  await page.getByRole('button', { name: t.t(SETUP_WHAT_YOU_SELL.finishLater) }).click();
  await page.unroute(failing);
  await expect(page.getByRole('heading', { name: t.t(COMPANY_PROFILE.title) })).toBeVisible();
  await expect(companyProfileAct(page, t)).not.toHaveAttribute('aria-disabled', 'true');
}

/** The company profile's one act, `Save and continue`: it waits while the profile is read. */
export function companyProfileAct(page: Page, t: Translator) {
  return page.getByRole('button', { name: t.t(COMPANY_PROFILE.saveSpoken) });
}

/** The company profile passed as it stands: the act is live with nothing typed, and the invite step opens. */
export async function passCompanyProfileStep(page: Page, t: Translator): Promise<void> {
  const step = page.getByRole('heading', { name: t.t(COMPANY_PROFILE.title) });
  await expect(step).toBeVisible();
  await expect(companyProfileAct(page, t)).not.toHaveAttribute('aria-disabled', 'true');
  await companyProfileAct(page, t).click();
  await expect(step).toBeHidden();
}

/** The invite step of setup (`SCR-M01-07`), by its heading. */
export function inviteStep(page: Page, t: Translator) {
  return page.getByRole('heading', { name: inviteWords(t.t).title, level: 1 });
}

/** The invite step skipped: it is recorded, so the company never asks for it again. */
export async function skipInviteStep(page: Page, t: Translator): Promise<void> {
  await expect(inviteStep(page, t)).toBeVisible();
  await page.getByRole('button', { name: setupInviteWords(t.t).skip }).click();
  await expect(inviteStep(page, t)).toBeHidden();
}

/**
 * A new number through signup and its four setup steps to the company's home, the invite skipped:
 * the one way a spec obtains a person with a company of their own, and alone on its team. Answers
 * the company's name.
 */
export async function createCompany(page: Page, t: Translator, mobile: Mobile): Promise<string> {
  const company = await reachWhatYouSellStep(page, t, mobile);
  await passWhatYouSellStep(page, t);
  await passCompanyProfileStep(page, t);
  await skipInviteStep(page, t);
  return company;
}

/** A code that is certainly not `code`: each digit moved on by one. */
export function wrongCodeFor(code: string): string {
  return [...code].map((digit) => String((Number(digit) + 1) % 10)).join('');
}
