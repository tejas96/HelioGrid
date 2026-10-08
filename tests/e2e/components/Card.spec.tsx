import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Button, Card } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedLength, resolvedShadow } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('an errored card draws its retry as the white raised secondary, since a card is a tile', async ({
  mount,
  page,
}) => {
  let retries = 0;
  const card = await mount(
    <Card state="error" onRetry={() => (retries += 1)} retryLabel={tryAgain} />,
  );
  const retry = card.getByRole('button', { name: tryAgain });

  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(retry).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
  await retry.click();
  expect(retries).toBe(1);
});

test('an errored card with no words for its retry draws no retry', async ({ mount }) => {
  const card = await mount(<Card state="error" onRetry={() => undefined} />);

  await expect(card.getByRole('button')).toHaveCount(0);
});

test("a card is the open page's tile: the fill, the tile's radius and padding, no shadow", async ({
  mount,
  page,
}) => {
  const card = await mount(<Card>{tryAgain}</Card>);

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(card).toHaveCSS('border-radius', `${await resolvedLength(page, '--r-tile')}px`);
  await expect(card).toHaveCSS('padding', `${await resolvedLength(page, '--tile-pad')}px`);
  await expect(card).toHaveCSS('box-shadow', 'none');
});

test('a selected card is ringed inside in the accent, as a focused field is', async ({
  mount,
  page,
}) => {
  const card = await mount(<Card selected>{tryAgain}</Card>);

  await expect(card).toHaveCSS(
    'box-shadow',
    `${await resolvedColour(page, '--accent')} 0px 0px 0px 1.5px inset`,
  );
});

test('a tappable card takes the fill-hover under the pointer and keeps its ring off', async ({
  mount,
  page,
}) => {
  const card = await mount(
    <Card interactive onClick={() => undefined}>
      {tryAgain}
    </Card>,
  );

  await card.hover();
  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--fill-hover'));
  await expect(card).toHaveCSS('box-shadow', 'none');
});

test('a disabled control in a card sinks below the tile', async ({ mount, page }) => {
  const card = await mount(
    <Card>
      <Button disabled>{tryAgain}</Button>
    </Card>,
  );

  const sunk = await resolvedColour(page, '--canvas-sunken');
  await expect(card.getByRole('button', { name: tryAgain })).toHaveCSS('background-color', sunk);
  expect(sunk).not.toBe(await resolvedColour(page, '--fill'));
});
