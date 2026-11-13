import { formatMoney, IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, numberFieldWords, ownerDashboardWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { expectNoSeriousViolations } from '../support/axe';
import { bottomOf, expectNoSidewaysScroll, rightOf, settledBox } from '../support/layout';
import { expectTouchFloor } from '../support/touch-target';
import { OwnerDashboardAsRead } from './OwnerDashboard.story';

/**
 * The owner dashboard (`SCR-M13-01`, sample B): what needs you now as the hero — one at a time at
 * 375, every item in a row at 1280 — then cash, won against the target, the forecast's gap, the
 * pipeline and win/loss, then the export; its loading and failed reads; the inline target.
 */
const en = await createTranslator('en');
const words = { ...ownerDashboardWords(en.t), numberField: numberFieldWords(en.t) };
const KINDS = [
  'unassigned',
  'payments_late',
  'blocked_on_us',
  'waiting_longest',
  'my_overdue_tasks',
] as const;

/** Money as the India pack prints it, as the component's `useFormat` does outside a provider. */
const money = (amount: string) => formatMoney(IN_FORMATS, amount);

const at = (page: Page, width: number) => page.setViewportSize({ width, height: 900 });

/** Words as a pattern that matches them literally. */
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('at 375 the hero holds one need at a time and Next walks all five', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const board = await mount(<OwnerDashboardAsRead frame="busy" />);
  const hero = page.getByRole('region', { name: words.needsYouNow });
  await expect(hero.getByText(words.position(1, 5))).toBeVisible();
  await expect(hero.getByText(words.needTitle('unassigned', 2))).toBeVisible();
  await expect(hero.getByText(words.unassignedLine(26))).toBeVisible();
  await expect(hero.getByRole('button', { name: words.needAct('unassigned') })).toHaveCount(1);
  await expect(hero.getByText(words.needTitle('payments_late', 3))).toBeHidden();

  const next = hero.getByRole('button', { name: words.nextNeed });
  for (const [index, kind] of KINDS.entries()) {
    await expect(hero.getByText(words.position(index + 1, 5))).toBeVisible();
    await expect(hero.getByRole('button', { name: words.needAct(kind) }).first()).toBeVisible();
    await next.click();
  }
  await expect(hero.getByText(words.position(1, 5))).toBeVisible();

  await next.click();
  await expect(hero.getByText(words.needTitle('payments_late', 3))).toBeVisible();
  await hero.getByRole('button', { name: words.needAct('payments_late') }).click();
  await expect(board).toHaveAttribute(
    'data-opened',
    JSON.stringify({ kind: 'payments_late', projectId: '00000000-0000-4000-8000-000000000011' }),
  );
  await next.click();
  await hero.getByRole('button', { name: words.needAct('blocked_on_us') }).click();
  await expect(board).toHaveAttribute(
    'data-opened',
    JSON.stringify({ kind: 'blocked_on_us', projectId: '00000000-0000-4000-8000-000000000021' }),
  );
  await next.click();
  await expect(hero.getByText(words.needTitle('waiting_longest', 1))).toBeVisible();
  await expect(hero.getByText(words.waitingLine('Kavita Joshi', 'proposal', 34))).toBeVisible();
  await hero.getByRole('button', { name: words.needAct('waiting_longest') }).click();
  await expect(board).toHaveAttribute(
    'data-opened',
    JSON.stringify({ kind: 'waiting_longest', leadId: '00000000-0000-4000-8000-000000000031' }),
  );

  // The export closes the dashboard, its words on it, under the last card.
  const exportCsv = page.getByRole('button', { name: words.export });
  await expect(exportCsv).toHaveText(words.export);
  expect((await settledBox(exportCsv)).y).toBeGreaterThan(
    await bottomOf(page.getByRole('region', { name: words.winLossTitle })),
  );

  // Won so far reads in full, inside its half of the row.
  const won = page.getByRole('region', { name: words.wonSoFar });
  await expect(won.getByText(money('2460000.00'))).toBeAttached();
  expect(await rightOf(won.locator('.hg-rolling-figure'))).toBeLessThanOrEqual(await rightOf(won));

  // A reason keeps to one line beside its bar: no taller than a one-word reason.
  const reasons = page.getByRole('region', { name: words.winLossTitle }).getByRole('listitem');
  const longest = await settledBox(
    reasons
      .filter({ hasText: words.lostReason('chose_competitor') })
      .getByText(words.lostReason('chose_competitor')),
  );
  const shortest = await settledBox(
    reasons.filter({ hasText: words.lostReason('price') }).getByText(words.lostReason('price')),
  );
  expect(longest.height).toBe(shortest.height);

  await expectTouchFloor([next, exportCsv, page.getByRole('button', { name: words.editTarget })]);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('at 1280 every need stands in a row with its own act', async ({ mount, page }) => {
  await at(page, 1280);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(<OwnerDashboardAsRead frame="busy" />);
  const hero = page.getByRole('region', { name: words.needsYouNow });
  for (const kind of KINDS) {
    await expect(hero.getByRole('button', { name: words.needAct(kind) }).first()).toBeVisible();
  }
  await expect(hero.getByRole('button', { name: words.nextNeed })).toBeHidden();
  await expect(hero.getByText(words.position(1, 5))).toBeHidden();
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('the money, pipeline and win/loss read as the owner reads them', async ({ mount, page }) => {
  await at(page, 1280);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const board = await mount(<OwnerDashboardAsRead frame="busy" />);
  const cash = page.getByRole('region', { name: words.cashTitle });
  await expect(cash.getByText(words.soFarThisMonth)).toBeVisible();
  await expect(cash.getByText(money('1840000.00')).first()).toBeAttached();
  await expect(cash.getByText(words.vsLastMonth(money('1640000.00')))).toBeVisible();
  await expect(cash.getByText(words.late(3))).toBeVisible();
  await expect(cash.getByText(money('185000.00'))).toBeVisible();

  const won = page.getByRole('region', { name: words.wonSoFar });
  await expect(won.getByText(words.wonDeals(6))).toBeVisible();
  await expect(won.getByText(money('2460000.00'))).toBeAttached();
  await expect(
    won.getByText(words.ofTarget(words.percent('82'), money('3000000.00'))),
  ).toBeVisible();

  const forecast = page.getByRole('region', { name: words.forecastTitle });
  await expect(forecast.getByText(words.forecastGap)).toBeVisible();
  await expect(forecast.getByText(words.forecastNote)).toBeVisible();

  const pipeline = page.getByRole('region', { name: words.pipelineTitle });
  await expect(pipeline.getByText(words.openLeads(43))).toBeVisible();
  await expect(pipeline.getByText(words.stage('negotiating'))).toBeVisible();
  await expect(pipeline.getByText(words.medianWon(money('610000.00'), 14))).toBeVisible();
  await expect(pipeline.getByText(words.valuesGap)).toBeVisible();

  const winLoss = page.getByRole('region', { name: words.winLossTitle });
  await expect(
    winLoss.getByRole('img', { name: words.winRate(words.percent('31')) }),
  ).toBeVisible();
  await expect(winLoss.getByText(words.windowDays(90))).toBeVisible();
  const reasons = winLoss.getByRole('listitem');
  await expect(reasons.first()).toContainText(words.lostReason('price'));
  await expect(reasons).toHaveCount(5);

  await expect(page.getByText(words.teamScope)).toHaveCount(0);
  await page.getByRole('button', { name: words.export }).click();
  await expect(board).toHaveAttribute('data-exports', '1');
});

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

test('a team read with nothing waiting is calm and never nags for a target', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(<OwnerDashboardAsRead frame="quiet" />);
  await expect(page.getByText(words.teamScope)).toBeVisible();
  const hero = page.getByRole('region', { name: words.needsYouNow });
  await expect(hero.getByText(words.allClearTitle)).toBeVisible();
  await expect(hero.getByText(words.allClearBody)).toBeVisible();
  await expect(hero.getByRole('button')).toHaveCount(0);
  const won = page.getByRole('region', { name: words.wonSoFar });
  await expect(won.getByRole('button')).toHaveCount(0);
  await expect(won.getByText(words.noTarget)).toHaveCount(0);
  const winLoss = page.getByRole('region', { name: words.winLossTitle });
  await expect(winLoss.getByText(words.tooFew(2, 0))).toBeVisible();
  await expect(winLoss.getByText(words.noLosses)).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: words.pipelineTitle })
      .getByText(words.medianWon(money('610000.00'), 14)),
  ).toHaveCount(0);
  await expectNoSidewaysScroll(page);
  await expectNoSeriousViolations(page);
});

test('loading draws its bars; a failed read offers its retry', async ({ mount, page }) => {
  await at(page, 375);
  let frame = await mount(<OwnerDashboardAsRead frame="loading" />);
  await expect(page.getByLabel(words.loading)).toBeVisible();
  await frame.unmount();

  frame = await mount(<OwnerDashboardAsRead frame="failed" />);
  await expect(page.getByText(words.failedTitle)).toBeVisible();
  await expect(page.getByText(words.failedMessage)).toBeVisible();
  await page.getByRole('button', { name: words.retry }).click();
  await expect(frame).toHaveAttribute('data-retries', '1');
  await expectNoSeriousViolations(page);
});
