import { createTranslator, proposalPageHeadWords, proposalReaderWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { ownerWithDraft } from '../support/proposal';

/**
 * `/proposals/<id>/document` (`SCR-M06-17`, `T-M06-015`): the pages the customer gets. A draft with
 * no price typed has no page to draw — a figure with no value is never read as zero — so the page
 * heads itself as the draft and waits; the pages of a generated version are read in the builder's
 * flow, which makes one.
 */
const en = await createTranslator('en');
const formats = { money: String, number: String, when: String, ago: String };
const HEAD = proposalPageHeadWords(en.t, formats);
const READER = proposalReaderWords(en.t, null, null);

test('a draft’s document is headed as the draft, and draws no page it cannot price', async ({
  page,
}) => {
  const { proposal } = await ownerWithDraft(page, en);
  await page.goto(`/proposals/${proposal.id}/document`);

  await expect(
    page.getByRole('heading', { name: HEAD.documentTitle(null, null), level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('status', { name: READER.opening })).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});
