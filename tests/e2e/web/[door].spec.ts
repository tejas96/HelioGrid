import {
  accessRemovedWords,
  createTranslator,
  destinationLabel,
  doorTitle,
  SHELL,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTheLook } from '../support/look';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

const en = await createTranslator('en');

test("a destination on the owner's rail opens its door inside the shell", async ({ page }) => {
  const company = await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  const rail = page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });

  await rail.getByRole('button', { name: destinationLabel(en.t, 'leads') }).click();

  await expect(page).toHaveURL(/\/leads$/);
  await expect(
    page.getByRole('heading', { level: 1, name: doorTitle(en.t, 'leads') }),
  ).toBeAttached();
  await expect(page.getByText(en.t(SHELL.comingLater))).toBeVisible();
  await expect(rail.getByRole('button', { name: destinationLabel(en.t, 'leads') })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expectNoSidewaysScroll(page);
  // A client navigation swaps the head's title in after the page: read the page once it has one.
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
  await expectTheLook(page, [page.getByText(company)]);

  await rail.getByRole('button', { name: destinationLabel(en.t, 'leads') }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/home$/);

  // The same item again, after Back, opens it again: a passed burst holds nothing.
  await rail.getByRole('button', { name: destinationLabel(en.t, 'leads') }).click();
  await expect(page).toHaveURL(/\/leads$/);
});

test('a reload keeps the door it was on, with no trip through the sign-in door', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.getByRole('button', { name: destinationLabel(en.t, 'leads') }).click();
  await expect(page).toHaveURL(/\/leads$/);
  const visited: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname);
  });

  await page.reload();

  await expect(
    page.getByRole('heading', { level: 1, name: doorTitle(en.t, 'leads') }),
  ).toBeAttached();
  await expect(page).toHaveURL(/\/leads$/);
  expect(visited).not.toContain('/login');
});

test('a member removed while a door is open sees Frame 8 on that door', async ({ page }) => {
  // The shell's reads go stale after 30 s; only then does a tab that comes back read again.
  test.setTimeout(90_000);
  const mobile = freshMobile();
  await createCompany(page, en, mobile);
  await passTheOwnersMark(page, en);
  await page.getByRole('button', { name: destinationLabel(en.t, 'leads') }).click();
  await expect(page).toHaveURL(/\/leads$/);

  const refused = (code: string) => ({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: { code, message: code, requestId: 'e2e' } }),
  });
  await page.route('**/tenants/me', (route) => route.fulfill(refused('TOKEN_EXPIRED')));
  await page.route('**/tenants/me/membership', (route) => route.fulfill(refused('TOKEN_EXPIRED')));
  await page.route('**/auth/refresh', (route) => route.fulfill(refused('ACCESS_REMOVED')));
  await page.waitForTimeout(31_000);
  await page.evaluate(() => {
    for (const state of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
    }
  });

  const frame8 = accessRemovedWords(en.t, `E2E ${mobile.national}`);
  await expect(page.getByText(frame8.title)).toBeVisible();
  await expect(page).toHaveURL(/\/leads$/);
  await expect(page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) })).toBeHidden();
});

test('a door the person is not offered, or no door at all, is not found', async ({ page }) => {
  await createCompany(page, en, freshMobile());

  // An owner's rail holds Projects, never Proposals; their verb adds a lead, never a survey.
  for (const path of ['/proposals', '/start-survey', '/no-such-door']) {
    await page.goto(path);
    await expect(page.getByText(en.t(SHELL.comingLater))).toBeHidden();
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  }
});

test('search opens its door', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);

  // From --bp-desktop the search is a field that Enter submits; below it, a button.
  if ((page.viewportSize()?.width ?? 0) >= 968) {
    const field = page.getByRole('searchbox', { name: en.t(SHELL.search) });
    await field.fill('Pune');
    await field.press('Enter');
  } else {
    await page.getByRole('button', { name: en.t(SHELL.search) }).click();
  }
  await expect(page).toHaveURL(/\/search$/);
  await expect(
    page.getByRole('heading', { level: 1, name: doorTitle(en.t, 'search') }),
  ).toBeAttached();
});
