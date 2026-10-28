import { createTranslator, PROFILE_PREFERENCES } from '@heliogrid/i18n';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { settledBox } from '../support/layout';
import { resolvedColour, resolvedLength } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { HeldSwitch } from './Switch.story';

/**
 * `SCR-M01-19`'s section rows (owner ruling D1 A): a switch whose words are a TITLE over a
 * DESCRIPTION, the toggle at the row's end and the words taking the rest of the width — at the
 * phone's 343 column and the desktop's card. The words are any title and sentence the catalog
 * holds; the description is a long one, so it has to wrap.
 */
const en = await createTranslator('en');
const TITLE = en.t(PROFILE_PREFERENCES.push);
const DESCRIPTION = en.t(PROFILE_PREFERENCES.aboutPushLine);

/** A font token as the page resolves it on a probe, so a spec never types a size or a weight. */
async function resolvedFont(
  locator: Locator,
  property: 'fontSize' | 'fontWeight',
  token: `--${string}`,
): Promise<string> {
  return locator.evaluate(
    (_, [cssProperty, name]) => {
      const probe = document.createElement('span');
      probe.style.setProperty(cssProperty, `var(${name})`);
      document.body.append(probe);
      const value = getComputedStyle(probe).getPropertyValue(cssProperty);
      probe.remove();
      return value;
    },
    [property === 'fontSize' ? 'font-size' : 'font-weight', token] as const,
  );
}

for (const width of [343, 640]) {
  test.describe(`in a ${width} column`, () => {
    test('a described switch names its title and description', async ({ mount, page }) => {
      const row = await mount(
        <HeldSwitch width={width} label={TITLE} description={DESCRIPTION} toggleAt="end" />,
      );
      const control = row.getByRole('switch', { name: TITLE, exact: true });
      await expect(control).toHaveAccessibleName(TITLE);
      await expect(control).toHaveAccessibleDescription(DESCRIPTION);
      await expect(control).not.toBeChecked();

      const title = row.getByText(TITLE, { exact: true });
      const description = row.getByText(DESCRIPTION, { exact: true });
      await expect(title).toHaveCSS(
        'font-size',
        await resolvedFont(title, 'fontSize', '--fs-body-sm'),
      );
      await expect(title).toHaveCSS(
        'font-weight',
        await resolvedFont(title, 'fontWeight', '--fw-medium'),
      );
      await expect(title).toHaveCSS('color', await resolvedColour(page, '--text-primary'));
      await expect(description).toHaveCSS(
        'font-size',
        await resolvedFont(description, 'fontSize', '--fs-caption'),
      );
      await expect(description).toHaveCSS('color', await resolvedColour(page, '--text-secondary'));
      await expect(description).not.toHaveCSS('white-space', 'nowrap');

      const titleBox = await settledBox(title);
      const descriptionBox = await settledBox(description);
      expect(
        Math.round((descriptionBox?.y ?? 0) - ((titleBox?.y ?? 0) + (titleBox?.height ?? 0))),
      ).toBe(Math.round(await resolvedLength(page, '--sp-0-5')));
      await expectTouchFloor([row.locator('.hg-switch')]);
    });

    test("the toggle sits at the row's end", async ({ mount }) => {
      const row = await mount(
        <HeldSwitch width={width} label={TITLE} description={DESCRIPTION} toggleAt="end" />,
      );
      const box = await settledBox(row);
      const label = await settledBox(row.locator('.hg-switch'));
      const track = await settledBox(row.locator('.hg-switch-track'));
      const words = await settledBox(row.locator('.hg-switch-words'));
      if (!box || !label || !track || !words) throw new Error('the row did not lay out');

      /* The row takes the whole width; the track ends at its end and keeps its own size. */
      expect(Math.round(label.width)).toBe(Math.round(box.width));
      expect(Math.round(track.x + track.width)).toBe(Math.round(box.x + box.width));
      expect(track.width).toBeGreaterThan(track.height);
      /* The words lead, take the rest, and stop before the track. */
      expect(Math.round(words.x)).toBe(Math.round(box.x));
      expect(words.x + words.width).toBeLessThanOrEqual(track.x);
      expect(words.height).toBeGreaterThan(track.height);
    });

    test('a tap on the description toggles it', async ({ mount }) => {
      const row = await mount(
        <HeldSwitch width={width} label={TITLE} description={DESCRIPTION} toggleAt="end" />,
      );
      const control = row.getByRole('switch', { name: TITLE, exact: true });
      await row.getByText(DESCRIPTION, { exact: true }).click();
      await expect(control).toBeChecked();
      await row.getByText(TITLE, { exact: true }).click();
      await expect(control).not.toBeChecked();
    });
  });
}

test('without a description or a place, the switch keeps its look', async ({ mount, page }) => {
  const row = await mount(<HeldSwitch width={343} label={TITLE} />);
  const control = row.getByRole('switch', { name: TITLE, exact: true });
  await expect(control).toHaveAccessibleDescription('');
  const label = row.getByText(TITLE, { exact: true });
  await expect(label).toHaveCSS('font-size', await resolvedFont(label, 'fontSize', '--fs-body'));
  await expect(label).toHaveCSS('color', await resolvedColour(page, '--text-primary'));

  /* The track leads, and the row is only as wide as its words. */
  const box = await settledBox(row);
  const track = await settledBox(row.locator('.hg-switch-track'));
  const hit = await settledBox(row.locator('.hg-switch'));
  expect(Math.round(track?.x ?? -1)).toBe(Math.round(box?.x ?? 0));
  expect(hit?.width ?? 0).toBeLessThan(box?.width ?? 0);
  await expectTouchFloor([row.locator('.hg-switch')]);
});
