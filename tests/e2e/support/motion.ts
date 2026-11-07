import type { Page } from '@playwright/test';

/**
 * Resolves once every running animation that ends has finished, so a measurement reads the settled
 * box. A loop (a wait's shimmer) never finishes, so it is not waited on.
 */
export function animationsSettled(page: Page): Promise<unknown> {
  return page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((motion) => motion.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY)
        .map((motion) => motion.finished),
    ),
  );
}
