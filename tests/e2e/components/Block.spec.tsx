import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Block } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('an errored block on the page draws its retry in the well', async ({ mount, page }) => {
  let retries = 0;
  const block = await mount(
    <Block state="error" onRetry={() => (retries += 1)} retryLabel={tryAgain} />,
  );
  const retry = block.getByRole('button', { name: tryAgain });

  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--bg-well'));
  await expect(retry).toHaveCSS('box-shadow', 'none');
  await retry.click();
  expect(retries).toBe(1);
});

test('an errored block with blank words for its retry draws no retry', async ({ mount }) => {
  const block = await mount(<Block state="error" onRetry={() => undefined} retryLabel="  " />);

  await expect(block.getByRole('button')).toHaveCount(0);
});

test('a block is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const block = await mount(<Block title={tryAgain}>{tryAgain}</Block>);

  await expect(block).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(block).toHaveCSS('box-shadow', 'none');
  await expect(block).toHaveCSS('border-radius', '0px');
});
