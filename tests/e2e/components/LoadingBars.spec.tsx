import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { LoadingBars } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { bottomOf } from '../support/layout';
import { resolvedLength, resolvedShadow } from '../support/token';

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
