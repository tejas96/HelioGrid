import { contrastRatio } from '@heliogrid/domain';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { TenantTintAsDrawn } from './ProposalAfterSheets.story';

/**
 * A tenant's colour in the dark scheme (`T-F5-001`): the brand's tint and the words on it are
 * re-made for a dark page, so a dark brand never draws dark words on a dark tile. WCAG AA holds in
 * both schemes for a dark brand, a light one and a mid one.
 */
const WHITE = '#ffffff';
const hexOf = (rgb: string): string =>
  `#${(rgb.match(/\d+/g) ?? [])
    .slice(0, 3)
    .map((part) => Number(part).toString(16).padStart(2, '0'))
    .join('')}`;

const painted = (tile: Locator) =>
  tile.evaluate((node) => {
    const style = getComputedStyle(node);
    const link = node.querySelector('a');
    return {
      fill: style.backgroundColor,
      ink: style.color,
      link: link === null ? style.color : getComputedStyle(link).color,
    };
  });

for (const brand of ['#0B1F3A', '#F2C94C', '#1F7A4D']) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`${brand} in ${scheme}: the tint is the scheme's own, and the words and the link read on it`, async ({
      mount,
      page,
    }) => {
      await page.evaluate(
        (value) => document.documentElement.setAttribute('data-theme', value),
        scheme,
      );
      await mount(<TenantTintAsDrawn brand={brand} />);
      const { fill, ink, link } = await painted(page.getByTestId('tint'));
      expect(
        contrastRatio(hexOf(ink), hexOf(fill)),
        'the words on the tint',
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(hexOf(link), hexOf(fill)),
        'the link on the tint',
      ).toBeGreaterThanOrEqual(4.5);
      // The tint is the scheme's own: a dark tile on a dark page, never the paper tint left inline.
      const againstWhite = contrastRatio(WHITE, hexOf(fill));
      if (scheme === 'dark') expect(againstWhite, 'a dark tint').toBeGreaterThanOrEqual(4.5);
      else expect(againstWhite, 'a light tint').toBeLessThan(1.5);
    });
  }
}
