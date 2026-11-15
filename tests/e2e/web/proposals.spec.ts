import {
  createTranslator,
  proposalListPageWords,
  proposalListWords,
  proposalQuickAddWords,
  proposalStandingWord,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { CUSTOMER, ownerWithDraft } from '../support/proposal';

/**
 * `/proposals` (`SCR-M06-19`, `M06-48`): a rep or the owner, come to find a proposal or start one.
 * The lead's draft is on the list by its customer's name with its standing as a word; *New
 * proposal* asks who it is for first, and closing that capture makes neither a lead nor a proposal.
 */
const en = await createTranslator('en');
const formats = { money: String, number: String, when: String, ago: String };
const LIST = proposalListWords(en.t, formats);
const PAGE = proposalListPageWords(en.t, formats, { waiting: 0, waitingValue: '0' });

test('the list names the draft by its customer and its standing, and New proposal asks who it is for', async ({
  page,
}) => {
  await ownerWithDraft(page, en);
  await page.goto('/proposals');

  await expect(page.getByRole('heading', { name: PAGE.title, level: 1 })).toBeVisible();
  await expect(page.getByText(CUSTOMER.name).first()).toBeVisible();
  await expect(page.getByText(proposalStandingWord(en.t, 'draft')).first()).toBeVisible();
  await expect(page.getByText(LIST.filter('waiting')).first()).toBeVisible();

  await page.getByRole('button', { name: PAGE.newProposal }).click();
  const capture = page.getByRole('dialog', { name: proposalQuickAddWords(en.t, null).title });
  await expect(capture).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(capture).toBeHidden();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});
