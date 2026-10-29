import { createTranslator, FIRST_RUN_PROFILE } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { PhotoFieldAt } from './PhotoField.story';

const en = await createTranslator('en');
const add = en.t(FIRST_RUN_PROFILE.photoAdd);
const refused = en.t(FIRST_RUN_PROFILE.photoFailedWide);

/**
 * `PhotoField` as `SCR-M01-09` extends it: the medium act with its glyph, the refusal as a banner
 * inside the group, and the drop onto the circle at 1536 — which rings the circle while a file is over it.
 */
for (const actIcon of ['camera', 'upload', 'retry'] as const) {
  test(`the act is medium and carries its ${actIcon} glyph`, async ({ mount }) => {
    const root = await mount(<PhotoFieldAt size={72} actIcon={actIcon} />);
    const act = root.getByRole('button', { name: add });
    await expect(act.locator('svg')).toHaveCount(1);
  });
}

for (const size of [72, 120] as const) {
  test(`at ${size} the refusal is a banner inside the group`, async ({ mount }) => {
    const root = await mount(<PhotoFieldAt size={size} actIcon="camera" error={refused} />);
    const group = root.getByRole('group', { name: en.t(FIRST_RUN_PROFILE.photoLabel) });
    await expect(group.getByText(en.t(FIRST_RUN_PROFILE.photoFailed))).toBeVisible();
    await expect(group.getByText(refused)).toBeVisible();
    await expect(group.getByText(en.t(FIRST_RUN_PROFILE.photoOptional))).toBeVisible();
  });
}

test('at 120 a file dropped on the circle is taken, and the circle rings while it is over', async ({
  mount,
  page,
}) => {
  const root = await mount(<PhotoFieldAt size={120} actIcon="upload" />);
  const mark = root.locator('.hg-photo-field-mark');
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(['x'], 'me.png', { type: 'image/png' }));
    return data;
  });
  await mark.dispatchEvent('dragover', { dataTransfer: transfer });
  await expect(mark).toHaveAttribute('data-over', 'true');
  await mark.dispatchEvent('drop', { dataTransfer: transfer });
  await expect(root.getByTestId('dropped')).toHaveText('me.png');
  await expect(mark).not.toHaveAttribute('data-over', 'true');
});

test('at 72 nothing is dropped', async ({ mount }) => {
  const root = await mount(<PhotoFieldAt size={72} actIcon="camera" />);
  await expect(root.locator('.hg-photo-field-mark')).not.toHaveAttribute('data-over');
});
