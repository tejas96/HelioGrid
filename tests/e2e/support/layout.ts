import { expect, type Locator, type Page } from '@playwright/test';

/** `F7-43` item 1: the page never scrolls sideways at the viewport it is drawn at. */
export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

export type Edge = 'left' | 'right' | 'top' | 'bottom';

/** What subpixel rounding may leave between two edges the design draws as one. */
const SHARED_EDGE_TOLERANCE_PX = 1;

function edgeOf(box: { x: number; y: number; width: number; height: number }, edge: Edge): number {
  switch (edge) {
    case 'left':
      return box.x;
    case 'right':
      return box.x + box.width;
    case 'top':
      return box.y;
    case 'bottom':
      return box.y + box.height;
  }
}

/**
 * Siblings the design record aligns share the edge it names — measured, never judged by eye. Every
 * box is compared to the first's; an element with no box fails rather than passing vacuously, and
 * a lone locator is a mistake, since one edge agrees with itself.
 */
export async function expectSharedEdge(locators: readonly Locator[], edge: Edge): Promise<void> {
  expect(locators.length, 'a shared edge needs at least two elements').toBeGreaterThan(1);
  const boxes = await Promise.all(locators.map((locator) => locator.boundingBox()));
  const edges = boxes.map((box, index) => {
    if (box === null) throw new Error(`expectSharedEdge: element ${index} is not rendered`);
    return edgeOf(box, edge);
  });
  const reference = edges[0] ?? 0;
  for (const [index, value] of edges.entries()) {
    expect(
      Math.abs(value - reference),
      `${edge} edge of element ${index} is ${value}px, element 0's is ${reference}px`,
    ).toBeLessThanOrEqual(SHARED_EDGE_TOLERANCE_PX);
  }
}
