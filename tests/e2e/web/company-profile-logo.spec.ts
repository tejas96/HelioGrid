import { COMPANY_LOGO_LIMITS, checksumSha256Of, companyLogoRefusal } from '@heliogrid/domain';
import {
  COMPANY_LOGO,
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  companyLogoWords,
  createTranslator,
  SHELL,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { companyProfileAct, reachCompanyProfileStep } from '../support/door';
import { freshMobile } from '../support/phone';
import { pngOf } from '../support/png';

/**
 * The company's logo on its profile (`SCR-M01-05`, `logo-invalid-limits-stated`; `M01-24`): chosen,
 * checked in the browser, and stored by the act. The profile has no address of its own, so this
 * file is named for the screen. CI runs no object store, so the three file calls and the store are
 * answered here; the real bytes are the live rows' proof. The area's look is
 * `components/CompanyProfile.logo.spec.tsx`'s.
 */
const en = await createTranslator('en');

const TAKEN = pngOf(COMPANY_LOGO_LIMITS.minWidthPx, 2);
/* Narrower than the limit, and tall enough to exceed the size limit as well. */
const NARROW = COMPANY_LOGO_LIMITS.minWidthPx - 80;
const REFUSED = pngOf(NARROW, Math.ceil(COMPANY_LOGO_LIMITS.maxBytes / (NARROW * 3)) + 1);

const FILE_ID = '5c1e3f0a-8b2d-4e6f-9a70-1d2c3b4a5e6f';
const THE_STORE = 'http://localhost:9000/heliogrid-files-local/e2e-logo';
const SIGNED = { 'content-type': 'image/png', 'x-amz-checksum-sha256': checksumSha256Of(TAKEN) };

const shell = (page: Page) => page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });
const identity = (page: Page) =>
  page
    .locator('.hg-accordion-toggle')
    .filter({ hasText: en.t(COMPANY_PROFILE_PART_TITLE.identity) });
const picker = (page: Page) => page.locator('.hg-dropzone input[type="file"]');
const choose = (page: Page, name: string, buffer: Buffer) =>
  picker(page).setInputFiles({ name, mimeType: 'image/png', buffer });

/** Every call to the file routes and the store from here on, in the order the page made them. */
function fileCallsOf(page: Page): string[] {
  const calls: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (request.method() !== 'OPTIONS' && /\/files(\/|$)|e2e-logo/.test(pathname)) {
      calls.push(`${request.method()} ${pathname.split('/').slice(-1)[0]}`);
    }
  });
  return calls;
}

test('an image too large and too narrow is refused with both of its measures, nothing is sent, and the act stays live', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  const calls = fileCallsOf(page);
  await choose(page, 'logo.png', REFUSED);

  const refusal = companyLogoRefusal(
    { contentType: 'image/png', byteSize: REFUSED.length, widthPx: NARROW },
    COMPANY_LOGO_LIMITS,
  );
  expect(refusal?.missed).toEqual(['size', 'width']);
  const words = companyLogoWords(en.t, { limits: COMPANY_LOGO_LIMITS, refusal });
  await expect(page.getByRole('alert').filter({ hasText: words.refusal ?? '' })).toBeVisible();
  await expect(page.getByText(words.add)).toBeVisible();
  await expect(companyProfileAct(page, en)).not.toHaveAttribute('aria-disabled', 'true');
  expect(calls).toEqual([]);
});

const STORED = {
  id: FILE_ID,
  subjectKind: 'tenant',
  subjectRef: FILE_ID,
  contentType: 'image/png',
  byteSize: TAKEN.length,
  checksumSha256: SIGNED['x-amz-checksum-sha256'],
};
const theProfile = '**/settings/business-profile';

/** The api's file routes and the store answer here; `confirmed` is what `complete` says. */
async function answerTheFileCalls(
  page: Page,
  confirmed: { status: number; json: unknown } = {
    status: 200,
    json: { ...STORED, uploadedAt: '2026-01-01T00:00:00.000Z' },
  },
): Promise<void> {
  const upload = {
    url: THE_STORE,
    method: 'PUT',
    headers: SIGNED,
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
  await page.route('**/files', (route) =>
    route.fulfill({ status: 201, json: { file: { ...STORED, uploadedAt: null }, upload } }),
  );
  await page.route(THE_STORE, (route) =>
    route.fulfill({
      status: route.request().method() === 'OPTIONS' ? 204 : 200,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'PUT',
      },
    }),
  );
  await page.route(`**/files/${FILE_ID}/complete`, (route) => route.fulfill(confirmed));
}

/**
 * The profile's saves from here on, each sent on without its pointer — the api would refuse a file
 * it never stored. Answers the pointers the page named, one per save; the first `failing` saves get
 * no answer.
 */
async function profileSavesOf(page: Page, failing = 0): Promise<unknown[]> {
  const named: unknown[] = [];
  await page.route(theProfile, (route) => {
    if (route.request().method() !== 'PUT') return route.continue();
    const { logoFileId, ...rest } = route.request().postDataJSON();
    named.push(logoFileId);
    if (named.length <= failing) return route.abort();
    return route.continue({ postData: JSON.stringify(rest) });
  });
  return named;
}

test('a good image is held as the logo, and the act stores it — declared, sent to the store with the signed headers, confirmed — before the profile names it', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  await answerTheFileCalls(page);
  const named = await profileSavesOf(page);

  const calls = fileCallsOf(page);
  await choose(page, 'logo.png', TAKEN);
  await expect(page.getByText(en.t(COMPANY_LOGO.held))).toBeVisible();
  await expect(identity(page)).toHaveAttribute('aria-expanded', 'true');
  expect(calls).toEqual([]);

  const sent = page.waitForRequest(
    (request) => request.url() === THE_STORE && request.method() === 'PUT',
  );
  const declared = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/files'),
  );
  await companyProfileAct(page, en).click();
  expect((await declared).postDataJSON()).toEqual({
    subjectKind: 'tenant',
    subjectRef: expect.any(String),
    contentType: 'image/png',
    byteSize: TAKEN.length,
    checksumSha256: SIGNED['x-amz-checksum-sha256'],
  });
  const upload = await sent;
  expect(upload.postDataBuffer()?.equals(TAKEN)).toBe(true);
  expect(upload.headers()).toMatchObject(SIGNED);

  await expect(shell(page)).toBeVisible();
  expect(named).toEqual([FILE_ID]);
  expect(calls).toEqual(['POST files', 'PUT e2e-logo', 'POST complete']);
});

test('a save that fails after the logo is stored is sent again with the same file: it is never stored twice', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  await answerTheFileCalls(page);
  const named = await profileSavesOf(page, 1);
  const calls = fileCallsOf(page);
  await choose(page, 'logo.png', TAKEN);
  await expect(page.getByText(en.t(COMPANY_LOGO.held))).toBeVisible();

  await companyProfileAct(page, en).click();
  await expect(
    page.getByRole('alert').filter({ hasText: en.t(COMPANY_PROFILE.notSaved) }),
  ).toBeVisible();
  await expect(page.getByText(en.t(COMPANY_LOGO.held))).toBeVisible();
  await page.getByRole('button', { name: en.t(COMPANY_PROFILE.retrySaveSpoken) }).click();

  await expect(shell(page)).toBeVisible();
  expect(named).toEqual([FILE_ID, FILE_ID]);
  expect(calls).toEqual(['POST files', 'PUT e2e-logo', 'POST complete']);
});

test('an image the api reads as another type is refused in the type’s line, and that save writes nothing', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  await answerTheFileCalls(page, {
    status: 422,
    json: {
      error: { code: 'FILE_CONTENT_MISMATCH', message: 'Not what was declared.', requestId: 'e2e' },
    },
  });
  const named = await profileSavesOf(page);
  await choose(page, 'logo.png', TAKEN);
  await expect(page.getByText(en.t(COMPANY_LOGO.held))).toBeVisible();
  await companyProfileAct(page, en).click();

  const refusal = companyLogoRefusal(
    { contentType: 'text/html', byteSize: TAKEN.length, widthPx: COMPANY_LOGO_LIMITS.minWidthPx },
    COMPANY_LOGO_LIMITS,
  );
  const words = companyLogoWords(en.t, { limits: COMPANY_LOGO_LIMITS, refusal });
  await expect(page.getByRole('alert').filter({ hasText: words.refusal ?? '' })).toBeVisible();
  await expect(page.getByText(words.add)).toBeVisible();
  await expect(companyProfileAct(page, en)).not.toHaveAttribute('aria-disabled', 'true');
  expect(named).toEqual([]);
});

test('a save with no image chosen never names a logo, so the api keeps the one it holds', async ({
  page,
}) => {
  await reachCompanyProfileStep(page, en, freshMobile());
  const saved = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith('/settings/business-profile'),
  );
  await companyProfileAct(page, en).click();
  expect((await saved).postDataJSON()).not.toHaveProperty('logoFileId');
  await expect(shell(page)).toBeVisible();
});
