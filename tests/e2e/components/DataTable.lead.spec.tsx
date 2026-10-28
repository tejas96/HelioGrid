import { CATALOG_SETTINGS, createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import { settledBox } from '../support/layout';
import { resolvedColour, resolvedLength } from '../support/token';
import { MIN_TOUCH_TARGET } from '../support/touch-target';
import { KindTable, PagedList } from './DataTable.story';

/** `D268`: the kind tile and quiet line a primary cell carries, and `Pagination` on its own. */
const en = await createTranslator('en');
const label = en.t(SIGN_IN.mobileNumber);
const value = en.t(SIGN_IN.changeNumber);
const issue = en.t(SIGN_IN.wrongError);

test.describe('a kind tile and a quiet line on the primary cell (D268)', () => {
  /** The grid row at 1536 and the stacked card at 375 — the cell carries both into each form. */
  const FORMS = [
    { stacked: false, width: 1536 },
    { stacked: true, width: 375 },
  ];

  test('a leading visual sits before the primary text', async ({ mount, page }) => {
    for (const form of FORMS) {
      await page.setViewportSize({ width: form.width, height: 800 });
      const table = await mount(
        <KindTable label={label} value={value} sub={issue} stacked={form.stacked} />,
      );
      const tile = table.locator('.hg-iris-tile');
      const tileBox = await settledBox(tile);
      const nameBox = await settledBox(table.getByText(value, { exact: true }));

      await expect(tile).toHaveAttribute('aria-hidden', 'true');
      await expect(tile).toHaveCSS('width', '34px');
      await expect(tile).toHaveCSS('height', '34px');
      await expect(tile).toHaveCSS('border-radius', `${await resolvedLength(page, '--r-sm')}px`);
      expect((tileBox?.x ?? 0) + (tileBox?.width ?? 0)).toBeLessThanOrEqual(nameBox?.x ?? 0);
      /* One line: the tile sits beside the name, never above it. */
      expect(nameBox?.y ?? 0).toBeLessThan((tileBox?.y ?? 0) + (tileBox?.height ?? 0));
      expect((nameBox?.y ?? 0) + (nameBox?.height ?? 0)).toBeGreaterThan(tileBox?.y ?? 0);
      await table.unmount();
    }
  });

  test('a sub-line sits under the primary cell', async ({ mount, page }) => {
    for (const form of FORMS) {
      await page.setViewportSize({ width: form.width, height: 800 });
      const table = await mount(
        <KindTable label={label} value={value} sub={issue} stacked={form.stacked} />,
      );
      const sub = table.getByText(issue, { exact: true });
      const subBox = await settledBox(sub);
      const nameBox = await settledBox(table.getByText(value, { exact: true }));

      expect(subBox?.y ?? 0).toBeGreaterThanOrEqual((nameBox?.y ?? 0) + (nameBox?.height ?? 0) - 1);
      expect(Math.abs((subBox?.x ?? 0) - (nameBox?.x ?? 0))).toBeLessThan(1);
      await expect(sub).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-caption')}px`);
      await expect(sub).toHaveCSS('font-weight', '400');
      await expect(sub).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
      await table.unmount();
    }
  });
});

test('Pagination pages on its own', async ({ mount }) => {
  const previous = en.t(CATALOG_SETTINGS.previousPage);
  const next = en.t(CATALOG_SETTINGS.nextPage);
  const frame = await mount(<PagedList previousLabel={previous} nextLabel={next} />);
  const back = frame.getByRole('button', { name: previous });
  const forward = frame.getByRole('button', { name: next });

  await expect(frame.getByText('1–20 / 45')).toBeVisible();
  await expect(back).toBeDisabled();
  expect((await settledBox(forward))?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect((await settledBox(forward))?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);

  await forward.click();
  await expect(frame).toHaveAttribute('data-page', '1');
  await expect(frame.getByText('21–40 / 45')).toBeVisible();
  await expect(back).toBeEnabled();

  await forward.click();
  await expect(frame.getByText('41–45 / 45')).toBeVisible();
  await expect(forward).toBeDisabled();

  await back.click();
  await expect(frame).toHaveAttribute('data-page', '1');
});
