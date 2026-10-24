import { createTranslator, rolesRemovedToast } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { UndoToastStory } from './ToastHost.story';

/* A toast's *Undo* (`SCR-M01-13` m-after): it closes its toast as it runs, so it runs once. */
test('Undo closes its toast first and runs once', async ({ mount, page }) => {
  const { t } = await createTranslator('en');
  const words = rolesRemovedToast(t, { name: 'Vikram Deshpande', removed: ['design_engineer'] });
  const frame = await mount(
    <UndoToastStory act="push" title={words.title} undo={words.undoLabel} />,
  );
  await page.getByRole('button', { name: 'push' }).click();
  await expect(page.getByText(words.title)).toBeVisible();
  await page.getByRole('button', { name: words.undoLabel }).click();
  await expect(page.getByText(words.title)).toHaveCount(0);
  await expect(page.getByRole('button', { name: words.undoLabel })).toHaveCount(0);
  await expect(frame).toHaveAttribute('data-undone', '1');
});

test('the toast waits while the keyboard is on its Undo, a pointer passing by included', async ({
  mount,
  page,
}) => {
  const { t } = await createTranslator('en');
  const words = rolesRemovedToast(t, { name: 'Vikram Deshpande', removed: ['design_engineer'] });
  await mount(<UndoToastStory act="push" title={words.title} undo={words.undoLabel} />);
  await page.getByRole('button', { name: 'push' }).click();
  const undo = page.getByRole('button', { name: words.undoLabel });
  await undo.focus();
  await page.getByText(words.title).hover();
  await page.mouse.move(1, 1);
  await page.waitForTimeout(5000);
  await expect(page.getByRole('button', { name: words.undoLabel })).toBeVisible();
});

test('after a keyboard Undo the next toast leaves on its own', async ({ mount, page }) => {
  const { t } = await createTranslator('en');
  const words = rolesRemovedToast(t, { name: 'Vikram Deshpande', removed: ['design_engineer'] });
  await mount(<UndoToastStory act="push" title={words.title} undo={words.undoLabel} />);
  const push = page.getByRole('button', { name: 'push' });
  await push.click();
  await page.getByRole('button', { name: words.undoLabel }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(words.title)).toHaveCount(0);
  await push.click();
  await expect(page.getByText(words.title)).toBeVisible();
  await expect(page.getByText(words.title)).toHaveCount(0, { timeout: 6000 });
});
