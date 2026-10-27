import { createTranslator, SETUP_LANGUAGE } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedFont } from '../support/token';
import { HeldNumberField, NamedNumberField } from './NumberField.story';

/**
 * A number field with no value is UNSET: an empty box beside its unit, never `0` — a figure nobody
 * declared has no tier that could qualify it (`F8-01`). A figure commits once on blur; an empty
 * draft commits nothing. And the tier line under it can be load-bearing: the secondary role
 * instead of the quiet one, picked by the component (`F7-11`).
 */
const en = await createTranslator('en');

/* Any label: the spec measures the box and the line, not the word. A unit is a quantity's symbol,
   never translated, so it is written as the product writes it. */
const LABEL = en.t(SETUP_LANGUAGE.group);
const UNIT = 'kWp';

test('an unset field shows no figure: an empty box beside its unit, never 0', async ({ mount }) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} />);

  const box = field.locator('.hg-number-field');
  await expect(field.getByRole('textbox', { name: LABEL })).toHaveValue('');
  await expect(box.getByText('0', { exact: true })).toHaveCount(0);
  await expect(box.getByText(UNIT, { exact: true })).toBeVisible();
  await expect(field.getByTestId('held')).toHaveText('');
});

test('a figure commits once on blur, and an empty draft on a set field commits nothing and the figure returns', async ({
  mount,
}) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} />);
  const input = field.getByRole('textbox', { name: LABEL });

  await input.fill('5');
  await expect(field.getByTestId('commits')).toHaveText('0');
  await input.blur();
  await expect(field.getByTestId('held')).toHaveText('5');
  await expect(field.getByTestId('commits')).toHaveText('1');
  await expect(input).toHaveValue('5');

  await input.fill('');
  await input.blur();
  await expect(input).toHaveValue('5');
  await expect(field.getByTestId('held')).toHaveText('5');
  await expect(field.getByTestId('commits')).toHaveText('1');
});

test('an empty draft on an unset field leaves it unset', async ({ mount }) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} />);
  const input = field.getByRole('textbox', { name: LABEL });

  await input.fill('7');
  await input.fill('');
  await input.blur();
  await expect(input).toHaveValue('');
  await expect(field.getByTestId('held')).toHaveText('');
  await expect(field.getByTestId('commits')).toHaveText('0');
});

test('a field that commits as typed reports each figure before it is left, leaves the draft as typed, and reports nothing for an emptied box', async ({
  mount,
}) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} asTyped />);
  const input = field.getByRole('textbox', { name: LABEL });

  await input.pressSequentially('12.');
  await expect(field.getByTestId('held')).toHaveText('12');
  await expect(field.getByTestId('commits')).toHaveText('2');
  await expect(input).toHaveValue('12.');

  await input.fill('');
  await expect(field.getByTestId('held')).toHaveText('12');
  await input.blur();
  await expect(input).toHaveValue('12');
  await expect(field.getByTestId('commits')).toHaveText('2');
});

test('a field that commits as typed and may be cleared reports the empty box before it is left', async ({
  mount,
}) => {
  /* On touch a tap on *Save* does not leave the field: the last digit must never stand in for an
     emptied box. */
  const field = await mount(
    <HeldNumberField label={LABEL} unit={UNIT} initial={14} asTyped clears />,
  );
  const input = field.getByRole('textbox', { name: LABEL });

  await input.focus();
  await input.press('End');
  await input.press('Backspace');
  await expect(field.getByTestId('held')).toHaveText('1');
  await input.press('Backspace');
  await expect(input).toHaveValue('');
  await expect(field.getByTestId('held')).toHaveText('');
});

test("a money field at rest reads in the market's money format, and editing shows the plain figure", async ({
  mount,
}) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} initial={18000} currency />);
  const input = field.getByRole('textbox', { name: LABEL });
  await expect(input).toHaveValue(/^₹18,000$/u);
  await input.focus();
  await expect(input).toHaveValue('18000');
  await input.fill('7000');
  await input.blur();
  await expect(field.getByTestId('held')).toHaveText('7000');
  await expect(input).toHaveValue(/^₹7,000$/u);
});

test('a money field at rest keeps its paise', async ({ mount }) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} initial={95.5} currency />);
  await expect(field.getByRole('textbox', { name: LABEL })).toHaveValue(/^₹95\.50$/u);
});

test('from an unset field a step lands on the floor where there is one, and one step from 0 where there is none', async ({
  mount,
}) => {
  const floored = await mount(<HeldNumberField label={LABEL} unit={UNIT} min={3} steppers />);
  await floored.getByRole('button').last().click();
  await expect(floored.getByTestId('held')).toHaveText('3');
  await expect(floored.getByRole('textbox', { name: LABEL })).toHaveValue('3');
  await floored.unmount();

  const free = await mount(<HeldNumberField label={LABEL} unit={UNIT} steppers />);
  await free.getByRole('button').last().click();
  await expect(free.getByTestId('held')).toHaveText('1');
});

test('the tier line is quiet by default and takes the secondary role when load-bearing; the dot is unchanged', async ({
  mount,
  page,
}) => {
  const quiet = await mount(<HeldNumberField label={LABEL} unit={UNIT} tier />);
  const quietLine = quiet.locator('.hg-provenance');
  await expect(quietLine).toHaveCSS('color', await resolvedColour(page, '--text-tertiary'));
  const quietDot = await quiet
    .locator('.hg-provenance-dot')
    .evaluate((dot) => getComputedStyle(dot).backgroundColor);
  await quiet.unmount();

  const loadBearing = await mount(
    <HeldNumberField label={LABEL} unit={UNIT} tier emphasis="load-bearing" />,
  );
  const line = loadBearing.locator('.hg-provenance');
  await expect(line).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
  await expect(loadBearing.locator('.hg-provenance-dot')).toHaveCSS('background-color', quietDot);
});

test('the value starts at the left in the sans face', async ({ mount, page }) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} initial={5} />);
  const input = field.getByRole('textbox', { name: LABEL });

  await expect(input).toHaveCSS(
    'font-family',
    await resolvedFont(page, 'fontFamily', '--font-sans'),
  );
  await expect(input).toHaveCSS(
    'font-weight',
    await resolvedFont(page, 'fontWeight', '--fw-regular'),
  );
  await expect(input).toHaveCSS('font-variant-numeric', 'tabular-nums');
  await expect(input).toHaveCSS('text-align', 'start');
  const unit = field.getByText(UNIT, { exact: true });
  await expect(unit).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
  const inputBox = await input.boundingBox();
  const unitBox = await unit.boundingBox();
  expect(unitBox?.x).toBeGreaterThanOrEqual((inputBox?.x ?? 0) + (inputBox?.width ?? 0));
  await field.unmount();

  const stepped = await mount(<HeldNumberField label={LABEL} unit={UNIT} initial={5} steppers />);
  await expect(stepped.getByRole('textbox', { name: LABEL })).toHaveCSS('text-align', 'center');
});

test('an amount keeps the mono face', async ({ mount, page }) => {
  const field = await mount(<HeldNumberField label={LABEL} unit={UNIT} initial={5} currency />);
  const input = field.getByRole('textbox', { name: LABEL });

  await expect(input).toHaveCSS(
    'font-family',
    await resolvedFont(page, 'fontFamily', '--font-mono'),
  );
  await expect(input).toHaveCSS(
    'font-weight',
    await resolvedFont(page, 'fontWeight', '--fw-regular'),
  );
  await expect(input).toHaveCSS('text-align', 'start');
});

/* The column on `SCR-M01-20` labels its shares once; each row's field is named by `ariaLabel`. */
const SHARE_NAME = 'Share of Second instalment';

test('an ariaLabel names the field', async ({ mount }) => {
  const unlabelled = await mount(<NamedNumberField ariaLabel={SHARE_NAME} />);
  await expect(unlabelled.getByRole('textbox', { name: SHARE_NAME })).toBeVisible();
  await expect(unlabelled.locator('label')).toHaveCount(0);
  await expect(unlabelled.getByText(SHARE_NAME)).toHaveCount(0);
  await unlabelled.unmount();

  const labelled = await mount(<NamedNumberField label={LABEL} ariaLabel={SHARE_NAME} />);
  await expect(labelled.getByRole('textbox', { name: LABEL })).toBeVisible();
  await expect(labelled.getByRole('textbox', { name: SHARE_NAME })).toHaveCount(0);
});
