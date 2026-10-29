import { COMPANY_LOGO_LIMITS } from '@heliogrid/domain';
import { brandingWords, createTranslator, pagedDocumentWords, SIGN_IN } from '@heliogrid/i18n';
import { Surface } from '@heliogrid/ui';
import { PagedDocument } from '@heliogrid/ui/print';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedShadow } from '../support/token';

const en = await createTranslator('en');
const tryAgain = en.t(SIGN_IN.tryAgain);
const words = pagedDocumentWords(en.t);
/* The document's name; the branding words' other facts only fill the signature. */
const { proposal } = brandingWords(en.t, {
  limits: COMPANY_LOGO_LIMITS,
  companyName: '',
  taxLabel: '',
});

test("an errored document's card on a grey desk is white paper and its retry is white and raised", async ({
  mount,
  page,
}) => {
  const desk = await mount(
    <Surface background="canvas">
      <PagedDocument
        read={{ kind: 'failed', retry: () => undefined }}
        label={proposal}
        words={words}
      />
    </Surface>,
  );
  const retry = desk.getByRole('button', { name: tryAgain });
  const card = desk.locator('.hg-paged-document-card');

  await expect(card).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(retry).toHaveCSS('background-color', await resolvedColour(page, '--surface'));
  await expect(retry).toHaveCSS('box-shadow', await resolvedShadow(page, '--e2'));
});
