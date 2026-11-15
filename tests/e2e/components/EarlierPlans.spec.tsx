import { createTranslator, projectMoneyWords } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { expectNoSeriousViolations } from '../support/axe';
import { EARLIER } from '../support/earlier-plans';
import { expectNoSidewaysScroll } from '../support/layout';
import { expectTouchFloor } from '../support/touch-target';
import { EarlierPlansOnAProject } from './EarlierPlans.story';

/**
 * The earlier plan on the payments screen (`T-M06-025`, `M11-14`): folded under the live plan,
 * opened it names each replaced plan's version, when and by whom, and its parts and amounts.
 */
const en = await createTranslator('en');
const words = projectMoneyWords(en.t).earlier;

for (const width of [375, 1536]) {
  test(`at ${width} the earlier plan is folded, and opens to its versions and parts`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const frame = await mount(<EarlierPlansOnAProject />);
    const toggle = frame.getByRole('button', { name: new RegExp(words.title) });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(frame.getByText('Advance')).toHaveCount(0);
    await expectTouchFloor([toggle]);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      frame.getByText(words.plan({ version: 1, name: 'Priya Kale' }, '14 Nov 2026')),
    ).toBeVisible();
    await expect(
      frame.getByText(words.plan({ version: null, name: null }, '10 Nov 2026')),
    ).toBeVisible();
    await expect(frame.getByText('₹19,057.50', { exact: true })).toHaveCSS('font-family', /mono/i);
    await expect(frame.getByText(words.count(EARLIER.length))).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNoSeriousViolations(page);
  });
}

test('with no plan replaced nothing is drawn', async ({ mount }) => {
  const frame = await mount(<EarlierPlansOnAProject plans={[]} />);
  await expect(frame.getByText(words.title)).toHaveCount(0);
});
