import { createTranslator, SETUP_LANGUAGE } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { LeavingNumberField } from './NumberField.story';

/**
 * On touch a press never takes focus from the field first, so the builder's Next, Back and ✕ unmount
 * a field that is still in use: the figure typed into it is handed up as it goes, never lost with no
 * ask (`packages/ui/CLAUDE.md` Traps). And inside a form with its own Save every field hands its
 * edit up as typed, so the Save it is pressed beside sends it.
 */
const en = await createTranslator('en');
const LABEL = en.t(SETUP_LANGUAGE.group);
const UNIT = 'kWp';

test('a field taken away while still in use hands up the figure typed into it', async ({
  mount,
  page,
}) => {
  const field = await mount(<LeavingNumberField label={LABEL} unit={UNIT} />);
  const input = field.getByRole('textbox', { name: LABEL });

  await input.pressSequentially('42');
  await expect(page.getByTestId('held')).toHaveText('');
  await page.keyboard.press('F2');

  await expect(input).toHaveCount(0);
  await expect(page.getByTestId('held')).toHaveText('42');
});

test('inside a form with its own Save a field hands up each figure as it is typed', async ({
  mount,
}) => {
  const field = await mount(<LeavingNumberField label={LABEL} unit={UNIT} inForm />);
  const input = field.getByRole('textbox', { name: LABEL });

  await input.pressSequentially('7');

  await expect(input).toBeFocused();
  await expect(field.getByTestId('held')).toHaveText('7');
});
