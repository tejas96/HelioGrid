import { TENANT_SEGMENTS } from '@heliogrid/domain';
import {
  COMPANY_PROFILE,
  createTranslator,
  SETUP_LANGUAGE,
  SETUP_WHAT_YOU_SELL,
  SHELL,
  SIGN_IN,
  tierLabel,
} from '@heliogrid/i18n';
import { expect, type Page, type Request, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import {
  answerWhatYouSell,
  passLanguageStep,
  reachLanguageStep,
  reachWhatYouSellStep,
} from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';

/**
 * The step that asks a new owner what the company sells, straight after the language step
 * (`SCR-M01-04`, `M01-23`). Like that step it has no address of its own: the inside group's gate
 * draws it where the shell would be, so this file is named for the screen and holds no look — the
 * step's measures are `components/SetupWhatYouSell.spec.tsx`'s.
 */
const en = await createTranslator('en');

const theProfile = '**/settings/business-profile';
const theStepsSave = '**/onboarding/progress/what_you_sell';
/* A unit is a quantity's symbol, never translated, so it is written as the product writes it. */
const UNIT = 'kWp';

const heading = (page: Page) =>
  page.getByRole('heading', { name: en.t(SETUP_WHAT_YOU_SELL.title) });
/** The company profile, the setup step that takes this one's place once it is recorded. */
const nextStep = (page: Page) => page.getByRole('heading', { name: en.t(COMPANY_PROFILE.title) });
const shell = (page: Page) => page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });
const cards = (page: Page) => page.getByRole('radio');
const size = (page: Page) =>
  page.getByRole('textbox', { name: en.t(SETUP_WHAT_YOU_SELL.sizeLabel) });
const wayOn = (page: Page) => page.getByRole('button', { name: en.t(SETUP_LANGUAGE.continue) });
const notSaved = (page: Page) =>
  page.getByRole('alert').filter({ hasText: en.t(SETUP_WHAT_YOU_SELL.notSavedTitle) });
const pickOne = (page: Page) => page.getByText(en.t(SETUP_WHAT_YOU_SELL.pickOne));
const addSize = (page: Page) => page.getByText(en.t(SETUP_WHAT_YOU_SELL.addSize));

const isTheProfile = (request: Request) => request.url().endsWith('/settings/business-profile');
/** Every write the page sends from here on, by address. */
function writesOf(page: Page): string[] {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PUT') writes.push(new URL(request.url()).pathname);
  });
  return writes;
}

test('a new owner is asked what the company sells once: two questions, no way round, and Continue saves both and opens the company profile', async ({
  page,
}) => {
  const read = page.waitForResponse(
    (response) => response.request().method() === 'GET' && isTheProfile(response.request()),
  );
  await reachWhatYouSellStep(page, en, freshMobile());
  await expect(cards(page)).toHaveCount(TENANT_SEGMENTS.length);
  for (const card of await cards(page).all()) await expect(card).not.toBeChecked();
  await expect(size(page)).toHaveValue('');
  await expect(page.getByText(UNIT, { exact: true })).toBeVisible();
  for (const word of [tierLabel(en.t, 'estimated'), en.t(SETUP_WHAT_YOU_SELL.declaredByYou)])
    await expect(page.locator('.hg-provenance')).toContainText(word);
  // The step's only buttons are the ask and the way on: nothing skips it and nothing goes back.
  await expect(page.getByRole('main').getByRole('button')).toHaveText([
    '',
    en.t(SETUP_LANGUAGE.continue),
  ]);
  await expect(shell(page)).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  const saved = page.waitForRequest(
    (request) => request.method() === 'PUT' && isTheProfile(request),
  );
  const recorded = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().endsWith('/what_you_sell'),
  );
  await answerWhatYouSell(page, en);
  await wayOn(page).click();
  // The write replaces the profile whole, so everything the read held goes back beside the answers.
  expect((await saved).postDataJSON()).toEqual({
    ...(await (await read).json()),
    segment: TENANT_SEGMENTS[0],
    typicalSystemKwp: 5,
  });
  expect((await recorded).postDataJSON()).toEqual({ state: 'completed' });
  await expect(nextStep(page)).toBeVisible();

  await page.reload();
  await expect(nextStep(page)).toBeVisible();
  await expect(heading(page)).toHaveCount(0);
});

test('Continue with a question owed is refused at that question, and nothing is sent', async ({
  page,
}) => {
  await reachWhatYouSellStep(page, en, freshMobile());
  const writes = writesOf(page);

  await wayOn(page).click();
  await expect(pickOne(page)).toBeVisible();
  await expect(addSize(page)).toBeVisible();
  await expect(cards(page).first()).toBeFocused();

  await cards(page).nth(1).click();
  await expect(pickOne(page)).toHaveCount(0);
  await expect(addSize(page)).toBeVisible();

  // A declared 0 is no declaration: the size is still owed.
  await size(page).fill('0');
  await size(page).blur();
  await wayOn(page).click();
  await expect(addSize(page)).toBeVisible();
  await expect(size(page)).toBeFocused();
  await expect(heading(page)).toBeVisible();
  expect(writes).toEqual([]);
});

test('while the stored answers are read the way on waits and says why, and an answer given meanwhile is kept', async ({
  page,
}) => {
  await reachLanguageStep(page, en, freshMobile());
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(theProfile, async (route) => {
    if (route.request().method() === 'GET') await held;
    await route.continue();
  });
  await passLanguageStep(page, en);

  await expect(heading(page)).toBeVisible();
  await expect(wayOn(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText(en.t(SETUP_WHAT_YOU_SELL.stillChecking))).toBeVisible();
  await cards(page).nth(2).click();

  release();
  await expect(wayOn(page)).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText(en.t(SETUP_WHAT_YOU_SELL.savesBoth))).toBeVisible();
  await expect(cards(page).nth(2)).toBeChecked();
});

test('a save that fails keeps both answers and offers two ways on; Finish later opens the company profile, and the next visit asks for the step again with what was stored', async ({
  page,
}) => {
  await reachWhatYouSellStep(page, en, freshMobile());
  await page.route(theStepsSave, (route) => route.abort());
  await answerWhatYouSell(page, en, '8');

  await wayOn(page).click();
  await expect(notSaved(page)).toContainText(en.t(SETUP_WHAT_YOU_SELL.notSavedBody));
  await expect(cards(page).first()).toBeChecked();
  await expect(size(page)).toHaveValue('8');
  await expect(page.getByRole('button', { name: en.t(SIGN_IN.tryAgain) })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await page.getByRole('button', { name: en.t(SETUP_WHAT_YOU_SELL.finishLater) }).click();
  await expect(nextStep(page)).toBeVisible();
  await expect(shell(page)).toHaveCount(0);
  await page.unroute(theStepsSave);

  // The profile's write landed and the step's did not, and a put-off lasts for the session: a
  // fresh load asks for the step again, and the stored answers fill it.
  await page.reload();
  await expect(heading(page)).toBeVisible();
  await expect(cards(page).first()).toBeChecked();
  await expect(size(page)).toHaveValue('8');
  await wayOn(page).click();
  await expect(nextStep(page)).toBeVisible();
});

test('a read that fails never holds the owner: Continue reads again, says the save failed, and Try again opens the company profile', async ({
  page,
}) => {
  // The data layer tries a failed read three times, a second apart and then two, before it gives up.
  const afterTheRetries = { timeout: 15_000 };
  await reachLanguageStep(page, en, freshMobile());
  await page.route(theProfile, (route) =>
    route.request().method() === 'GET' ? route.abort() : route.continue(),
  );
  await passLanguageStep(page, en);
  await expect(heading(page)).toBeVisible();
  const writes = writesOf(page);

  await answerWhatYouSell(page, en);
  await wayOn(page).click();
  await expect(notSaved(page)).toBeVisible(afterTheRetries);
  expect(writes).toEqual([]);

  await page.unroute(theProfile);
  await page.getByRole('button', { name: en.t(SIGN_IN.tryAgain) }).click();
  await expect(nextStep(page)).toBeVisible();
});
