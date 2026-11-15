import { createTranslator, proposalPageHeadWords, proposalVersionsWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { ownerWithDraft } from '../support/proposal';

/**
 * `/proposals/<id>/versions` (`SCR-M06-16`, `M06-42`): what moved between versions and why. A
 * draft never generated holds none, and the page says that Generate makes the first.
 */
const en = await createTranslator('en');
const formats = { money: String, number: String, when: String, ago: String };
const HEAD = proposalPageHeadWords(en.t, formats);
const VERSIONS = proposalVersionsWords(en.t, formats);

test('a draft holds no version yet, and the page says how the first is made', async ({ page }) => {
  const { proposal } = await ownerWithDraft(page, en);
  await page.goto(`/proposals/${proposal.id}/versions`);

  await expect(page.getByRole('heading', { name: HEAD.versions, level: 1 })).toBeVisible();
  await expect(page.getByText(VERSIONS.none)).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});
