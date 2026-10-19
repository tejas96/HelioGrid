import { createTranslator, settingsWords, TEAM, teamStatusWord } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTheLook } from '../support/look';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/team` (`SCR-M01-12`, `T-M01-012b`): the team behind `More`, inside the shell. A new
 * company's owner is alone on it, so the page teaches — the owner's own card with *You* and the
 * empty state, with no list head, and at the desktop width the quiet table shows the owner's row
 * and the head count. CI's company has no team, so a search, the chips and the other rows are the
 * qa-web rows of the task.
 */
const en = await createTranslator('en');
const WORDS = settingsWords(en.t);

test('the Team row opens the team; a new owner is alone, and the page teaches', async ({
  page,
}, testInfo) => {
  const company = await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more');

  await page.getByRole('button', { name: WORDS.rows.team }).click();

  await expect(page).toHaveURL(/\/more\/team$/);
  await expect(page.getByRole('heading', { level: 1, name: WORDS.rows.team })).toBeVisible();
  await expect(page.getByText(en.t(TEAM.alone))).toBeVisible();
  await expect(page.getByText(en.t(TEAM.aloneLine))).toBeVisible();
  await expect(page.getByText(en.t(TEAM.you), { exact: true })).toBeVisible();
  await expect(
    page.getByText(teamStatusWord(en.t, 'active'), { exact: false }).first(),
  ).toBeVisible();
  // The teaching state has no list head: there is nothing to find yet.
  await expect(page.getByRole('searchbox', { name: en.t(TEAM.find) })).toHaveCount(0);
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByText(en.t(TEAM.headCount, { people: 1, invites: 0 }))).toBeVisible();
    await expect(page.getByRole('table', { name: en.t(TEAM.everyone, { company }) })).toBeVisible();
  } else {
    await expect(page.getByText(en.t(TEAM.headCount, { people: 1, invites: 0 }))).toHaveCount(0);
  }
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
  await expectTheLook(page, [page.getByText(company)]);
});
