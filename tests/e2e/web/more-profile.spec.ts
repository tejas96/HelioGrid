import {
  createTranslator,
  FIRST_RUN_PROFILE,
  LANGUAGE_META,
  NAME_AND_PHOTO_EDITOR,
  PROFILE_PREFERENCES,
  presetName,
  settingsRowName,
  TYPE_GROUP_NAME,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/profile` (`SCR-M01-11`): the person's own page — their name and role, then the languages
 * in their own scripts and the measurements, each applied as it is touched and kept by the server
 * across a reload, with no Save; a renewed token reads the person again, once; a language redraws the page in place (`F3-03`, `F3-04`, `F3-23`);
 * a push group switched off stays off across a reload and a language change, and the Owner's
 * Billing stays on, locked (`F6-15`); *Edit name* changes the name in a panel, and the page and the
 * account menu follow (`T-M01-011c`).
 */
const en = await createTranslator('en');
const hi = await createTranslator('hi');
const W = (key: keyof typeof PROFILE_PREFERENCES) => en.t(PROFILE_PREFERENCES[key]);

test('a person changes language and units in place, and a reload keeps both', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');

  await expect(
    page.getByRole('heading', { level: 1, name: settingsRowName(en.t, 'profile') }),
  ).toBeVisible();
  await expect(page.getByText(presetName(en.t, 'epc_owner'))).toBeVisible();
  const languages = page.getByRole('radiogroup', { name: W('language') });
  for (const language of ['en', 'hi', 'mr'] as const)
    await expect(
      languages.getByRole('radio', { name: LANGUAGE_META[language].endonym }),
    ).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  const units = page.getByRole('radiogroup', { name: W('measurements') });
  /* The choice draws at once and its save follows: a reload before the save answers stops it. */
  const unitsSaved = page.waitForResponse(
    (response) => response.url().endsWith('/users/me') && response.request().method() === 'PATCH',
  );
  await units.getByRole('radio', { name: W('feet') }).click();
  expect((await unitsSaved).status()).toBe(200);
  await expect(units.getByRole('radio', { name: W('feet') })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByText(W('yourChoice'))).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole('radiogroup', { name: W('measurements') })
      .getByRole('radio', { name: W('feet') }),
  ).toHaveAttribute('aria-checked', 'true');

  const languageSaved = page.waitForResponse(
    (response) => response.url().endsWith('/users/me') && response.request().method() === 'PATCH',
  );
  await page
    .getByRole('radiogroup', { name: W('language') })
    .getByRole('radio', { name: LANGUAGE_META.hi.endonym })
    .click();
  expect((await languageSaved).status()).toBe(200);
  const hindiTitle = page.getByRole('heading', {
    level: 1,
    name: settingsRowName(hi.t, 'profile'),
  });
  await expect(hindiTitle).toBeVisible();
  await expect(page).toHaveURL(/\/more\/profile$/);
  await page.reload();
  await expect(hindiTitle).toBeVisible();
});

test('the Owner turns a push group off, and it stays off; Billing stays on', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');

  const billing = page.getByRole('switch', { name: en.t(TYPE_GROUP_NAME.billing) });
  await expect(billing).toBeChecked();
  await expect(billing).toBeDisabled();
  const payments = page.getByRole('switch', { name: en.t(TYPE_GROUP_NAME.payments) });
  await expect(payments).toBeChecked();
  await page.getByText(en.t(TYPE_GROUP_NAME.payments), { exact: true }).click();
  await expect(payments).not.toBeChecked();

  await page.reload();
  await expect(payments).not.toBeChecked();
  await page
    .getByRole('radiogroup', { name: W('language') })
    .getByRole('radio', { name: LANGUAGE_META.hi.endonym })
    .click();
  await expect(
    page.getByRole('switch', { name: hi.t(TYPE_GROUP_NAME.payments) }),
  ).not.toBeChecked();
  await expect(page.getByRole('switch', { name: hi.t(TYPE_GROUP_NAME.billing) })).toBeChecked();
});

test('a person changes their name from Edit name, and the page and the account menu follow', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');

  await page.getByRole('button', { name: W('editName') }).click();
  const panel = page.getByRole('dialog', { name: en.t(FIRST_RUN_PROFILE.aboutTitle) });
  await expect(panel).toBeVisible();
  await expectNoSeriousViolations(page);
  const renamed = 'Anjali Joshi';
  // The phone page names the person in its first row's title; the wide page in its own words.
  const nameShown = page.locator(
    '.hg-profile-preferences-name-words, .hg-profile-preferences-row:first-child .hg-list-row-title',
  );
  await panel.getByLabel(en.t(FIRST_RUN_PROFILE.nameLabel)).fill(renamed);
  await panel.getByRole('button', { name: en.t(NAME_AND_PHOTO_EDITOR.save) }).click();
  await expect(panel).toBeHidden();
  await expect(nameShown).toHaveText(renamed);
  await expect(page.getByRole('button', { name: new RegExp(`^${renamed}`) })).toBeVisible();
  await page.reload();
  await expect(nameShown).toHaveText(renamed);
});

/** A stale token's answer: any 401 but `NO_CREDENTIAL` is worth one refresh (`transport.ts`). */
const STALE = {
  status: 401,
  contentType: 'application/json',
  body: JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'stale', requestId: 'e2e' } }),
};
const THE_MEMBERSHIP = '**/tenants/me/membership';

/** Counts the session reads and refreshes the page sends from now on. */
function countAuthCalls(page: Page) {
  const calls = { refresh: 0, session: 0 };
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.endsWith('/auth/refresh')) calls.refresh += 1;
    if (pathname.endsWith('/auth/session') && request.method() === 'GET') calls.session += 1;
  });
  return calls;
}

test('a renewal re-reads the session once: the role card reads the person again', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');
  await expect(page.getByRole('button', { name: W('yourRole') })).toBeVisible();

  let refused = false;
  await page.route(THE_MEMBERSHIP, (route) => {
    if (refused) return route.continue();
    refused = true;
    return route.fulfill(STALE);
  });
  const calls = countAuthCalls(page);
  const reread = page.waitForResponse(
    (answer) => answer.url().endsWith('/auth/session') && answer.request().method() === 'GET',
  );
  await page.getByRole('button', { name: W('yourRole') }).click();
  await reread;
  await expect(page.getByRole('dialog', { name: W('yourRole') })).toBeVisible();
  await expect(page.getByText(presetName(en.t, 'epc_owner')).last()).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(calls).toEqual({ refresh: 1, session: 1 });
});

test('a refused refresh reads nothing more: the person is at the door', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');
  await expect(page.getByRole('button', { name: W('yourRole') })).toBeVisible();

  await page.route(THE_MEMBERSHIP, (route) => route.fulfill(STALE));
  await page.route('**/auth/refresh', (route) => route.fulfill(STALE));
  const calls = countAuthCalls(page);
  await page.getByRole('button', { name: W('yourRole') }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.waitForLoadState('networkidle');
  expect(calls).toEqual({ refresh: 1, session: 0 });
});

test('a page load on a stale token renews through its own session read, and reads no second time', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  let refused = false;
  await page.route('**/auth/session', (route) => {
    if (refused || route.request().method() !== 'GET') return route.continue();
    refused = true;
    return route.fulfill(STALE);
  });
  const calls = countAuthCalls(page);
  await page.goto('/more/profile');
  await expect(page.getByRole('button', { name: W('yourRole') })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(calls).toEqual({ refresh: 1, session: 2 });
});

test('two renewals while the re-read is out join it: one session read', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/profile');
  await expect(page.getByRole('button', { name: W('yourRole') })).toBeVisible();

  /* A refresh that renews without rotating the cookie, so both stale calls renew and retry. */
  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tokenExpiresAt: new Date(Date.now() + 600_000).toISOString() }),
    }),
  );
  const staleOnce = (pattern: string) => {
    let refused = false;
    return page.route(pattern, (route) => {
      if (refused) return route.continue();
      refused = true;
      return route.fulfill(STALE);
    });
  };
  await staleOnce(THE_MEMBERSHIP);
  await staleOnce('**/users/me');
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/auth/session', async (route) => {
    await held;
    await route.continue();
  });
  const calls = countAuthCalls(page);
  await page
    .getByRole('radiogroup', { name: W('measurements') })
    .getByRole('radio', { name: W('feet') })
    .click();
  await page.getByRole('button', { name: W('yourRole') }).click();
  await expect.poll(() => calls.refresh).toBe(2);
  release();
  await page.waitForLoadState('networkidle');
  expect(calls).toEqual({ refresh: 2, session: 1 });
});
