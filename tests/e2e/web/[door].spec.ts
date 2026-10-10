import { RESEND_SECONDS } from '@heliogrid/domain';
import {
  accessRemovedWords,
  COMPANY_SIGNUP,
  CONNECTION,
  createTranslator,
  destinationLabel,
  doorTitle,
  SHELL,
  SIGN_IN,
} from '@heliogrid/i18n';
import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, fillCompanyDetails, requestCode, typeCode } from '../support/door';
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
    await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeVisible();
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

/* `F8-36`: offline, the shell shows the one no-connection screen instead of a page that waits forever. */
test('offline, a door shows the no-connection screen, and comes back with the connection', async ({
  page,
  context,
}) => {
  await createCompany(page, en, freshMobile());
  await page.goto('/leads');
  const door = page.getByRole('heading', { level: 1, name: doorTitle(en.t, 'leads') });
  await expect(door).toBeAttached();
  await context.setOffline(true);

  await expect(page.getByRole('heading', { name: en.t(CONNECTION.title) })).toBeVisible();
  await expectNoSeriousViolations(page);

  await context.setOffline(false);
  await expect(page.getByRole('heading', { name: en.t(CONNECTION.title) })).toHaveCount(0);
  await expect(door).toBeAttached();
});

/*
 * `M01-61`: signing in returns a person to the link they opened while signed out. The owner below
 * has a company and no session — the cookies are gone, as in a browser that never signed in.
 */
type Mobile = ReturnType<typeof freshMobile>;

async function ownerWithNoSession(page: Page, context: BrowserContext): Promise<Mobile> {
  const mobile = freshMobile();
  await createCompany(page, en, mobile);
  await passTheOwnersMark(page, en);
  await context.clearCookies();
  return mobile;
}

async function enterTheDoor(page: Page, mobile: Mobile): Promise<void> {
  await expect(page).toHaveURL(/\/login$/);
  const code = await requestCode(page, en, mobile);
  await typeCode(page, en, code);
  await page.getByRole('button', { name: en.t(SIGN_IN.verifyAndSignIn) }).click();
}

async function signInAtTheDoor(page: Page, mobile: Mobile): Promise<void> {
  // The number's signup code is seconds old, and a second one is sent only after the resend gap.
  test.setTimeout(90_000);
  await page.waitForTimeout((RESEND_SECONDS + 1) * 1000);
  await enterTheDoor(page, mobile);
}

test('a link opened while signed out is where sign-in lands', async ({ page, context }) => {
  const mobile = await ownerWithNoSession(page, context);
  await page.goto('/leads');
  const visited: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname);
  });

  await signInAtTheDoor(page, mobile);

  await expect(page).toHaveURL(/\/leads$/);
  await expect(
    page.getByRole('heading', { level: 1, name: doorTitle(en.t, 'leads') }),
  ).toBeAttached();
  expect(visited).not.toContain('/home');
});

test('a link to a door the person is not offered is not found after sign-in', async ({
  page,
  context,
}) => {
  const mobile = await ownerWithNoSession(page, context);
  // An owner's rail holds Projects, never Proposals.
  await page.goto('/proposals');

  await signInAtTheDoor(page, mobile);

  await expect(page).toHaveURL(/\/proposals$/);
  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeVisible();
  await page.getByRole('button', { name: en.t(SHELL.goToHome) }).click();
  await expect(page).toHaveURL(/\/home$/);
});

test('a new company opens on the link its owner came by', async ({ page }) => {
  const mobile = freshMobile();
  await page.goto('/leads');

  // A new number has no company: the door hands it to the company step.
  await enterTheDoor(page, mobile);
  await fillCompanyDetails(page, en, mobile, `E2E ${mobile.national}`);
  await page.getByRole('button', { name: en.t(COMPANY_SIGNUP.createCompany) }).click();

  await expect(page).toHaveURL(/\/leads$/);
});

test('signing out, then in, opens the home — also after Back to a page left open', async ({
  page,
}) => {
  const mobile = freshMobile();
  await createCompany(page, en, mobile);
  await passTheOwnersMark(page, en);
  const rail = page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });
  await rail.getByRole('button', { name: destinationLabel(en.t, 'leads') }).click();
  await expect(page).toHaveURL(/\/leads$/);
  await rail.getByRole('button', { name: destinationLabel(en.t, 'projects') }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page
    .getByRole('button', { name: en.t(SHELL.accountOf, { name: `Owner ${mobile.national}` }) })
    .click();
  await page.getByRole('menuitem', { name: en.t(SHELL.signOut) }).click();
  await expect(page).toHaveURL(/\/login$/);

  // Back reaches the page under the one signed out on; signed out, it leads to the door again.
  await page.goBack();
  await signInAtTheDoor(page, mobile);

  await expect(page).toHaveURL(/\/home$/);
});

test('a kept value that is not a path on this site is dropped', async ({ page, context }) => {
  const mobile = await ownerWithNoSession(page, context);
  await page.goto('/leads');
  await expect(page).toHaveURL(/\/login$/);
  // The gate's own kept value is swapped for another site's address, whatever key holds it. The
  // tab is one a browser strips before it reads the address, which leaves `//example.com`.
  const swapped = await page.evaluate(() => {
    const kept = Object.keys(sessionStorage).filter(
      (key) => sessionStorage.getItem(key) === '/leads',
    );
    for (const key of kept) sessionStorage.setItem(key, '/\u0009/example.com');
    return kept.length;
  });
  expect(swapped).toBe(1);

  await signInAtTheDoor(page, mobile);

  await expect(page).toHaveURL(/\/home$/);
});
