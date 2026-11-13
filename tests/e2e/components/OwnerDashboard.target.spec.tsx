import { createTranslator, numberFieldWords, ownerDashboardWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { bottomOf, expectNoSidewaysScroll, settledBox } from '../support/layout';
import { expectTouchFloor } from '../support/touch-target';
import { OwnerDashboardAsRead } from './OwnerDashboard.story';

/**
 * The owner dashboard's inline target (`M13-17`): edited in place across the won card's row, refused
 * on its field before anything is sent, saved with Enter and the figure typed, and a failed save
 * kept in the editor.
 */
const en = await createTranslator('en');
const words = { ...ownerDashboardWords(en.t), numberField: numberFieldWords(en.t) };

const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

/** Words as a pattern that matches them literally. */
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('the target is edited in place across the row, saves its decimal and clears', async ({
  mount,
  page,
}) => {
  // 480: the room where won and the forecast stand side by side (under 440 of room they stack).
  await at(page, 480);
  const board = await mount(<OwnerDashboardAsRead frame="busy" />);
  const won = page.getByRole('region', { name: words.wonSoFar });
  const forecast = page.getByRole('region', { name: words.forecastTitle });
  const halfWidth = (await settledBox(won)).width;
  await won.getByRole('button', { name: words.editTarget }).click();
  const field = won.getByRole('textbox', { name: words.targetLabel });
  await expect(field).toBeFocused();

  // The open editor takes the whole row; the forecast moves below it.
  expect((await settledBox(won)).width).toBeGreaterThan(halfWidth * 1.8);
  expect((await settledBox(forecast)).y).toBeGreaterThan(await bottomOf(won));

  // Save and Cancel share one row; Clear sits quietly under them.
  const save = won.getByRole('button', { name: words.saveTarget });
  const cancel = won.getByRole('button', { name: words.cancel });
  const clear = won.getByRole('button', { name: words.clearTarget });
  expect((await settledBox(cancel)).y).toBe((await settledBox(save)).y);
  expect((await settledBox(clear)).y).toBeGreaterThanOrEqual(await bottomOf(save));
  await expectTouchFloor([save, cancel, clear]);
  await expectNoSidewaysScroll(page);

  await field.fill('3500000');
  await save.click();
  await expect(board).toHaveAttribute('data-target', '3500000');
  await expect(cancel).toBeDisabled();
  await expect(won.getByRole('textbox', { name: words.targetLabel })).toHaveCount(0);

  await won.getByRole('button', { name: words.editTarget }).click();
  await won.getByRole('button', { name: words.clearTarget }).click();
  await expect(board).toHaveAttribute('data-target', 'none');
});

for (const [typed, refusal] of [
  ['12.345', words.targetTooFine(2)],
  ['0', words.targetNotPositive],
  ['12345678901234567', words.targetTooLarge],
] as const) {
  test(`a target of ${typed} is refused on its field, before anything is sent`, async ({
    mount,
    page,
  }) => {
    await at(page, 375);
    const board = await mount(<OwnerDashboardAsRead frame="no-target" />);
    const won = page.getByRole('region', { name: words.wonSoFar });
    await won.getByRole('button', { name: words.setTarget }).click();
    const field = won.getByRole('textbox', { name: words.targetLabel });
    await field.fill(typed);
    await won.getByRole('button', { name: words.saveTarget }).click();
    await expect(field).toHaveAccessibleDescription(new RegExp(escaped(refusal)));
    await expect(won.getByText(refusal)).toBeVisible();
    await expect(field).toBeFocused();
    await expect(board).toHaveAttribute('data-target', '');
    await expect(won.getByText(words.targetFailed)).toHaveCount(0);

    await field.fill('2000000');
    await expect(won.getByText(refusal)).toHaveCount(0);
    await won.getByRole('button', { name: words.saveTarget }).click();
    await expect(board).toHaveAttribute('data-target', '2000000');
  });
}

test('a digit typed onto the set target saves the figure typed, never a cut-off one', async ({
  mount,
  page,
}) => {
  await at(page, 1280);
  const board = await mount(<OwnerDashboardAsRead frame="busy" />);
  const won = page.getByRole('region', { name: words.wonSoFar });
  await won.getByRole('button', { name: words.editTarget }).click();
  const field = won.getByRole('textbox', { name: words.targetLabel });
  await expect(field).toBeFocused();
  const before = (await field.inputValue()).replace(/[^0-9.]/g, '');
  await page.keyboard.press('End');
  await page.keyboard.type('0');
  await page.keyboard.press('Enter');
  await expect(board).toHaveAttribute('data-target', String(Number(before) * 10));
});

test('a failed save stays in the editor and says so', async ({ mount, page }) => {
  await at(page, 375);
  await mount(<OwnerDashboardAsRead frame="no-target" failSave />);
  const won = page.getByRole('region', { name: words.wonSoFar });
  await won.getByRole('button', { name: words.setTarget }).click();
  await won.getByRole('textbox', { name: words.targetLabel }).fill('2000000');
  await won.getByRole('button', { name: words.saveTarget }).click();
  await expect(won.getByText(words.targetFailed)).toBeVisible();
  const field = won.getByRole('textbox', { name: words.targetLabel });
  await expect(field).toBeVisible();
  // Typing again takes the failure away; the next save says it again if it fails again.
  await field.fill('2100000');
  await expect(won.getByText(words.targetFailed)).toHaveCount(0);
  await won.getByRole('button', { name: words.cancel }).click();
  await expect(won.getByRole('button', { name: words.setTarget })).toBeVisible();
  await expectTouchFloor([won.getByRole('button', { name: words.setTarget })]);
});
