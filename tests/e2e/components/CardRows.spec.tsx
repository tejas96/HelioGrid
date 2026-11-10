import { CardRow, CardRows } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { resolvedColour } from '../support/token';

/** The fill a row paints under its body — hover or highlight — as the browser resolved it. */
async function fillOf(row: Locator) {
  return row.evaluate((element: Element) => {
    const fill = getComputedStyle(element, '::after');
    return { top: fill.top, bottom: fill.bottom, background: fill.backgroundColor };
  });
}

test('a highlighted row and a hovered row beside it keep a gap between their fills', async ({
  mount,
  page,
}) => {
  const list = await mount(
    <CardRows>
      <CardRow first highlighted open={{ name: 'Hindi Test B', onOpen: () => undefined }}>
        Hindi Test B
      </CardRow>
      <CardRow first={false} open={{ name: 'Hindi Test A', onOpen: () => undefined }}>
        Hindi Test A
      </CardRow>
    </CardRows>,
  );
  const [chosen, hovered] = await list.locator('.hg-card-row').all();
  if (chosen === undefined || hovered === undefined) throw new Error('two rows expected');

  await hovered.hover();

  const chosenFill = await fillOf(chosen);
  const hoveredFill = await fillOf(hovered);
  expect(chosenFill.background).toBe(await resolvedColour(page, '--accent-subtle'));
  expect(hoveredFill.background).not.toBe('rgba(0, 0, 0, 0)');
  for (const fill of [chosenFill, hoveredFill]) {
    expect(fill.top).toBe('2px');
    expect(fill.bottom).toBe('2px');
  }
});
