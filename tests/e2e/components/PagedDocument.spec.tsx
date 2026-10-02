import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Surface } from '@heliogrid/ui';
import { PagedDocument } from '@heliogrid/ui/print';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);

test("an errored document's card on a grey desk is white paper and its retry is the well", async ({
  mount,
  page,
}) => {
  const desk = await mount(
    <Surface background="canvas">
      <PagedDocument state="error" onRetry={() => undefined} retryLabel={tryAgain} />
    </Surface>,
  );
  const retry = desk.getByRole('button', { name: tryAgain });
  const card = desk.locator('.hg-paged-document-card');

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--bg-well'));
});
