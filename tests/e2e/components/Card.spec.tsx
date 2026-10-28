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

test('an errored card with an empty message says its title alone, with no separator', async ({
  mount,
}) => {
  const title = en.t(SIGN_IN.tryAgain);
  const card = await mount(<Card state="error" errorTitle={title} errorMessage="" />);

  await expect(card.locator('.hg-card-message-text')).toHaveText(title);
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

test('a labelled card is pressed by Enter and Space', async ({ mount, page }) => {
  let presses = 0;
  const card = await mount(
    <Card surface="raised" interactive selected label={tryAgain} onClick={() => (presses += 1)}>
      {tryAgain}
    </Card>,
  );

  await page.keyboard.press('Tab');
  await expect(card).toBeFocused();
  await expect(card).toHaveAttribute('role', 'button');
  await expect(page.getByRole('button', { name: tryAgain, exact: true })).toHaveCount(1);
  await expect(card).toHaveAttribute('aria-current', 'true');

  await page.keyboard.press('Enter');
  expect(presses).toBe(1);
  await page.keyboard.press(' ');
  expect(presses).toBe(2);
});

test('a labelled card that is not selected says nothing is current', async ({ mount }) => {
  const card = await mount(
    <Card label={tryAgain} onClick={() => undefined}>
      {tryAgain}
    </Card>,
  );

  await expect(card).not.toHaveAttribute('aria-current');
});

test('a card with no label is not a button, and its own button stays the only one', async ({
  mount,
}) => {
  const card = await mount(
    <Card surface="raised" interactive>
      <Button>{tryAgain}</Button>
    </Card>,
  );

  await expect(card).not.toHaveAttribute('role');
  await expect(card).not.toHaveAttribute('tabindex');
  await expect(card.getByRole('button')).toHaveCount(1);
});

test("the raised card's ring: a white card on e1 at r-lg, ringed outside in the accent when selected", async ({
  mount,
  page,
}) => {
  const card = await mount(<Card surface="raised">{tryAgain}</Card>);

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(card).toHaveCSS('border-radius', `${await resolvedLength(page, '--r-lg')}px`);
  await expect(card).toHaveCSS('box-shadow', await resolvedShadow(page, '--e1'));

  await card.update(
    <Card surface="raised" selected>
      {tryAgain}
    </Card>,
  );
  await expect(card).toHaveCSS(
    'box-shadow',
    `${await resolvedColour(page, '--accent')} 0px 0px 0px 2px`,
  );
});

test('a raised card under the pointer lifts to e2 and keeps its white', async ({ mount, page }) => {
  const card = await mount(
    <Card surface="raised" interactive onClick={() => undefined}>
      {tryAgain}
    </Card>,
  );

  await card.hover();
  await expect(card).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
});
