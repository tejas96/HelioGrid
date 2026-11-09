import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedBoxShadow, resolvedColour, TILE_FILL, TILE_SHADOW } from '../support/token';
import { WordedKanban } from './Kanban.story';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test("an errored board's message is a tile and its controls are white", async ({ mount, page }) => {
  let retries = 0;
  const board = await mount(
    <WordedKanban
      columns={[]}
      read={{ kind: 'failed', retry: () => (retries += 1) }}
      errorTitle={tryAgain}
      errorMessage={tryAgain}
      retryLabel={tryAgain}
    />,
  );
  const message = board.locator('.hg-kanban-message');
  const retry = message.getByRole('button', { name: tryAgain });

  await expect(message).toHaveCSS('background-color', await resolvedColour(page, TILE_FILL));
  await expect(message).toHaveCSS('box-shadow', await resolvedBoxShadow(page, TILE_SHADOW));
  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await retry.click();
  expect(retries).toBe(1);
});
