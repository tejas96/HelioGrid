import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Button, Card } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedShadow } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test('a medium secondary button on the page is white and raised, and no shorter than the touch floor', async ({
  mount,
  page,
}) => {
  const button = await mount(
    <Button variant="secondary" size="md">
      {tryAgain}
    </Button>,
  );

  await expect(button).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(button).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
  const box = await button.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
});

test('a secondary button in a tile is the same white raised pill (D14 B)', async ({
  mount,
  page,
}) => {
  const card = await mount(
    <Card>
      <Button variant="secondary">{tryAgain}</Button>
    </Card>,
  );
  const button = card.getByRole('button', { name: tryAgain });

  await expect(button).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(button).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
});

test('a disabled primary button sinks to --canvas-sunken, never the white page it sits on', async ({
  mount,
  page,
}) => {
  const button = await mount(<Button disabled>{tryAgain}</Button>);

  await expect(button).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  expect(await resolvedColour(page, '--canvas-sunken')).not.toBe(
    await resolvedColour(page, '--canvas'),
  );
});

test('a disabled secondary sinks to --canvas-sunken with no shadow', async ({ mount, page }) => {
  const button = await mount(
    <Button variant="secondary" disabled>
      {tryAgain}
    </Button>,
  );

  await expect(button).toHaveCSS('background-color', await resolvedColour(page, '--canvas-sunken'));
  await expect(button).toHaveCSS('box-shadow', 'none');
});

test('a secondary lifts one step to --e3 under the pointer', async ({ mount, page }) => {
  const button = await mount(<Button variant="secondary">{tryAgain}</Button>);

  await button.hover();
  await expect(button).toHaveCSS('box-shadow', await resolvedShadow(page, '--e3'));
});

const sendCode = en.t(SIGN_IN.sendCode);

test('a loading button keeps its words for a screen reader and says it is busy (F7-26)', async ({
  mount,
  page,
}) => {
  await mount(<Button loading>{sendCode}</Button>);

  const button = page.getByRole('button', { name: sendCode });
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button.locator('.hg-button-spinner')).toHaveAttribute('aria-hidden', 'true');
  const chrome = await page.context().newCDPSession(page);
  const { nodes } = await chrome.send('Accessibility.getFullAXTree');
  const named = nodes.find((node) => node.role?.value === 'button');
  expect(named?.name?.value).toBe(sendCode);
  const words = button.getByText(sendCode);
  await expect(words).toHaveCSS('clip-path', 'inset(50%)');
  const box = await words.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(1);
  expect(box?.height).toBeLessThanOrEqual(1);
});

test('a resting button is not busy', async ({ mount }) => {
  const button = await mount(<Button>{sendCode}</Button>);

  await expect(button).not.toHaveAttribute('aria-busy', 'true');
});
