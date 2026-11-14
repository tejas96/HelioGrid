import {
  createTranslator,
  proposalLinksPageWords,
  proposalLinksWords,
  proposalPageHeadWords,
} from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { ownerWithDraft } from '../support/proposal';

/**
 * `/proposals/<id>/links` (`SCR-M06-20`, `F5-30`): who holds which link. A link comes into being
 * when a proposal is shared and never before (`F5-20`), so a draft's page says none exists yet.
 */
const en = await createTranslator('en');
const formats = { money: String, number: String, when: String, ago: String };
const HEAD = proposalPageHeadWords(en.t, formats);
const LINKS = proposalLinksWords(en.t, formats);
const PAGE = proposalLinksPageWords(en.t);

test('before the first share no link exists, and the page says the share makes it', async ({
  page,
}) => {
  const { proposal } = await ownerWithDraft(page, en);
  await page.goto(`/proposals/${proposal.id}/links`);

  await expect(page.getByRole('heading', { name: HEAD.links, level: 1 })).toBeVisible();
  await expect(page.getByText(PAGE.summary)).toBeVisible();
  await expect(page.getByText(LINKS.noneTitle)).toBeVisible();
  await expect(page.getByText(LINKS.noneLine)).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});
