import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { RICH_TEXT_ENGLISH, RICH_TEXT_MARKED } from '../support/rich-text-words';
import {
  FOCUS_RING,
  resolvedBoxShadow,
  resolvedColour,
  resolvedLength,
  STRONG_EDGE,
} from '../support/token';
import { WordedRichText } from './RichText.story';

/**
 * The terms editor's frame is a field's box, as every field is (`F7-15`, `primitives/FieldBox`): the
 * form colour inside a strong hairline, the expressive field radius, and focus the accent ring. The
 * frame holds its own controls, so the link address inside it takes the fill a control takes in a
 * white box (`primitives/Ground`).
 */
const en = await createTranslator('en');
const label = en.t(COMPANY_SIGNUP.companyName);

test('the frame is the field box: the form colour, the field radius, the hairline', async ({
  mount,
  page,
}) => {
  const editor = await mount(<WordedRichText label={label} />);
  const frame = editor.locator('.hg-rich-text-frame');

  await expect(frame).toHaveCSS('background-color', await resolvedColour(page, '--surface-form'));
  await expect(frame).toHaveCSS(
    'border-radius',
    `${await resolvedLength(page, '--r-input-expressive')}px`,
  );
  await expect(frame).toHaveCSS('box-shadow', await resolvedBoxShadow(page, STRONG_EDGE));
});

test('focus in the text draws the accent ring', async ({ mount, page }) => {
  const editor = await mount(<WordedRichText label={label} />);

  await editor.getByRole('textbox').focus();
  await expect(editor.locator('.hg-rich-text-frame')).toHaveCSS(
    'box-shadow',
    await resolvedBoxShadow(page, FOCUS_RING),
  );
});

test('the link address inside the box takes the fill a control takes there', async ({
  mount,
  page,
}) => {
  const editor = await mount(<WordedRichText label={label} />);

  /* The sixth tool is the link: the five marks come first (`RichText.commands.ts`). */
  await editor.locator('.hg-rich-text-tool').nth(5).dispatchEvent('mousedown');
  await expect(editor.locator('.hg-rich-text-href')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--fill'),
  );
});

test('a disabled, empty editor keeps its hint readable on the sunken well', async ({
  mount,
  page,
}) => {
  const editor = await mount(<WordedRichText label={label} placeholder={label} disabled />);

  await expect(editor.locator('.hg-rich-text-placeholder')).toHaveCSS(
    'color',
    await resolvedColour(page, '--text-secondary'),
  );
});

/** Everything the editor shows or speaks: its text, its accessible names and its hints. */
function saidBy(editor: Locator): Promise<string> {
  return editor.evaluate((root) =>
    [
      root.textContent ?? '',
      ...Array.from(root.querySelectorAll('[aria-label]'), (n) => n.getAttribute('aria-label')),
      ...Array.from(root.querySelectorAll('[placeholder]'), (n) => n.getAttribute('placeholder')),
    ].join('\n'),
  );
}

/* Each English word the editor once printed by itself, and the defaults it carried. */
const ENGLISH = [
  ...Object.values(RICH_TEXT_ENGLISH).filter((w): w is string => typeof w === 'string'),
  RICH_TEXT_ENGLISH.characters(0),
  RICH_TEXT_ENGLISH.characters(0, 500),
  'Type the terms your customer will read.',
  'Save as template',
];

test('every word comes from its words prop', async ({ mount }) => {
  const words = RICH_TEXT_MARKED;
  /* A template's name is tenant data, as a company types it. */
  const editor = await mount(
    <WordedRichText marked maxLength={500} templates={[{ id: 't1', name: 'Standard terms' }]} />,
  );

  await expect(editor.getByRole('toolbar', { name: words.formatting })).toBeVisible();
  for (const name of [
    words.bold,
    words.italic,
    words.heading,
    words.bulletedList,
    words.numberedList,
    words.link,
  ]) {
    await expect(editor.getByRole('button', { name, exact: true })).toBeVisible();
  }
  const logo = editor.getByRole('button', { name: words.addTheLogo, exact: true });
  await expect(logo).toHaveText(words.addLogo);
  await expect(editor.getByRole('combobox', { name: words.loadSavedTemplate })).toBeVisible();
  await expect(editor.locator('option').first()).toHaveText(words.loadTemplate);
  await expect(editor.getByRole('textbox', { name: words.editorName })).toBeVisible();
  await expect(editor.locator('.hg-rich-text-count')).toHaveText(words.characters(0, 500));
  const atRest = await saidBy(editor);

  await logo.dispatchEvent('mousedown');
  const placed = editor.getByRole('button', { name: words.removeTheLogo, exact: true });
  await expect(placed).toHaveText(words.logoOn);
  await expect(editor.locator('.hg-rich-text-logo')).toHaveText(words.logoPrintsHere);

  await editor.getByRole('button', { name: words.link, exact: true }).dispatchEvent('mousedown');
  await expect(editor.getByRole('textbox', { name: words.linkAddress })).toBeVisible();
  await expect(editor.getByRole('button', { name: words.addLink, exact: true })).toBeVisible();
  const opened = await saidBy(editor);

  for (const english of ENGLISH) {
    expect(atRest).not.toContain(english);
    expect(opened).not.toContain(english);
  }
});
