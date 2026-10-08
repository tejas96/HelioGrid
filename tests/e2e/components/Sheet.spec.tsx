import { createTranslator, NOTIFICATION_CENTRE } from '@heliogrid/i18n';
import { Sheet } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { animationsSettled } from '../support/motion';
import { MIN_TOUCH_TARGET } from '../support/touch-target';

const en = await createTranslator('en');

test.use({ viewport: { width: 375, height: 812 } });

test('the close under a handle sits wholly inside the header and takes a touch at every edge', async ({
  mount,
  page,
}) => {
  await mount(
    <Sheet open handle showClose title={en.t(NOTIFICATION_CENTRE.title)} size="half">
      <p>{en.t(NOTIFICATION_CENTRE.emptyMessage)}</p>
    </Sheet>,
  );
  await animationsSettled(page);
  const close = page.getByRole('dialog').getByRole('button');
  const box = await close.boundingBox();
  const header = await page
    .getByRole('heading', { name: en.t(NOTIFICATION_CENTRE.title) })
    .evaluate((title) => {
      const rect = title.closest('.hg-sheet-header')?.getBoundingClientRect();
      return rect === undefined ? null : { top: rect.top, bottom: rect.bottom };
    });

  expect(box).not.toBeNull();
  expect(header).not.toBeNull();
  if (box === null || header === null) return;
  expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box.y).toBeGreaterThanOrEqual(header.top);
  expect(box.y + box.height).toBeLessThanOrEqual(header.bottom);

  // The button is round, and a browser hit-tests the circle, so each edge is probed at its middle.
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const edges = [
    [middle.x, box.y + 1],
    [middle.x, box.y + box.height - 1],
    [box.x + 1, middle.y],
    [box.x + box.width - 1, middle.y],
  ] as const;
  for (const [x, y] of edges) {
    const hit = await page.evaluate(
      ([px, py]) => document.elementFromPoint(px, py)?.closest('button')?.className ?? null,
      [x, y] as const,
    );
    expect(hit).toBe(await close.getAttribute('class'));
  }
});
