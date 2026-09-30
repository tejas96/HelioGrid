import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Card } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('an errored card draws its retry as a white control, since a card is a tile', async ({
  mount,
  page,
}) => {
  let retries = 0;
  const card = await mount(
    <Card state="error" onRetry={() => (retries += 1)} retryLabel={tryAgain} />,
  );
  const retry = card.getByRole('button', { name: tryAgain });

  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(retry).toHaveCSS('box-shadow', 'none');
  await retry.click();
  expect(retries).toBe(1);
});

test('an errored card with no words for its retry draws no retry', async ({ mount }) => {
  const card = await mount(<Card state="error" onRetry={() => undefined} />);

  await expect(card.getByRole('button')).toHaveCount(0);
});

test('a card is a grey tile with no shadow', async ({ mount, page }) => {
  const card = await mount(<Card>{tryAgain}</Card>);

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(card).toHaveCSS('box-shadow', 'none');
});
