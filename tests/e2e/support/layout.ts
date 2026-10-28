import { expect, type Locator, type Page } from '@playwright/test';

/** `F7-43` item 1: the page never scrolls sideways at the viewport it is drawn at. */
export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/**
 * `F7-43` item 7: none of the boxes the selector names scrolls inside itself, either way — one
 * that does holds a clipped line.
 */
export async function expectNothingClipped(page: Page, selector: string): Promise<void> {
  const clipped = await page.evaluate(
    (boxes) =>
      [...document.querySelectorAll(boxes)].filter(
        (node) =>
          node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1,
      ).length,
    selector,
  );
  expect(clipped).toBe(0);
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function sameBox(a: Box, b: Box): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * An element's box once it is drawn and has stopped moving. A box read straight after a mount, a
 * resize or a press can catch the layout mid-change on a slow machine (CI's), and a box not drawn
 * yet reads as 0 through `box?.y ?? 0` — a red that names the wrong cause. So a spec measures only
 * through here (`packages/config/biome/settled-box.grit` refuses `.boundingBox()` elsewhere): the
 * box must be there and the same across a frame, or this fails by saying so. An element that never
 * stops moving (a spinner) is measured by its still parent.
 */
export async function settledBox(locator: Locator): Promise<Box> {
  let box = await locator.boundingBox();
  await expect
    .poll(
      async () => {
        const before = box;
        await locator.page().evaluate(() => new Promise((done) => requestAnimationFrame(done)));
        box = await locator.boundingBox();
        return before !== null && box !== null && sameBox(before, box);
      },
      { message: 'the element is drawn and has stopped moving' },
    )
    .toBe(true);
  if (box === null) throw new Error('settledBox: the element is not drawn');
  return box;
}

/** Where an element ends down the page. */
export async function bottomOf(locator: Locator): Promise<number> {
  const box = await settledBox(locator);
  return box.y + box.height;
}

/** Where an element ends across the page. */
export async function rightOf(locator: Locator): Promise<number> {
  const box = await settledBox(locator);
  return box.x + box.width;
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
 * Siblings the brief aligns share the edge it names — measured, never judged by eye. Every
 * box is compared to the first's; an element with no box fails rather than passing vacuously, and
 * a lone locator is a mistake, since one edge agrees with itself.
 */
export async function expectSharedEdge(locators: readonly Locator[], edge: Edge): Promise<void> {
  expect(locators.length, 'a shared edge needs at least two elements').toBeGreaterThan(1);
  const boxes = await Promise.all(locators.map((locator) => settledBox(locator)));
  const edges = boxes.map((box) => edgeOf(box, edge));
  const reference = edges[0] ?? 0;
  for (const [index, value] of edges.entries()) {
    expect(
      Math.abs(value - reference),
      `${edge} edge of element ${index} is ${value}px, element 0's is ${reference}px`,
    ).toBeLessThanOrEqual(SHARED_EDGE_TOLERANCE_PX);
  }
}
