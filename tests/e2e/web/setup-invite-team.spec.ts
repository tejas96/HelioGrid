import { createTranslator, inviteWords, SHELL, setupInviteWords, TEAM } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import {
  inviteStep,
  passCompanyProfileStep,
  passWhatYouSellStep,
  reachWhatYouSellStep,
  readyStep,
} from '../support/door';
import { expectNoSidewaysScroll } from '../support/layout';
import { freshMobile } from '../support/phone';

/**
 * The invite step of setup, straight after the company profile (`SCR-M01-07`, `M01-12`). Like the
 * steps before it, it has no address of its own: the inside group's gate draws it where the shell
 * would be, so this file is named for the screen and holds no look — the step's measures are
 * `components/SetupInviteTeam.spec.tsx`'s. Each way out records the step, so it never comes back:
 * a send and *Skip for now* lead to *You're ready*; *Open Team* closes setup and opens Team.
 */
const en = await createTranslator('en');
const invite = { ...inviteWords(en.t), ...setupInviteWords(en.t) };

const shell = (page: Page) => page.getByRole('navigation', { name: en.t(SHELL.mainNavigation) });

/** A new number through signup and the steps before it to the invite step. Answers the owner's number. */
async function reachInviteStep(page: Page): Promise<{ national: string; e164: string }> {
  const owner = freshMobile();
  await reachWhatYouSellStep(page, en, owner);
  await passWhatYouSellStep(page, en);
  await passCompanyProfileStep(page, en);
  await expect(inviteStep(page, en)).toBeVisible();
  return owner;
}

/** A step's record, as the page writes it: the step's state. */
function stepRecorded(page: Page, step: 'invite_team' | 'ready' = 'invite_team') {
  return page.waitForRequest(
    (request) =>
      request.method() === 'PUT' && request.url().endsWith(`/onboarding/progress/${step}`),
  );
}

async function fillInvite(page: Page, national: string) {
  await page.getByLabel(invite.name).fill('Anjali Kulkarni');
  await page.getByLabel(invite.phone).fill(national);
  await page.getByRole('checkbox', { name: invite.roles[3]?.title }).click();
}

test('a new owner meets the invite step after the profile; a sent invite records it and opens You’re ready for good', async ({
  page,
}) => {
  await reachInviteStep(page);
  await expect(shell(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: invite.skip })).toBeVisible();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);

  await fillInvite(page, freshMobile().national);
  const recorded = stepRecorded(page);
  const sent = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().endsWith('/invitations'),
  );
  await page.getByRole('button', { name: invite.send }).click();
  expect((await sent).status()).toBe(201);
  expect((await recorded).postDataJSON()).toEqual({ state: 'completed' });
  await expect(readyStep(page, en)).toBeVisible();

  await page.reload();
  await expect(readyStep(page, en)).toBeVisible();
  await expect(inviteStep(page, en)).toHaveCount(0);
});

test('Skip for now records the step skipped: You’re ready opens, and a fresh load does not ask again', async ({
  page,
}) => {
  await reachInviteStep(page);
  const recorded = stepRecorded(page);
  await page.getByRole('button', { name: invite.skip }).click();
  expect((await recorded).postDataJSON()).toEqual({ state: 'skipped' });
  await expect(readyStep(page, en)).toBeVisible();

  await page.reload();
  await expect(readyStep(page, en)).toBeVisible();
  await expect(inviteStep(page, en)).toHaveCount(0);
});

test('a number already on the team is said, sends nothing, and Open Team closes setup and opens Team', async ({
  page,
}) => {
  const owner = await reachInviteStep(page);
  await fillInvite(page, owner.national);
  await page.getByRole('button', { name: invite.send }).click();
  await expect(page.getByText(invite.refusal('already_member').title)).toBeVisible();
  await expect(page.getByRole('button', { name: invite.send })).toHaveCount(0);

  await page.getByRole('button', { name: invite.differentNumber }).click();
  await expect(page.getByLabel(invite.phone)).toBeFocused();
  await expect(page.getByRole('checkbox', { name: invite.roles[3]?.title })).toBeChecked();
  await page.getByLabel(invite.phone).fill(owner.national);
  await page.getByRole('button', { name: invite.send }).click();

  const recorded = stepRecorded(page);
  const closed = stepRecorded(page, 'ready');
  await page.getByRole('button', { name: invite.openTeam }).click();
  expect((await recorded).postDataJSON()).toEqual({ state: 'skipped' });
  expect((await closed).postDataJSON()).toEqual({ state: 'skipped' });
  await expect(page).toHaveURL(/\/more\/team$/);
  await expect(page.getByText(en.t(TEAM.alone))).toBeVisible();
  await expect(readyStep(page, en)).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(en.t(TEAM.alone))).toBeVisible();
  await expect(readyStep(page, en)).toHaveCount(0);
});
