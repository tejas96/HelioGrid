import { DEFAULT_TIMELINE_PHASES } from '@heliogrid/domain';
import {
  createTranslator,
  proposalTemplateWords,
  SHELL,
  sectionWords,
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
 * `/more/proposal-templates` (`SCR-M01-19`, `M01-51`, `M01-52`): the owner switches a section off
 * and moves a phase, saves them in one press, and a fresh read holds both and names who saved;
 * a person whose presets do not open the row meets the not-found page (`F7-48`).
 */
const en = await createTranslator('en');
const ROWS = settingsWords(en.t).rows;
const WORDS = proposalTemplateWords(en.t);
const SECTION = sectionWords(en.t, DEFAULT_TIMELINE_PHASES.length);
const [FIRST, SECOND] = DEFAULT_TIMELINE_PHASES.map((phase) => phase.name.en);

const SAVED_BY_OWNER = wordsBeforeDate((date) =>
  settingsSavedLine(en.t, { kind: 'saved', at: 0, name: OWNER_NAME }, { date }),
);
/* ReorderList still says its own English sentences (deferred D2), so this mirrors
   `ReorderList.defaults.ts` `moveLabel` until the component takes its words from the catalog. */
const moveDownTo = (name: string, to: number) => `Move ${name} down to position ${to}`;

async function openTemplate(page: Page) {
  await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');
  await page.getByRole('button', { name: ROWS.proposal_templates }).click();
  await expect(page).toHaveURL(/\/more\/proposal-templates$/);
}

const part = (page: Page, name: string) =>
  page.getByRole('radiogroup', { name: WORDS.edit }).getByRole('radio', { name }).click();

const saveOnce = async (page: Page) => {
  await page.getByRole('button', { name: WORDS.save }).click();
  await expect(page.getByRole('button', { name: WORDS.save })).toHaveCount(0);
};

test('an owner saves a section set and reads it back', async ({ page }) => {
  await openTemplate(page);
  await expect(
    page.getByRole('heading', { level: 1, name: ROWS.proposal_templates }),
  ).toBeVisible();
  await expect(page.getByText(WORDS.teachTitle)).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);

  await part(page, WORDS.sections);
  const performance = page.getByRole('switch', { name: SECTION('performance').title });
  /* The input is drawn as its toggle; a person presses the row that holds it. */
  await page.locator('label').filter({ has: performance }).click();
  await expect(performance).not.toBeChecked();
  await expect(page.getByText(WORDS.notSaved)).toBeVisible();
  await saveOnce(page);

  await page.reload();
  await expect(page.getByText(SAVED_BY_OWNER, { exact: false })).toBeVisible();
  await part(page, WORDS.sections);
  await expect(page.getByRole('switch', { name: SECTION('performance').title })).not.toBeChecked();
  await expect(page.getByRole('switch', { name: SECTION('terms').title })).toHaveCount(0);
});

test('an owner moves a phase and reads it back', async ({ page }) => {
  await openTemplate(page);
  await part(page, WORDS.timeline);
  const list = page.getByRole('list', { name: WORDS.projectPhases });
  await expect(list.getByRole('listitem').first()).toContainText(FIRST ?? '');

  await list
    .getByRole('listitem')
    .first()
    .getByRole('button', { name: moveDownTo(FIRST ?? '', 2) })
    .click();
  await expect(list.getByRole('listitem').first()).toContainText(SECOND ?? '');
  await expect(page.getByText(WORDS.notSaved)).toHaveCount(0);
  await saveOnce(page);

  await page.reload();
  await part(page, WORDS.timeline);
  await expect(
    page.getByRole('list', { name: WORDS.projectPhases }).getByRole('listitem').first(),
  ).toContainText(SECOND ?? '');
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
  await expect(page.getByRole('heading', { level: 1, name: ROWS.proposal_templates })).toHaveCount(
    0,
  );
});
