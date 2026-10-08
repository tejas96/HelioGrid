import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { HeldPhoneField } from './PhoneField.story';

const label = (await createTranslator('en')).t(SIGN_IN.mobileNumber);

/**
 * The number field keeps every digit a person enters. The dial code is the market's and sits
 * beside the box, so the box and the held E.164 value carry it exactly once.
 */
test('a national number that begins with the code digits keeps them, key by key', async ({
  mount,
}) => {
  const field = await mount(<HeldPhoneField label={label} />);
  await field.getByRole('textbox').pressSequentially('9189886266');

  await expect(field.getByRole('textbox')).toHaveValue('91898 86266');
  await expect(field.getByTestId('held')).toHaveText('+919189886266');
});

test('a number pasted with its code keeps the code once', async ({ mount, page }) => {
  const field = await mount(<HeldPhoneField label={label} />);
  await field.getByRole('textbox').focus();
  await page.evaluate(() => document.execCommand('insertText', false, '+91 98898 86266'));

  await expect(field.getByRole('textbox')).toHaveValue('98898 86266');
  await expect(field.getByTestId('held')).toHaveText('+919889886266');
});
