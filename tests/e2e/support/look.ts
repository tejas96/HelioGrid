import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The route's landing, whole page, matches its committed baseline at the project's viewport —
 * `web/<route>.spec.ts-snapshots/landing-<project>-linux.png`, so one call per route spec.
 * `changing` masks what a run draws differently every time — a fresh company's name, today's
 * date — and nothing else: a masked word is a word no baseline holds.
 */
export async function expectTheLook(page: Page, changing: Locator[] = []): Promise<void> {
  await expect(page).toHaveScreenshot('landing.png', { fullPage: true, mask: changing });
}
