import { createTranslator, proposalPageHeadWords, proposalTrackWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { ownerWithDraft } from '../support/proposal';

/**
 * `/proposals/<id>` (`SCR-M06-18`): the rep, come to see where a proposal stands and do the one
 * next thing. A draft's one act continues it in the builder; the page never claims a delivery; its
 * rows open the versions, the links and the document. A generated proposal's share and tracking are
 * driven from the builder's flow, which makes one.
 */
const en = await createTranslator('en');
const formats = { money: String, number: String, when: String, ago: String };
const TRACK = proposalTrackWords(en.t, formats);
const HEAD = proposalPageHeadWords(en.t, formats);

test('a draft says what to do next, and never claims a delivery', async ({ page }) => {
  const { proposal } = await ownerWithDraft(page, en);
  await page.goto(`/proposals/${proposal.id}`);

  await expect(page.getByRole('heading', { name: HEAD.name(null), level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: TRACK.act('continue', proposal) })).toBeVisible();
  await expect(page.getByText(TRACK.neverDelivered)).toBeVisible();
  await expect(page.getByText(TRACK.row('version', proposal, null).title)).toBeVisible();
  await expect(page.getByText(TRACK.row('links', proposal, null).title)).toBeVisible();

  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the continue act opens the builder on this draft', async ({ page }) => {
  const { proposal } = await ownerWithDraft(page, en);
  await page.goto(`/proposals/${proposal.id}`);

  await page.getByRole('button', { name: TRACK.act('continue', proposal) }).click();

  await expect(page).toHaveURL(new RegExp(`/proposals/${proposal.id}/build$`));
});
