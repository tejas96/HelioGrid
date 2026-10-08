import type { Page } from '@playwright/test';

/** Resolves once every running animation has finished, so a measurement reads the settled box. */
export function animationsSettled(page: Page): Promise<unknown> {
  return page.evaluate(() =>
    Promise.all(document.getAnimations().map((motion) => motion.finished)),
  );
}
