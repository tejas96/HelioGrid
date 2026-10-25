import { expect, test } from '@playwright/experimental-ct-react';
import { wordsIn } from '../support/branding-page';
import { expectNoSidewaysScroll } from '../support/layout';
import { LeaveConfirmAsHeld } from './LeaveConfirm.story';

/**
 * The shared *Leave without saving?* (`SCR-M01-18` s18-w, `SCR-M01-19` m19-n10): a warning sm
 * modal answered only by its two buttons, in the words the page hands it — Hindi here, so an
 * English word of the component's own would show.
 */
const said = wordsIn('hi');
const words = {
  title: said.leaveTitle,
  body: said.leaveBody,
  discard: said.leaveConfirm,
  keep: said.keepEditing,
};

test('it asks with the words it is given', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const frame = await mount(<LeaveConfirmAsHeld {...words} />);

  const dialog = page.getByRole('dialog', { name: words.title });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-size', 'sm');
  await expect(dialog.getByText(words.body)).toBeVisible();
  const discard = dialog.getByRole('button', { name: words.discard, exact: true });
  const keep = dialog.getByRole('button', { name: words.keep, exact: true });
  await expect(discard).toBeVisible();
  await expect(keep).toBeVisible();
  // No close: the two answers are the dialog's only buttons.
  await expect(dialog.getByRole('button')).toHaveCount(2);

  // Not dismissible: Escape and a click outside leave the question standing.
  await page.keyboard.press('Escape');
  await page.mouse.click(8, 8);
  await expect(dialog).toBeVisible();
  await expect(frame).toHaveAttribute('data-kept', '0');
  await expect(frame).toHaveAttribute('data-left', '0');

  await keep.click();
  await expect(frame).toHaveAttribute('data-kept', '1');
  await expect(frame).toHaveAttribute('data-left', '0');
  await discard.click();
  await expect(frame).toHaveAttribute('data-left', '1');
  await expect(frame).toHaveAttribute('data-kept', '1');
  await expectNoSidewaysScroll(page);
});
