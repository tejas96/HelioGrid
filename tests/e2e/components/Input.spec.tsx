import { COMPANY_SIGNUP, companyFieldRefusal, createTranslator } from '@heliogrid/i18n';
import { Input } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { settledBox } from '../support/layout';
import {
  FOCUS_RING,
  resolvedBoxShadow,
  resolvedColour,
  resolvedLength,
  STRONG_EDGE,
} from '../support/token';

/**
 * The open page's field (`primitives/FieldBox`): the form colour inside a strong hairline,
 * `--field-h` tall, and focus drawn as the inset accent edge with its soft glow — the field every
 * screen draws.
 */
const en = await createTranslator('en');
const refused = companyFieldRefusal(en.t, 'companyName', { type: 'too_small' });
if (refused === undefined) throw new Error('a company with no name is refused in words');
const needed = refused;

test('an expressive field is the form colour in its hairline, the field height, and takes focus as the accent ring', async ({
  mount,
  page,
}) => {
  const field = await mount(<Input label={en.t(COMPANY_SIGNUP.companyName)} value="" />);
  const ground = field.locator('[data-field-box]');

  await expect(ground).toHaveCSS('background-color', await resolvedColour(page, '--surface-form'));
  await expect(ground).toHaveCSS('box-shadow', await resolvedBoxShadow(page, STRONG_EDGE));
  const box = await settledBox(ground);
  expect(box?.height).toBe(await resolvedLength(page, '--field-h'));

  await field.getByRole('textbox').focus();
  await expect(ground).toHaveCSS('box-shadow', await resolvedBoxShadow(page, FOCUS_RING));
});

test('a field in error shows focus while it has it, and its danger ring when it does not (F7-24)', async ({
  mount,
  page,
}) => {
  const field = await mount(
    <Input label={en.t(COMPANY_SIGNUP.companyName)} value="" error={needed} />,
  );
  const ground = field.locator('[data-field-box]');
  const danger = `${await resolvedColour(page, '--danger')} 0px 0px 0px 1.5px inset`;

  await expect(ground).toHaveCSS('box-shadow', danger);
  await field.getByRole('textbox').focus();
  await expect(ground).toHaveCSS('box-shadow', await resolvedBoxShadow(page, FOCUS_RING));
  await field.getByRole('textbox').blur();
  await expect(ground).toHaveCSS('box-shadow', danger);
  await expect(field.getByText(needed)).toBeVisible();
});

/** A placeholder is a hint, never a typed value (`F7-15`): tertiary in the well, secondary when disabled. */
test.describe('the placeholder', () => {
  const placeholderColour = (input: HTMLInputElement) =>
    getComputedStyle(input, '::placeholder').color;

  test('is --text-tertiary in an empty field', async ({ mount, page }) => {
    const field = await mount(
      <Input
        label={en.t(COMPANY_SIGNUP.companyName)}
        value=""
        placeholder={en.t(COMPANY_SIGNUP.companyNameExample)}
      />,
    );

    expect(await field.getByRole('textbox').evaluate(placeholderColour)).toBe(
      await resolvedColour(page, '--text-tertiary'),
    );
  });

  test('steps up to --text-secondary on the disabled well', async ({ mount, page }) => {
    const field = await mount(
      <Input
        label={en.t(COMPANY_SIGNUP.companyName)}
        value=""
        placeholder={en.t(COMPANY_SIGNUP.companyNameExample)}
        disabled
      />,
    );

    expect(await field.getByRole('textbox').evaluate(placeholderColour)).toBe(
      await resolvedColour(page, '--text-secondary'),
    );
  });
});
