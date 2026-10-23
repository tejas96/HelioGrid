import { firstNameOf, grantLine, ROLE_PRESETS } from '@heliogrid/domain';
import {
  assignRolesRefusalWords,
  assignRolesWords,
  createTranslator,
  grantLineWords,
  inviteWords,
  settingsWords,
  TEAM,
  teamActWords,
  teamStatusWord,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { createCompany, OWNER_NAME } from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';
import { passTheOwnersMark } from '../support/shell';

/**
 * `/more/team` (`SCR-M01-12`, `T-M01-012b`, `T-M01-012c`): the team behind `More`, inside the
 * shell. A new company's owner is alone on it, so the page teaches — the owner's own card with
 * *You*, its *Deactivate* off because they are the only EPC Owner, and the empty state, with no
 * list head; at the desktop width the quiet table shows the owner's row and the head count. CI's
 * company has no team, so a search, the chips, the other rows and their acts are the qa-web rows of
 * the task. The teaching state's *Invite your first teammate*, and at the desktop width the page
 * head's *Invite teammate*, open Invite Teammate over the page (`SCR-M01-07`, `T-M01-007`); a send
 * is the task's qa-web rows. The owner's own row opens Assign Roles (`SCR-M01-13`, `T-M01-013`): as
 * the only EPC Owner they cannot clear it, and the grant line says what the one preset gives. A
 * save whose request is cut off is read back before anything is said (`F8-36`), keeps the ticks
 * and says nothing changed; *Save roles* then retries.
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
  // The teaching state's own act opens Invite Teammate (`SCR-M01-12` m-teaching, `T-M01-007`).
  const invite = inviteWords(en.t);
  await page.getByRole('button', { name: invite.inviteFirst }).click();
  await expect(page.getByRole('dialog', { name: invite.title })).toBeVisible();
  await page.getByRole('button', { name: invite.cancel }).click();
  await expect(page.getByRole('dialog', { name: invite.title })).toHaveCount(0);
  // The owner's own row opens Assign Roles; the only EPC Owner's preset is held and off (F2-19).
  const [OWNER] = ROLE_PRESETS;
  const roles = assignRolesWords(en.t, {
    firstName: firstNameOf(OWNER_NAME),
    companyName: company,
    locks: { epc_owner: 'sole-owner' },
  });
  await page
    .getByRole('button', { name: OWNER_NAME })
    .or(page.getByRole('row', { name: OWNER_NAME }))
    .first()
    .click();
  const editor = page.getByRole('dialog', { name: new RegExp(OWNER_NAME, 'u') });
  await expect(editor).toBeVisible();
  const owner = editor.getByRole('checkbox', { name: roles.rows[0]?.title ?? '' });
  await expect(owner).toHaveAttribute('aria-checked', 'true');
  await expect(owner).toHaveAttribute('aria-disabled', 'true');
  await expect(owner).toContainText(roles.rows[0]?.lockReason ?? '');
  const sentence = grantLineWords(en.t, firstNameOf(OWNER_NAME), grantLine([OWNER]).speakers)
    .parts.map((part) => part.text)
    .join('');
  await expect(editor.getByText(sentence)).toBeVisible();
  await expect(editor.getByRole('button', { name: roles.save })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await editor.getByRole('button', { name: roles.close }).click();
  await expect(editor).toHaveCount(0);
  if (testInfo.project.name === 'desktop') {
    await expect(page.getByText(en.t(TEAM.headCount, { people: 1, invites: 0 }))).toBeVisible();
    await expect(page.getByRole('table', { name: en.t(TEAM.everyone, { company }) })).toBeVisible();
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
});

test('a save cut off on the way keeps the ticks, says nothing changed, and Save retries', async ({
  page,
}) => {
  const company = await createCompany(page, en, freshMobile());
  await passTheOwnersMark(page, en);
  await page.goto('/more/team');
  const [, , , , , , , , , FINANCE] = ROLE_PRESETS;
  const firstName = firstNameOf(OWNER_NAME);
  const roles = assignRolesWords(en.t, {
    firstName,
    companyName: company,
    locks: { epc_owner: 'sole-owner' },
  });
  await page
    .getByRole('button', { name: OWNER_NAME })
    .or(page.getByRole('row', { name: OWNER_NAME }))
    .first()
    .click();
  const editor = page.getByRole('dialog', { name: new RegExp(OWNER_NAME, 'u') });
  const finance = editor.getByRole('checkbox', {
    name: roles.rows[ROLE_PRESETS.indexOf(FINANCE ?? 'finance')]?.title ?? '',
  });
  await finance.click();
  await page.route('**/tenants/me/members/*/roles', (route) => route.abort());
  await editor.getByRole('button', { name: roles.save }).click();
  const words = assignRolesRefusalWords(
    en.t,
    { kind: 'failed' },
    { firstName, companyName: company },
  );
  await expect(editor.getByRole('alert')).toContainText(words.title ?? '');
  await expect(editor.getByRole('alert')).toContainText(words.body);
  await expect(finance).toHaveAttribute('aria-checked', 'true');
  await page.unroute('**/tenants/me/members/*/roles');
  await editor.getByRole('button', { name: roles.save }).click();
  await expect(editor).toHaveCount(0);
  await expectNoSeriousViolations(page);
});
