import { LottieMoment, type LottieMomentName } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';

const ONCE: readonly LottieMomentName[] = [
  'success',
  'saved',
  'celebrate',
  'sunrise',
  'published',
  'sent',
  'plan',
];

/** The drawing as it stands now: the same twice, a moment apart, means nothing is moving. */
function still(moment: Locator, apart: number): Promise<boolean> {
  return moment.evaluate(async (box: Element, wait: number) => {
    const before = box.innerHTML;
    await new Promise((settle) => setTimeout(settle, wait));
    return box.innerHTML === before;
  }, apart);
}

for (const name of ONCE) {
  test(`the ${name} moment draws, plays once and holds its last frame`, async ({ mount }) => {
    const moment = await mount(<LottieMoment name={name} size={96} />);
    await expect(moment.locator('svg')).toBeVisible();
    // Every moment is under 1.6 s; after it, the drawing holds still.
    await moment.evaluate(() => new Promise((settle) => setTimeout(settle, 1800)));
    expect(await still(moment, 300)).toBe(true);
  });
}
