import { createTranslator, searchWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { ID } from '../support/proposal-after-sample';
import { NUMBER } from '../support/proposal-document-sample';
import { SearchProposalsAsDrawn } from './ProposalAfterShipped.story';

/**
 * Search's Proposals group (`F6-20`, `T-M06-031`): a proposal's row says its customer, its number
 * and where it stands as a word, and opens it; a draft with no name still has a spoken name.
 */
const en = await createTranslator('en');
const words = searchWords(en.t);

for (const width of [375, 1536]) {
  test(`at ${width} a proposal's row names its customer, number and standing, and opens it`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const frame = await mount(<SearchProposalsAsDrawn />);
    await expect(page.getByText(words.group('proposals'))).toBeVisible();
    await expect(page.getByText(words.proposal(NUMBER))).toBeVisible();
    await expect(page.getByText(words.proposalStanding('opened'), { exact: true })).toBeVisible();
    await expect(page.getByText(words.proposal(null))).toBeVisible();
    await expect(page.getByText(words.proposalStanding('draft'), { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: words.open('proposal', null) })).toHaveCount(1);
    await page.getByRole('link', { name: words.open('proposal', 'Anil Sharma') }).focus();
    await page.keyboard.press('Enter');
    await expect(frame).toHaveAttribute('data-act', `proposals/${ID('e1')}`);
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}
