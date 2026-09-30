import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Button, StatCard } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('an errored stat card is a tile and draws its retry white', async ({ mount, page }) => {
  let retries = 0;
  const card = await mount(
    <StatCard
      label={tryAgain}
      value={0}
      state="error"
      onRetry={() => (retries += 1)}
      retryLabel={tryAgain}
    />,
  );
  const retry = card.getByRole('button', { name: tryAgain });

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(card).toHaveCSS('box-shadow', 'none');
  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await retry.click();
  expect(retries).toBe(1);
});

test('a stat card is a grey tile with no shadow and its controls are white', async ({
  mount,
  page,
}) => {
  const card = await mount(
    <StatCard label={tryAgain} value={12}>
      <Button variant="secondary" size="sm">
        {tryAgain}
      </Button>
    </StatCard>,
  );

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(card).toHaveCSS('box-shadow', 'none');
  await expect(card.getByRole('button', { name: tryAgain })).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});

test('a tappable stat card is a grey tile, ringed under the pointer and never lifted', async ({
  mount,
  page,
}) => {
  const card = await mount(
    <StatCard label={tryAgain} value={12} onClick={() => undefined} ariaLabel={tryAgain} />,
  );

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(card).toHaveCSS('box-shadow', 'none');
  await card.hover();
  await expect(card).toHaveCSS(
    'box-shadow',
    `${await resolvedColour(page, '--mark-subtle')} 0px 0px 0px 2px`,
  );
  await expect(card).toHaveCSS('transform', 'none');
});
