import {
  createTranslator,
  doorTitle,
  firstRunMarkWords,
  homeTitle,
  NOTIFICATION_CENTRE,
  SHELL,
  verbLabel,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

const en = await createTranslator('en');
const ownerHome = homeTitle(en.t, 'epc_owner');
const addLead = verbLabel(en.t, 'add_lead');
const verbMark = firstRunMarkWords(en.t, 'centre-action', 'epc_owner', 'add_lead');
const bell = en.t(NOTIFICATION_CENTRE.bellName, { count: 0 });
const centreTitle = en.t(NOTIFICATION_CENTRE.title);
const theList = (url: URL) => url.pathname.endsWith('/notifications');
const theCount = (url: URL) => url.pathname.endsWith('/notifications/unread-count');
const markAll = (url: URL) => url.pathname.endsWith('/notifications/read-all');
/** One unread record, as the inbox answers it — this account has none of its own. */
const oneUnread = () => ({
  items: [
    {
      id: '0190f5d2-6c1e-7e3a-9b1d-2f3c4d5e6f70',
      type: 'payment_due',
      subjectKind: 'tenant',
      subjectRef: '0190f5d2-6c1e-7e3a-9b1d-2f3c4d5e6f71',
      title: 'Payment due today',
      body: 'Deshmukh project, second tranche',
      language: 'en',
      emittedAt: new Date().toISOString(),
      readAt: null,
      pushSentAt: null,
      groupKey: null,
    },
  ],
  totalCount: 1,
});
/** The inbox and the bell answer one unread record — set before the page loads its count. */
async function answerOneUnread(page: Page) {
  await page.route(theCount, (route) => route.fulfill({ json: { unreadCount: 1 } }));
  await page.route(theList, (route) => route.fulfill({ json: oneUnread() }));
}
/** From --bp-desktop the page keeps beside the centre; below it the panel fills the window. */
const besideThePage = (page: Page) => (page.viewportSize()?.width ?? 0) >= 968;

test('signed out, home sends a visitor to the door', async ({ page }) => {
  await page.goto('/home');

  await expect(page).toHaveURL(/\/login$/);
});

test('a new owner lands on their home inside the shell, with one mark on the verb', async ({
  page,
}) => {
  const mobile = freshMobile();
  await createCompany(page, en, mobile);

  await expect(page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) })).toBeVisible();
  await expect(page.getByText(`E2E ${mobile.national}`)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: ownerHome })).toBeAttached();
  await expect(page.getByRole('button', { name: addLead })).toBeVisible();
  await expect(page.getByText(verbMark?.body ?? '')).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await passTheOwnersMark(page, en);
  await expect(page.getByText(verbMark?.body ?? '')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: addLead })).toBeVisible();
  await expect(page.getByText(verbMark?.body ?? '')).toBeHidden();
});

test('the verb opens its door once, however fast it is pressed', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);

  await page.getByRole('button', { name: addLead }).dblclick();

  await expect(page).toHaveURL(/\/add-lead$/);
  await expect(
    page.getByRole('heading', { level: 1, name: doorTitle(en.t, 'add_lead') }),
  ).toBeAttached();
  await page.goBack();
  await expect(page).toHaveURL(/\/home$/);
});

test('the account menu holds the grievance contact and sign-out', async ({ page }) => {
  const mobile = freshMobile();
  await createCompany(page, en, mobile);
  await passTheOwnersMark(page, en);
  const account = page.getByRole('button', {
    name: en.t(SHELL.accountOf, { name: `Owner ${mobile.national}` }),
  });

  await account.click();
  await page.getByRole('menuitem', { name: en.t(SHELL.grievanceOfficer) }).click();
  await expect(page.getByText(en.t(SHELL.grievanceNotPublished))).toBeVisible();
  await page.keyboard.press('Escape');

  await account.click();
  await page.getByRole('menuitem', { name: en.t(SHELL.signOut) }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("the home's blocks say when its work could not be read", async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await page.route('**/tenants/me', (route) => route.abort());
  await page.route('**/tenants/me/membership', (route) => route.abort());

  await page.reload();

  await expect(page.getByText(en.t(SHELL.couldNotLoad)).first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) })).toBeVisible();
});

test('the bell opens the notification centre beside the home, and Escape hands focus back', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);

  const bellButton = page.getByRole('button', { name: bell, exact: true });
  await bellButton.click();
  const centre = page.getByRole('dialog', { name: centreTitle });
  await expect(centre.getByText(en.t(NOTIFICATION_CENTRE.emptyTitle))).toBeVisible();
  await expect(bellButton).toHaveAttribute('aria-expanded', 'true');
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.keyboard.press('Escape');
  await expect(centre).toBeHidden();
  await expect(bellButton).toBeFocused();

  if (besideThePage(page)) {
    // No backdrop and no lock (F4-27): the home's own verb still answers with the centre open.
    await bellButton.click();
    await expect(centre).toBeVisible();
    await page.getByRole('button', { name: addLead }).click();
    await expect(page).toHaveURL(/\/add-lead$/);
    await page.goBack();
    await page.keyboard.press('Escape');
    await expect(centre).toBeHidden();
  }

  // The empty centre's way forward leaves the centre behind, so the leads list is what shows.
  await bellButton.click();
  await centre.getByRole('button', { name: en.t(NOTIFICATION_CENTRE.goToLeads) }).click();
  await expect(page).toHaveURL(/\/leads$/);
  await expect(centre).toBeHidden();
});

test('while the centre loads, only its own rows wait', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(theList, async (route) => {
    await held;
    await route.continue();
  });

  await page.getByRole('button', { name: bell, exact: true }).click();
  const centre = page.getByRole('dialog', { name: centreTitle });
  await expect(centre).toBeVisible();
  await expect(centre.getByText(en.t(NOTIFICATION_CENTRE.emptyTitle))).toBeHidden();
  if (besideThePage(page)) {
    await expect(page.getByRole('button', { name: addLead })).toBeEnabled();
  }

  release();
  await expect(centre.getByText(en.t(NOTIFICATION_CENTRE.emptyTitle))).toBeVisible();
});

test('the centre says when it could not be read, and Try again recovers it', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  const centre = page.getByRole('dialog', { name: centreTitle });
  const failed = centre.getByText(en.t(NOTIFICATION_CENTRE.errorTitle));
  const tryAgain = centre.getByRole('button', { name: en.t(NOTIFICATION_CENTRE.tryAgain) });
  const empty = centre.getByText(en.t(NOTIFICATION_CENTRE.emptyTitle));

  // A request that never reaches the server (F8-36), then a server error — each on a fresh load,
  // since a list already read stays on screen rather than giving way to an error (F4-27).
  await page.route(theList, (route) => route.abort());
  await page.getByRole('button', { name: bell, exact: true }).click();
  await expect(failed).toBeVisible();
  await page.unroute(theList);
  await tryAgain.click();
  await expect(empty).toBeVisible();

  await page.reload();
  await page.route(theList, (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.getByRole('button', { name: bell, exact: true }).click();
  await expect(failed).toBeVisible();
  await page.unroute(theList);
  await tryAgain.click();
  await expect(empty).toBeVisible();
});

test('a Mark all read the server refuses is said, and the item stays unread', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.route(markAll, (route) => route.fulfill({ status: 500, body: '{}' }));
  await answerOneUnread(page);
  await page.reload();
  await page
    .getByRole('button', { name: en.t(NOTIFICATION_CENTRE.bellName, { count: 1 }) })
    .click();

  const centre = page.getByRole('dialog', { name: centreTitle });
  await centre
    .getByRole('button', { name: en.t(NOTIFICATION_CENTRE.markAllReadName, { count: 1 }) })
    .click();
  await expect(page.getByText(en.t(NOTIFICATION_CENTRE.markAllFailed))).toBeVisible();
  await expect(centre.getByRole('button', { name: /^Unread\. Payment due today/ })).toBeVisible();
});

test('a filter pressed while the list reloads keeps its place and its focus', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await answerOneUnread(page);
  await page.reload();
  await page
    .getByRole('button', { name: en.t(NOTIFICATION_CENTRE.bellName, { count: 1 }) })
    .click();
  const centre = page.getByRole('dialog', { name: centreTitle });
  await expect(centre.getByText('Payment due today')).toBeVisible();

  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.unroute(theList);
  await page.route(theList, async (route) => {
    await held;
    await route.fulfill({ json: oneUnread() });
  });
  const unread = centre.getByRole('button', { name: en.t(NOTIFICATION_CENTRE.unreadOnly) });
  await unread.focus();
  await unread.press('Enter');

  await expect(unread).toBeFocused();
  await expect(unread).toHaveAttribute('aria-pressed', 'true');
  await expect(centre.getByText('Payment due today')).toBeVisible();
  release();
});

test('a read and an older page the server refuses are each said where they happened', async ({
  page,
}) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.route(theCount, (route) => route.fulfill({ json: { unreadCount: 1 } }));
  await page.route(theList, (route) =>
    new URL(route.request().url()).searchParams.get('page') === '2'
      ? route.fulfill({ status: 500, body: '{}' })
      : route.fulfill({ json: { ...oneUnread(), totalCount: 30 } }),
  );
  await page.route(
    (url) => /\/notifications\/[^/]+\/read$/.test(url.pathname),
    (route) => route.fulfill({ status: 500, body: '{}' }),
  );
  await page.reload();
  await page
    .getByRole('button', { name: en.t(NOTIFICATION_CENTRE.bellName, { count: 1 }) })
    .click();
  const centre = page.getByRole('dialog', { name: centreTitle });

  await centre.getByRole('button', { name: /^Unread\. Payment due today/ }).click();
  await expect(page.getByText(en.t(NOTIFICATION_CENTRE.readFailed))).toBeVisible();

  await centre.getByRole('button', { name: en.t(NOTIFICATION_CENTRE.showOlder) }).click();
  await expect(centre.getByText(en.t(NOTIFICATION_CENTRE.olderFailed))).toBeVisible();
  await expect(
    centre.getByRole('button', { name: en.t(NOTIFICATION_CENTRE.showOlder) }),
  ).toBeVisible();
});
