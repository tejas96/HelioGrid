import {
  createTranslator,
  documentDefaults,
  proposalDefaultsTimelineWords,
  proposalDefaultsWords,
  SHELL,
  settingsSavedLine,
  settingsWords,
} from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { wordsBeforeDate } from '../support/saved-line';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/proposal-templates` — Proposal defaults (`SCR-M01-19`, `M01-51`, `M01-52`, `T-M01-030`): a
 * focus screen with seven parts. The owner switches a page off and moves a phase, saves each in one
 * press, and a fresh read holds both and names who saved; a person whose presets do not open the
 * row meets the not-found page (`F7-48`).
 */
const en = await createTranslator('en');
const ROWS = settingsWords(en.t).rows;
const WORDS = proposalDefaultsWords(en.t);
const TIMELINE = proposalDefaultsTimelineWords(en.t);
const PHASES = documentDefaults(en.t).phases;
const [FIRST, SECOND] = PHASES.map((phase) => phase.name);
const SAVED_BY_OWNER = wordsBeforeDate((date) =>
  settingsSavedLine(en.t, { kind: 'saved', at: 0, name: OWNER_NAME }, { date }),
);

async function openDefaults(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  /* The settings page's own row: on desktop the sidebar lists the same row by the same name. */
  await page.getByRole('main').getByRole('button', { name: ROWS.proposal_templates }).click();
  await expect(page).toHaveURL(/\/more\/proposal-templates$/);
}

/** A part by its short word: a rail button at width, a tab in the phone's row. */
const part = (page: Page, name: string) =>
  page
    .getByRole('button', { name, exact: true })
    .or(page.getByRole('tab', { name, exact: true }))
    .first()
    .click();

const saveOnce = async (page: Page) => {
  await page.getByRole('button', { name: WORDS.save }).click();
  await expect(page.getByRole('button', { name: WORDS.save })).toHaveCount(0);
};

test('an owner switches a page off and reads it back', async ({ page }) => {
  await openDefaults(page);
  await expect(
    page.getByRole('heading', { level: 1, name: WORDS.parts.look.heading }),
  ).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);

  await part(page, WORDS.parts.pages.title);
  const generation = page.getByRole('switch', {
    name: WORDS.printPage(WORDS.pageName.generation),
  });
  /* The input is drawn as its toggle; a person presses the label that holds it. */
  await page.locator('label').filter({ has: generation }).click();
  await expect(generation).not.toBeChecked();
  await saveOnce(page);

  await page.reload();
  await expect(page.getByText(SAVED_BY_OWNER, { exact: false }).first()).toBeVisible();
  await part(page, WORDS.parts.pages.title);
  await expect(
    page.getByRole('switch', { name: WORDS.printPage(WORDS.pageName.generation) }),
  ).not.toBeChecked();
  /* The cover, the price page and the terms carry no switch (`T-M06-017`). */
  await expect(
    page.getByRole('switch', { name: WORDS.printPage(WORDS.pageName.terms) }),
  ).toHaveCount(0);
});

test('an owner moves a phase and reads it back', async ({ page }) => {
  await openDefaults(page);
  await part(page, WORDS.parts.timeline.title);
  await page.getByRole('button', { name: TIMELINE.moveDown(FIRST ?? '') }).click();
  await saveOnce(page);

  await page.reload();
  await part(page, WORDS.parts.timeline.title);
  /* The first row's own edit act now names the phase that was second. */
  await expect(page.getByRole('button', { name: TIMELINE.edit(SECOND ?? '') })).toBeVisible();
  await expect(page.getByRole('button', { name: TIMELINE.moveUp(SECOND ?? '') })).toBeDisabled();
});

/**
 * No flow in CI can mint a live invite (it runs no worker), so the reader is the owner's own
 * session read back as a Sales Executive's: the page's gate reads the presets the session names.
 * The api's own refusal of the writes is `apps/api/tests/settings/templates.test.ts`'s.
 */
test('a reader without the grant meets not found', async ({ page }) => {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.route('**/auth/session', async (route) => {
    const response = await route.fetch();
    const projection = await response.json();
    const membership =
      projection.membership === null
        ? null
        : { ...projection.membership, roles: ['sales_executive'] };
    await route.fulfill({ response, json: { ...projection, membership } });
  });

  await page.goto('/more/proposal-templates');

  await expect(page.getByRole('heading', { level: 1, name: en.t(SHELL.notFound) })).toBeAttached();
  await expect(page.getByRole('heading', { level: 1, name: WORDS.parts.look.heading })).toHaveCount(
    0,
  );
});
