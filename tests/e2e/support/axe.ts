import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * `F7-26`: a missing accessible label fails the build. Only `serious` and `critical` fail —
 * `moderate` findings such as a page with no level-one heading stay with review — so raising
 * the bar is one line here, never a spec's own filter. Run it once the landing's words are
 * visible; it waits out any animation still running. It waits for the page's title first: a client
 * move streams the title in after the words, and a page that never gets one still fails.
 */
export async function expectNoSeriousViolations(page: Page): Promise<void> {
  await expect(page).toHaveTitle(/\S/);
  /* A colour still fading in is measured half-way and fails contrast at random, so axe waits until
     every animation that ends has ended; a loop (a spinner, a shimmer) never ends and is not awaited. */
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' ||
          animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
      ),
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
    );
  expect(serious).toEqual([]);
}
