import { COMPANY_SIGNUP, companyFieldRefusal, createTranslator } from '@heliogrid/i18n';
import { Input } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedLength } from '../support/token';

/**
 * The open page's field (the design system's `Input`, 2026-09-29): a `--fill` ground on the white
 * page, `--field-h` tall, and focus drawn as an inset accent ring — the field every board draws.
 */
const en = await createTranslator('en');
const needed = companyFieldRefusal(en.t, 'companyName', { type: 'too_small' }) ?? '';

test('an expressive field is the fill, the field height, and takes focus as an inset accent ring', async ({
  mount,
  page,
}) => {
  const field = await mount(<Input label={en.t(COMPANY_SIGNUP.companyName)} value="" />);
  const ground = field.locator('[data-field-box]');

  await expect(ground).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  const box = await ground.boundingBox();
  expect(box?.height).toBe(await resolvedLength(page, '--field-h'));

  await field.getByRole('textbox').focus();
  const accent = await resolvedColour(page, '--accent');
  await expect(ground).toHaveCSS('box-shadow', `${accent} 0px 0px 0px 1.5px inset`);
});

test('a field in error shows focus while it has it, and its danger ring when it does not (F7-24)', async ({
  mount,
  page,
}) => {
  const field = await mount(
    <Input label={en.t(COMPANY_SIGNUP.companyName)} value="" error={needed} />,
  );
  const ground = field.locator('[data-field-box]');
  const ring = async (token: `--${string}`) =>
    `${await resolvedColour(page, token)} 0px 0px 0px 1.5px inset`;

  await expect(ground).toHaveCSS('box-shadow', await ring('--danger'));
  await field.getByRole('textbox').focus();
  await expect(ground).toHaveCSS('box-shadow', await ring('--accent'));
  await field.getByRole('textbox').blur();
  await expect(ground).toHaveCSS('box-shadow', await ring('--danger'));
  await expect(field.getByText(needed)).toBeVisible();
});
