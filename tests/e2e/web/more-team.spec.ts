import {
  createTranslator,
  inviteWords,
  settingsWords,
  TEAM,
  teamActWords,
  teamStatusWord,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTheLook } from '../support/look';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/team` (`SCR-M01-12`, `T-M01-012b`, `T-M01-012c`): the team behind `More`, inside the
 * shell. A new company's owner is alone on it, so the page teaches — the owner's own card with
 * *You*, its *Deactivate* off because they are the only EPC Owner, and the empty state, with no
 * list head; at the desktop width the quiet table shows the owner's row and the head count. CI's
 * company has no team, so a search, the chips, the other rows and their acts are the qa-web rows of
 * the task. At the desktop width the page head holds *Invite teammate*, which opens Invite Teammate
 * over the page (`SCR-M01-07` d-team, `T-M01-007`); a send is the task's qa-web rows.
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
  // The only EPC Owner can never deactivate themself: the act is off and says why (F2-19, AC-1).
  const acts = teamActWords(en.t, company);
  const own = page.getByRole('button', { name: acts.act('deactivate') });
  await expect(own).toHaveAttribute('aria-disabled', 'true');
  await expect(own).toHaveAccessibleDescription(acts.onlyOwner);
  // The teaching state has no list head: there is nothing to find yet.
  await expect(page.getByRole('searchbox', { name: en.t(TEAM.find) })).toHaveCount(0);
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByText(en.t(TEAM.headCount, { people: 1, invites: 0 }))).toBeVisible();
    await expect(page.getByRole('table', { name: en.t(TEAM.everyone, { company }) })).toBeVisible();
    const invite = inviteWords(en.t);
    await page.getByRole('button', { name: invite.inviteTeammate }).click();
    await expect(page.getByRole('dialog', { name: invite.title })).toBeVisible();
    await page.getByRole('button', { name: invite.cancel }).click();
    await expect(page.getByRole('dialog', { name: invite.title })).toHaveCount(0);
  } else {
    await expect(page.getByText(en.t(TEAM.headCount, { people: 1, invites: 0 }))).toHaveCount(0);
  }
  await expectNoSidewaysScroll(page);
  await expect(page).toHaveTitle(/\S/);
  await expectNoSeriousViolations(page);
  // At the desktop width the owner's *Last active* cell reads the run's clock (*Today, 23:08*); it is
  // the third cell, before the act's.
  const lastActive = page.getByRole('row').nth(1).getByRole('cell').nth(2);
  await expectTheLook(
    page,
    testInfo.project.name === 'desktop'
      ? [page.getByText(company), lastActive]
      : [page.getByText(company)],
  );
});
