import { COMPANY_SIGNUP, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { Accordion } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const title = en.t(COMPANY_SIGNUP.yourCompany);
const toFix = en.t(SIGN_IN.wrongTitle);
const body = en.t(SIGN_IN.tryAgain);

test('an accordion item is a heading on the page — no fill, no shadow', async ({ mount }) => {
  const accordion = await mount(
    <Accordion items={[{ key: 'company', title, content: body }]} defaultOpen={['company']} />,
  );
  const item = accordion.locator('.hg-accordion-item');

  await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(item).toHaveCSS('box-shadow', 'none');
  await expect(item).toHaveCSS('border-radius', '0px');
});

test('an item in errors has no tint and its head says so', async ({ mount, page }) => {
  const accordion = await mount(
    <Accordion
      items={[{ key: 'company', title, state: 'errors', stateLabel: toFix, content: body }]}
    />,
  );
  const item = accordion.locator('.hg-accordion-item');

  await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(item.getByRole('button', { name: title })).toHaveAttribute('aria-invalid', 'true');
  await expect(item.getByText(toFix)).toHaveCSS(
    'color',
    await resolvedColour(page, '--danger-text'),
  );
  await expect(item.locator('.hg-accordion-dot')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--danger'),
  );
});
