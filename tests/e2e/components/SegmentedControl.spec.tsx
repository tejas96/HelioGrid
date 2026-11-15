import { createTranslator } from '@heliogrid/i18n';
import { SegmentedControl } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';

/*
 * A choice nobody has made draws no pill (`ui-adherence.md`: a component never states a value it was
 * not told): the step-3 Category and quick add's Type showed Residential chosen while the lead held
 * none, so the first tap on it sent nothing.
 */
const en = await createTranslator('en');
const shownAsSent = (id: string) => en.t({ id });

const options = [
  { value: 'residential', label: shownAsSent('Residential') },
  { value: 'commercial', label: shownAsSent('Commercial') },
];

test('with no value chosen no option wears the pill; a chosen one does', async ({ mount }) => {
  const none = await mount(
    <SegmentedControl ariaLabel={shownAsSent('Category')} value="" options={options} />,
  );
  await expect(none.locator('.hg-segmented-control-indicator')).toHaveCount(0);
  await expect(none.getByRole('radio', { checked: true })).toHaveCount(0);
  await none.unmount();

  const chosen = await mount(
    <SegmentedControl ariaLabel={shownAsSent('Category')} value="commercial" options={options} />,
  );
  await expect(chosen.locator('.hg-segmented-control-indicator')).toHaveCount(1);
  await expect(chosen.getByRole('radio', { name: 'Commercial', checked: true })).toBeVisible();
});
