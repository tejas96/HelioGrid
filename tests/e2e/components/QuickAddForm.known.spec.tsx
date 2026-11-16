import { createTranslator, proposalQuickAddWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTouchFloor } from '../support/touch-target';
import { QuickAddAsDrawn } from './ProposalAfterShipped.story';

/**
 * *Who is it for?* (`T-M06-001`): the capture says its save also makes a lead; a number that is
 * already a lead shows that lead and one act that uses it, so no second lead is made.
 */
const en = await createTranslator('en');
const words = proposalQuickAddWords(en.t, 'Anil Sharma');

for (const width of [375, 1536]) {
  test(`at ${width} a known number offers its lead, and Save is not the way on`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const frame = await mount(<QuickAddAsDrawn known />);
    await expect(page.getByText(words.known.line)).toBeVisible();
    const use = page.getByRole('button', { name: words.known.use });
    await expectTouchFloor([use]);
    await use.click();
    await expect(frame).toHaveAttribute('data-act', 'use');
    await expect(page.getByRole('button', { name: words.save, exact: true })).toHaveCount(0);
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('a new number saves, and the line under Save says a lead is made too', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await mount(<QuickAddAsDrawn />);
  await expect(page.getByText(words.known.line)).toHaveCount(0);
  await expect(page.getByRole('button', { name: words.save, exact: true })).toBeVisible();
  await expect(page.getByText(words.saveNote)).toBeVisible();
});

test('Enter in a field saves, but not the Enter that finishes a word being composed', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  const frame = await mount(<QuickAddAsDrawn />);
  const name = page.getByRole('textbox').nth(1);
  /* What a Hindi input method sends as it commits a word: Enter while composing. */
  await name.evaluate((field) =>
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }),
    ),
  );
  await expect(frame).not.toHaveAttribute('data-act', 'save');
  /* What Safari sends instead: the composition already ended, the Enter marked key code 229. */
  await name.evaluate((field) => {
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(enter, 'keyCode', { value: 229 });
    field.dispatchEvent(enter);
  });
  await expect(frame).not.toHaveAttribute('data-act', 'save');
  await name.press('Enter');
  await expect(frame).toHaveAttribute('data-act', 'save');
});
