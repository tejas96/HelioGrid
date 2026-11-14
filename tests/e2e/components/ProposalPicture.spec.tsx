import { ProposalPicture } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { settledBox } from '../support/layout';
import { resolvedColour } from '../support/token';

/**
 * A proposal picture (`M06-51`): one of the platform's nine by name, or a company's own photo by
 * address, filling the box its caller gives it. It is decoration — a screen reader passes it by —
 * and words over it take the picture's fixed white ink on its shade, in light and dark alike.
 */
const BOX = { width: 320, height: 200 };

async function inScheme(page: Page, scheme: 'light' | 'dark') {
  await page.evaluate(
    (value) => document.documentElement.setAttribute('data-theme', value),
    scheme,
  );
}

test('a named picture loads, fills its box, and is hidden from a screen reader', async ({
  mount,
  page,
}) => {
  const picture = await mount(<ProposalPicture name="home" style={BOX} />);
  const file = picture.locator('img');
  await expect(file).toHaveAttribute('alt', '');
  await expect
    .poll(() => file.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const box = await settledBox(file);
  expect(box.width).toBe(BOX.width);
  expect(box.height).toBe(BOX.height);
  await expect(page.getByRole('img')).toHaveCount(0);
});

test("a company's own photo wins over a named picture, and no file draws no image", async ({
  mount,
}) => {
  const own =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"/>';
  const picture = await mount(<ProposalPicture name="villa" src={own} style={BOX} />);
  await expect(picture.locator('img')).toHaveAttribute('src', own);
  await picture.unmount();
  const none = await mount(<ProposalPicture style={BOX} />);
  await expect(none.locator('img')).toHaveCount(0);
  const box = await settledBox(none);
  expect(box.height).toBe(BOX.height);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`in ${scheme}, words over a shaded picture keep the picture's white ink`, async ({
    mount,
    page,
  }) => {
    await inScheme(page, 'light');
    const white = await resolvedColour(page, '--text-inverse');
    await inScheme(page, scheme);
    const picture = await mount(
      <ProposalPicture name="evening" shade="foot" style={BOX}>
        <span data-testid="over">Anil Sharma</span>
      </ProposalPicture>,
    );
    await expect(picture.getByTestId('over')).toHaveCSS('color', white);
    await expect(picture.locator('.hg-proposal-picture-shade')).toHaveAttribute(
      'data-shade',
      'foot',
    );
  });
}
