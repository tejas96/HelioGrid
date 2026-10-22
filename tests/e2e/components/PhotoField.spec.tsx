import { expect, test } from '@playwright/experimental-ct-react';
import { PhotoFieldAt } from './FirstRunProfile.story';

/**
 * `PhotoField` as `SCR-M01-09` extends it: the medium act with its glyph, the refusal as a banner
 * inside the group, and the drop onto the circle at 1536 — which rings the circle while a file is over it.
 */
for (const actIcon of ['camera', 'upload', 'retry'] as const) {
  test(`the act is medium and carries its ${actIcon} glyph`, async ({ mount }) => {
    const root = await mount(<PhotoFieldAt size={72} actIcon={actIcon} />);
    const act = root.getByRole('button', { name: 'Add a photo' });
    await expect(act.locator('svg')).toHaveCount(1);
  });
}

for (const size of [72, 120] as const) {
  test(`at ${size} the refusal is a banner inside the group`, async ({ mount }) => {
    const root = await mount(
      <PhotoFieldAt size={size} actIcon="camera" error="Try again, or add one later." />,
    );
    const group = root.getByRole('group', { name: 'Profile photo, optional' });
    await expect(group.getByText('That photo did not upload')).toBeVisible();
    await expect(group.getByText('Try again, or add one later.')).toBeVisible();
    await expect(group.getByText('Optional — without one, your initials show.')).toBeVisible();
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
