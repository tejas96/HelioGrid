import { BLOCK, bannerWords, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Banner } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { RetriedBlockStory } from './RetryButton.story';

/**
 * A control that removes itself names where focus lands (`T-SHELL-014`): *Try again* leaves with
 * the failed state it sits in, and the keyboard lands on the part that reloads — never the page's
 * start — wearing the ring a focused control wears (`F7-24`).
 */
const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);
const loading = en.t(BLOCK.loading);
const { dismissLabel } = bannerWords(en.t);

/* The planted red: a dismissible banner that names no target does not compile. */
void (
  (
    // @ts-expect-error a control that removes itself names where focus lands
    <Banner title={tryAgain} dismissible onDismiss={() => undefined} dismissLabel={dismissLabel} />
  )
);

/** Presses *Try again* by keyboard, as the person who needs the focus handed on does. */
async function retryByKeyboard(part: Locator, page: Page) {
  const retry = part.getByRole('button', { name: tryAgain });
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect(retry).toHaveCount(0);
}

test('Try again hands focus to its part once it has gone', async ({ mount, page }) => {
  const part = await mount(<RetriedBlockStory loading={loading} tryAgain={tryAgain} />);

  await retryByKeyboard(part, page);

  await expect(part).toBeFocused();
});

test('the part that takes focus after Try again shows its ring', async ({ mount, page }) => {
  const part = await mount(<RetriedBlockStory loading={loading} tryAgain={tryAgain} />);

  await retryByKeyboard(part, page);

  await expect(part).toBeFocused();
  expect(await part.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});
