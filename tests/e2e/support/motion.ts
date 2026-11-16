import type { Page } from '@playwright/test';

/**
 * Resolves once every running animation that ends has finished, so a measurement reads the settled
 * box. A loop (a wait's shimmer) never finishes, so it is not waited on. An animation cancelled on
 * the way (its element replaced, or its motion restarted) is no longer running: the wait looks
 * again, so whatever replaced it is waited on too.
 */
export function animationsSettled(page: Page): Promise<unknown> {
  return page.evaluate(async () => {
    const ending = () =>
      document
        .getAnimations()
        .filter((motion) => motion.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY);
    for (let look = 0; look < 10; look += 1) {
      const results = await Promise.allSettled(ending().map((motion) => motion.finished));
      if (results.every((result) => result.status === 'fulfilled')) return;
    }
    throw new Error('the motion keeps being replaced and never settles');
  });
}
