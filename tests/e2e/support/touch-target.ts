import { expect, type Locator } from '@playwright/test';

// Playwright's component transform rewrites every name a spec imports from a module it mounts from,
// so a plain value imported beside a component fails to compile ("already declared"). A spec reads
// the product's touch floor from here instead of typing the number.
export { MIN_TOUCH_TARGET } from '@heliogrid/ui';

import { MIN_TOUCH_TARGET } from '@heliogrid/ui';
import { settledBox } from './layout';

/**
 * `N2`: every control named is at least the touch floor on both axes. A list that matched nothing
 * fails rather than passing with nothing measured.
 */
export async function expectTouchFloor(targets: readonly Locator[]): Promise<void> {
  expect(targets.length).toBeGreaterThan(0);
  for (const target of targets) {
    const box = await settledBox(target);
    expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  }
}
