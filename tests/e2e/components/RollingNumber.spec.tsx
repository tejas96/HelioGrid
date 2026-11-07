import { RollingNumber, Text } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { settledBox } from '../support/layout';
import { animationsSettled } from '../support/motion';

/** A hero figure as the caller formats it: lakh grouping, the rupee mark and commas stand still. */
const FIGURE = '₹18,40,000';

/** The digit each column's window shows: the line of its strip that sits at the window's top. */
function digitsShown(figure: Locator): Promise<string> {
  return figure.locator('.hg-rolling-digit').evaluateAll((columns: Element[]) =>
    columns
      .map((column) => {
        const top = column.getBoundingClientRect().top;
        const lines = [...column.querySelectorAll('.hg-rolling-strip > span')];
        return lines.find((line) => Math.abs(line.getBoundingClientRect().top - top) < 1)
          ?.textContent;
      })
      .join(''),
  );
}

test('a rolling figure settles on its own digits, and a screen reader hears it once', async ({
  mount,
  page,
}) => {
  const figure = await mount(<RollingNumber value={FIGURE} variant="hero" />);
  await expect(figure.locator('.hg-rolling-figure')).toHaveAttribute('data-roll', 'on');
  await animationsSettled(page);
  expect(await digitsShown(figure)).toBe('1840000');
  await expect(figure.locator('.hg-rolling-figure')).toHaveAttribute('aria-hidden', 'true');
  await expect(figure.getByText(FIGURE, { exact: true })).toHaveCount(1);
});

test('a rolling figure keeps the baseline and the width of the same words set plainly', async ({
  mount,
}) => {
  const row = await mount(
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
      <RollingNumber value={FIGURE} variant="hero" />
      <Text variant="hero">{FIGURE}</Text>
    </div>,
  );
  const rolling = await settledBox(row.locator('.hg-rolling'));
  const plain = await settledBox(row.locator('p'));
  expect(Math.abs(rolling.y - plain.y)).toBeLessThan(1.5);
  expect(Math.abs(rolling.width - plain.width)).toBeLessThan(1.5);
});

test('under reduced motion the figure is simply there', async ({ mount, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const figure = await mount(<RollingNumber value="32" variant="figure" />);
  await expect(figure.locator('.hg-rolling-figure')).toHaveAttribute('data-roll', 'on');
  await page.waitForTimeout(50);
  expect(await digitsShown(figure)).toBe('32');
});
