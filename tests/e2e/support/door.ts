import { OTP_LENGTH } from '@heliogrid/domain';
import { COMPANY_SIGNUP, SIGN_IN, type Translator } from '@heliogrid/i18n';
import { expect, type Page } from '@playwright/test';
import { codeSentTo } from './api-log';
import { expectNoSidewaysScroll } from './layout';
import type { freshMobile } from './phone';

type Mobile = ReturnType<typeof freshMobile>;

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

  await page.getByRole('textbox', { name: t.t(COMPANY_SIGNUP.companyName) }).fill(company);
  await page
    .getByRole('textbox', { name: t.t(COMPANY_SIGNUP.yourName) })
    .fill(`Owner ${mobile.national}`);
  await page.getByRole('textbox', { name: t.t(COMPANY_SIGNUP.city) }).fill('Pune');
  await expectNoSidewaysScroll(page);
}

/**
 * A new number through the signup door's three steps — the number, its code, the company — to
 * the company's home: the one way a spec obtains a person with a company of their own. Answers
 * the company's name.
 */
export async function createCompany(page: Page, t: Translator, mobile: Mobile): Promise<string> {
  const company = `E2E ${mobile.national}`;
  await fillCompanyStep(page, t, mobile, company);
  await page.getByRole('button', { name: t.t(COMPANY_SIGNUP.createCompany) }).click();

  await expect(page).toHaveURL(/\/home$/);
  return company;
}

/** A code that is certainly not `code`: each digit moved on by one. */
export function wrongCodeFor(code: string): string {
  return [...code].map((digit) => String((Number(digit) + 1) % 10)).join('');
}
