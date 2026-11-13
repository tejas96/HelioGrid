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

test('waiting leads go to the lightest-loaded member in one tap, or to someone picked', async ({
  mount,
  page,
}) => {
  await at(page, 375);
  const board = await mount(<OwnerDashboardAsRead frame="suggested" />);
  const hero = page.getByRole('region', { name: words.needsYouNow });
  const assign = hero.getByRole('button', { name: words.assignTo('Ravi Kulkarni') });
  const pick = hero.getByRole('button', { name: words.pickSomeone });
  await expect(hero.getByText(words.fewestOpen('Ravi Kulkarni', 3))).toBeVisible();
  // The two acts share one row.
  expect((await settledBox(pick)).y).toBe((await settledBox(assign)).y);
  await expectTouchFloor([assign, pick]);
  await assign.click();
  await expect(board).toHaveAttribute('data-opened', JSON.stringify({ kind: 'assign_waiting' }));
  await pick.click();
  await expect(board).toHaveAttribute('data-opened', JSON.stringify({ kind: 'unassigned' }));
  await expectNoSidewaysScroll(page);
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
