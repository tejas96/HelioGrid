import { createTranslator, proposalPaymentStepWords, proposalStepWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSidewaysScroll } from '../support/layout';
import { StepStateStory } from './ProposalStepStates.story';

/**
 * A builder step in the states its view model reaches (`T-M06-005`, `T-M06-009`, `F8-36`): while a
 * save is out the hero says it is updating and reads as stale; a value the server refused says why
 * at its field, never a plain not-saved; and a payment part's words open its own sheet.
 */
const en = await createTranslator('en');

test.use({ viewport: { width: 375, height: 812 } });

test('while a save is out the hero says it is updating, and dims', async ({ mount, page }) => {
  await mount(<StepStateStory state="updating" />);
  await expect(page.getByRole('status').filter({ hasText: 'Updating…' })).toBeVisible();
  await expect(page.locator('.hg-pst-hero[data-updating="true"] > .hg-hero')).toHaveCSS(
    'opacity',
    '0.55',
  );
  await expectNoSidewaysScroll(page);
});

test('a refused value says the server’s reason at its field, not a plain not-saved', async ({
  mount,
  page,
}) => {
  await mount(<StepStateStory state="refused" />);
  await expect(page.getByText('The price must be above zero.')).toBeVisible();
  await expect(page.getByText(proposalStepWords(en.t).notSaved)).toHaveCount(0);
});

test('a payment part’s words open its own sheet', async ({ mount, page }) => {
  await mount(<StepStateStory state="part-row" />);
  const words = proposalPaymentStepWords(en.t, { where: 'company' });
  await page.getByRole('button', { name: words.edit('Advance') }).click();
  await expect(page.locator('body')).toHaveAttribute('data-opened', '0');
});
