import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { RichText } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedLength } from '../support/token';

/**
 * The terms editor's frame is a field's well, as every field is (`F7-15`, the design system's
 * `RichText.jsx`): `--fill`, the expressive field radius, no shadow, and focus an inset accent ring.
 * The frame holds its own controls, so the link address inside it is white.
 */
const en = await createTranslator('en');
const label = en.t(COMPANY_SIGNUP.companyName);

test('the frame is the field well: fill, field radius, no shadow', async ({ mount, page }) => {
  const editor = await mount(<RichText label={label} />);
  const frame = editor.locator('.hg-rich-text-frame');

  await expect(frame).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expect(frame).toHaveCSS(
    'border-radius',
    `${await resolvedLength(page, '--r-input-expressive')}px`,
  );
  await expect(frame).toHaveCSS('box-shadow', 'none');
});

test('focus in the text draws the inset accent ring', async ({ mount, page }) => {
  const editor = await mount(<RichText label={label} />);

  await editor.getByRole('textbox').focus();
  const accent = await resolvedColour(page, '--accent');
  await expect(editor.locator('.hg-rich-text-frame')).toHaveCSS(
    'box-shadow',
    `${accent} 0px 0px 0px 1.5px inset`,
  );
});

test('the link address inside the well is white', async ({ mount, page }) => {
  const editor = await mount(<RichText label={label} />);

  /* The sixth tool is the link: the five marks come first (`RichText.commands.ts`). */
  await editor.locator('.hg-rich-text-tool').nth(5).dispatchEvent('mousedown');
  await expect(editor.locator('.hg-rich-text-href')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});

test('a disabled, empty editor keeps its hint readable on the sunken well', async ({
  mount,
  page,
}) => {
  const editor = await mount(<RichText label={label} disabled />);

  await expect(editor.locator('.hg-rich-text-placeholder')).toHaveCSS(
    'color',
    await resolvedColour(page, '--text-secondary'),
  );
});
