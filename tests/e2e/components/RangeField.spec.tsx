import { createTranslator, SETUP_LANGUAGE } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedFont } from '../support/token';
import { HeldRangeField } from './RangeField.story';

/**
 * A range's two typed ends are fields, so they take `Input`'s face — the sans, normal weight,
 * tabular figures — and their unit is secondary: text in a well is never the quiet role
 * (`F7-15`).
 */
const en = await createTranslator('en');

/* Any words: the spec reads the faces, not the words. A unit is a quantity's symbol, never
   translated, so it is written as the product writes it. */
const LABEL = en.t(SETUP_LANGUAGE.group);
const BOX_LABELS: [string, string] = [en.t(SETUP_LANGUAGE.title), en.t(SETUP_LANGUAGE.askTitle)];
const UNIT = 'W';

test('the end boxes take the sans face', async ({ mount, page }) => {
  const range = await mount(
    <HeldRangeField
      label={LABEL}
      unit={UNIT}
      boxLabels={BOX_LABELS}
      initial={[300, 500]}
      min={0}
      max={700}
    />,
  );

  const sans = await resolvedFont(page, 'fontFamily', '--font-sans');
  const regular = await resolvedFont(page, 'fontWeight', '--fw-regular');
  for (const name of BOX_LABELS) {
    const end = range.getByRole('textbox', { name, exact: true });
    await expect(end).toHaveCSS('font-family', sans);
    await expect(end).toHaveCSS('font-weight', regular);
    await expect(end).toHaveCSS('font-variant-numeric', 'tabular-nums');
  }

  const units = range.locator('.hg-range-end-unit');
  await expect(units).toHaveCount(2);
  const secondary = await resolvedColour(page, '--text-secondary');
  for (const unit of await units.all()) {
    await expect(unit).toHaveText(UNIT);
    await expect(unit).toHaveCSS('color', secondary);
  }
});
