import { formatMoneyPlainly, IN_FORMATS } from '@heliogrid/domain';
import { createTranslator, ownerDashboardWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTouchFloor } from '../support/touch-target';
import { OwnerDashboardAsRead } from './OwnerDashboard.story';

/**
 * The owner's home once proposals price the pipeline (`T-M13-007`, `M13-03`): the forecast as the
 * server worked it out — its figure, its tier, the count behind it and a row per stage — the line
 * that it is expected and never added to won, a stage's value beside its count, and the shared
 * proposal nobody opened among what needs the owner.
 */
const en = await createTranslator('en');
const words = ownerDashboardWords(en.t);
const money = (amount: string) => formatMoneyPlainly(IN_FORMATS, amount);

for (const width of [375, 1536]) {
  test(`at ${width} the forecast states its figure, its stages and that it is not won`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const board = await mount(<OwnerDashboardAsRead frame="priced" />);
    const card = page.getByRole('region', { name: words.forecastTitle });
    await expect(card.getByText(money('1387773.00'), { exact: true })).toBeVisible();
    await expect(card.getByText(words.forecastFrom(5))).toBeVisible();
    await expect(card.getByRole('img', { name: words.forecastBarName })).toBeVisible();
    await expect(card.getByText(words.forecastHonest)).toBeVisible();
    await expect(card.getByText(words.forecastGap)).toHaveCount(0);
    const rows = card.getByRole('listitem');
    await expect(rows).toHaveCount(3);
    const shared = rows.nth(0).getByRole('button');
    await expect(shared).toContainText(words.forecastStage('shared'));
    await expect(shared).toContainText(words.forecastStageLine(3, money('1828575.00'), '30'));
    await expect(shared).toContainText(money('548573.00'));
    await expectTouchFloor([shared]);
    await rows.nth(1).getByRole('button').click();
    await expect(board).toHaveAttribute('data-stage', 'negotiating');
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('one paisa in a stage keeps the whole column in one form, never rounded', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(<OwnerDashboardAsRead frame="priced-paise" />);
  const rows = page.getByRole('region', { name: words.forecastTitle }).getByRole('listitem');
  const column = ['548573.00', '670000.00', '169200.50'];
  for (const [index, expected] of column.entries()) {
    await expect(rows.nth(index)).toContainText(formatMoneyPlainly(IN_FORMATS, expected, column));
  }
});

test('a priced stage shows its value, and the gap line is gone', async ({ mount, page }) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(<OwnerDashboardAsRead frame="priced" />);
  const pipeline = page.getByRole('region', { name: words.pipelineTitle });
  await expect(pipeline.getByText(money('1828575.00'), { exact: true })).toBeVisible();
  await expect(pipeline.getByText(words.valuesGap)).toHaveCount(0);
});

test('a shared proposal nobody opened needs the owner, and opens that proposal', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const board = await mount(<OwnerDashboardAsRead frame="priced" />);
  const hero = page.getByRole('region', { name: words.needsYouNow });
  await expect(hero.getByText(words.needTitle('proposals_unopened', 1))).toBeVisible();
  await expect(hero.getByText(words.unopenedLine('Meena Deshpande', 4))).toBeVisible();
  await hero
    .getByRole('listitem')
    .filter({ hasText: words.needTitle('proposals_unopened', 1) })
    .getByRole('button', { name: words.needAct('proposals_unopened') })
    .click();
  await expect(board).toHaveAttribute(
    'data-opened',
    JSON.stringify({
      kind: 'proposals_unopened',
      proposalId: '00000000-0000-4000-8000-0000000000c1',
    }),
  );
});

test('before proposals price it, the forecast is the honest gap it was', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await mount(<OwnerDashboardAsRead frame="busy" />);
  await expect(page.getByText(words.forecastGap)).toBeVisible();
  await expect(page.getByText(words.forecastHonest)).toHaveCount(0);
});
