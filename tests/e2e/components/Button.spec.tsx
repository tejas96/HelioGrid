import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Button } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('a medium secondary button on the page is the well, and no shorter than the touch floor', async ({
  mount,
  page,
}) => {
  const button = await mount(
    <Button variant="secondary" size="md">
      {tryAgain}
    </Button>,
  );

  await expect(button).toHaveCSS('background-color', await resolvedColour(page, '--bg-well'));
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
});
