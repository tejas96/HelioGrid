import { AMOUNT_WHOLE_DIGITS_MAX } from '@heliogrid/domain';
import { createTranslator, SETUP_LANGUAGE } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { expect, test } from '@playwright/experimental-ct-react';
import { settledBox } from '../support/layout';
import { HeldNumberField } from './NumberField.story';

/**
 * A figure field's own limits. A money field takes no more digits before the point than an amount
 * holds on the wire: past them a typed digit is not taken, so the figure never loses precision as
 * it is shown, and a longer figure pasted at once stays as pasted, unformatted, for the caller's
 * error to stand beside. Step 3's size figure, sized to itself, is never narrower than a thumb.
 */
const en = await createTranslator('en');
const LABEL = en.t(SETUP_LANGUAGE.group);
const AT_LIMIT = '9'.repeat(AMOUNT_WHOLE_DIGITS_MAX);
const PAST_LIMIT = '123456789012345678';
/** The touch floor, `theme.layout['touch-min']`. */
const TOUCH_MIN = theme.layout['touch-min'];

test('a digit typed past the whole digits is not taken; the point and paise still are', async ({
  mount,
}) => {
  const field = await mount(
    <HeldNumberField label={LABEL} unit="" currency wholeDigits={AMOUNT_WHOLE_DIGITS_MAX} />,
  );
  const input = field.getByRole('textbox', { name: LABEL });
  await input.pressSequentially(`${AT_LIMIT}9`);
  await expect(input).toHaveValue(AT_LIMIT);
  await input.pressSequentially('.5');
  await expect(input).toHaveValue(`${AT_LIMIT}.5`);
});

test('digits that reach the field together past the whole digits are not taken, as a phone reports a fast thumb', async ({
  mount,
}) => {
  const field = await mount(
    <HeldNumberField label={LABEL} unit="" currency wholeDigits={AMOUNT_WHOLE_DIGITS_MAX} />,
  );
  const input = field.getByRole('textbox', { name: LABEL });
  const head = AT_LIMIT.slice(0, -1);
  await input.pressSequentially(head);
  /* One change event carrying three more digits — what React Native hands `onChangeText` when
     keystrokes arrive faster than a render. */
  await input.evaluate((element, text) => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setValue?.call(element, text);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, `${head}999`);
  await expect(input).toHaveValue(AT_LIMIT);
});

test('a figure pasted past the whole digits stays as pasted, never grouped into a rounded one', async ({
  mount,
}) => {
  const field = await mount(
    <HeldNumberField label={LABEL} unit="" currency wholeDigits={AMOUNT_WHOLE_DIGITS_MAX} />,
  );
  const input = field.getByRole('textbox', { name: LABEL });
  await input.fill(PAST_LIMIT);
  await input.blur();
  await expect(input).toHaveValue(PAST_LIMIT);
});

test('a stepped hero figure of one digit is still a thumb wide', async ({ mount }) => {
  const field = await mount(<HeldNumberField label={LABEL} unit="kWp" initial={3} steppers hero />);
  const box = await settledBox(field.getByRole('textbox', { name: LABEL }));
  expect(box.width).toBeGreaterThanOrEqual(TOUCH_MIN);
});
