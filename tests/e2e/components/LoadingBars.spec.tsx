import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { LoadingBars } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { bottomOf } from '../support/layout';
import { resolvedColour, resolvedLength, resolvedShadow } from '../support/token';

/**
 * The bars a list shows while its record loads (`SCR-M01-05`'s `m-loading`): one bar per part, an
 * open part's height or a closed one's, in a region that says it is busy and what it is loading.
 * The name is borrowed: the bars have no word of their own.
 */
const en = await createTranslator('en');
const label = en.t(COMPANY_SIGNUP.yourCompany);

/** The board's two heights: an open part, and a closed section's header. */
const PANEL = 188;
const ROW = 56;

test('one bar per part, at its size, the list wide and 8 apart, in a busy region that carries its name', async ({
  mount,
  page,
}) => {
  const region = await mount(
    <LoadingBars label={label} bars={['panel', 'row', 'row', 'row', 'row']} />,
  );
  const bars = region.locator('.hg-loading-bar');
  const gap = await resolvedLength(page, '--sp-2');
  const width = (await region.boundingBox())?.width;

  await expect(page.getByRole('status', { name: label })).toHaveAttribute('aria-busy', 'true');
  await expect(bars).toHaveCount(5);
  for (const [index, height] of [PANEL, ROW, ROW, ROW, ROW].entries()) {
    expect(await bars.nth(index).boundingBox()).toMatchObject({ height, width });
  }
  for (const index of [1, 2, 3, 4]) {
    expect((await bars.nth(index).boundingBox())?.y).toBe(
      (await bottomOf(bars.nth(index - 1))) + gap,
    );
  }
});

test('a bar is a raised sweep: the first elevation, the large radius, the shimmer of the theme', async ({
  mount,
  page,
}) => {
  const region = await mount(<LoadingBars label={label} bars={['row']} />);
  const bar = region.locator('.hg-loading-bar');

  await expect(bar).toHaveCSS('box-shadow', await resolvedShadow(page, '--e1'));
  await expect(bar).toHaveCSS('border-radius', `${await resolvedLength(page, '--r-lg')}px`);
  await expect(bar).toHaveCSS('animation-name', 'hg-sheet-shimmer');
});

test('a line is a mark a glyph wide and a text-high bar beside it, 12 apart, on the card grey', async ({
  mount,
  page,
}) => {
  const region = await mount(<LoadingBars label={label} bars={['line', 'line']} />);
  const lines = region.locator('.hg-loading-line');
  const glyph = await resolvedLength(page, '--sp-5');
  const text = await resolvedLength(page, '--sp-3');

  await expect(page.getByRole('status', { name: label })).toHaveAttribute('aria-busy', 'true');
  await expect(lines).toHaveCount(2);
  const mark = await lines.first().locator('.hg-loading-line-mark').boundingBox();
  const bar = await lines.first().locator('.hg-loading-line-bar').boundingBox();
  expect(mark).toMatchObject({ width: glyph, height: glyph });
  expect(bar?.height).toBe(text);
  expect(bar?.x).toBe((mark?.x ?? 0) + glyph + text);
  expect((await lines.nth(1).boundingBox())?.y).toBe((await bottomOf(lines.first())) + text);
  await expect(lines.first().locator('.hg-loading-line-bar')).toHaveCSS(
    'animation-name',
    'hg-sheet-shimmer',
  );
});

test('inside a busy region the caller named, the bars are decoration and announce nothing', async ({
  mount,
  page,
}) => {
  await mount(<LoadingBars inBusyRegion bars={['line']} />);
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.locator('.hg-loading-bars')).toHaveAttribute('aria-hidden', 'true');
});

test('an option is the card it stands for: the grey, the tile radius, a 20 mark, a title and two description lines, 8 apart', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const region = await mount(<LoadingBars label={label} bars={['option', 'option']} />);
  const options = region.locator('.hg-loading-option');
  const gap = await resolvedLength(page, '--sp-2');

  await expect(page.getByRole('status', { name: label })).toHaveAttribute('aria-busy', 'true');
  await expect(options).toHaveCount(2);
  await expect(options.first()).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(options.first()).toHaveCSS(
    'border-radius',
    `${await resolvedLength(page, '--r-tile')}px`,
  );
  const mark = await options.first().locator('.hg-loading-option-mark').boundingBox();
  const glyph = await resolvedLength(page, '--sp-5');
  expect(mark).toMatchObject({ width: glyph, height: glyph });
  await expect(options.first().locator('.hg-loading-option-line:visible')).toHaveCount(2);
  expect((await options.nth(1).boundingBox())?.y).toBe((await bottomOf(options.first())) + gap);
  await expect(options.first().locator('.hg-loading-option-mark')).toHaveCSS(
    'animation-name',
    'hg-sheet-shimmer',
  );
});

test('in a wide room an option keeps one description line, as the panel draws it', async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 960 });
  const region = await mount(<LoadingBars label={label} bars={['option']} />);
  await expect(region.locator('.hg-loading-option-line:visible')).toHaveCount(1);
});
