import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Kanban } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test("an errored board's message is a grey tile with no shadow and its controls are white", async ({
  mount,
  page,
}) => {
  let retries = 0;
  const board = await mount(
    <Kanban
      columns={[]}
      state="error"
      errorTitle={tryAgain}
      errorMessage={tryAgain}
      onRetry={() => (retries += 1)}
      retryLabel={tryAgain}
    />,
  );
  const message = board.locator('.hg-kanban-message');
  const retry = message.getByRole('button', { name: tryAgain });

  await expect(message).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--canvas-sunken'),
  );
  await expect(message).toHaveCSS('box-shadow', 'none');
  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await retry.click();
  expect(retries).toBe(1);
});
