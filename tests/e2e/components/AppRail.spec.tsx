import { createTranslator, destinationLabel, SHELL } from '@heliogrid/i18n';
import { AppRail, BottomNav, ShellGlyph } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { resolvedColour } from '../support/token';

/**
 * The item in view is a solid ink pill, and its icon is drawn in the pill's own ink — never the
 * secondary grey the glyph's tone gives it elsewhere, which on the pill reads as no icon at all.
 * Two rules set that colour, so the check is the colour the browser paints, in light and dark.
 */
const en = await createTranslator('en');
const item = (key: 'home' | 'leads') => ({
  key,
  label: destinationLabel(en.t, key),
  icon: <ShellGlyph name="house" size="md" />,
});

async function inScheme(page: Page, scheme: 'light' | 'dark') {
  await page.evaluate(
    (value) => document.documentElement.setAttribute('data-theme', value),
    scheme,
  );
}

async function iconColour(button: Locator): Promise<string> {
  return button.locator('svg').evaluate((icon) => getComputedStyle(icon).color);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`in ${scheme}, the sidebar's item in view draws its icon in the pill's ink`, async ({
    mount,
    page,
  }) => {
    await inScheme(page, scheme);
    const rail = await mount(
      <AppRail
        label={en.t(SHELL.mainNavigation)}
        items={[item('home'), item('leads')]}
        value="home"
      />,
    );
    const inView = rail.getByRole('button', { name: destinationLabel(en.t, 'home') });
    await expect(inView).toHaveAttribute('aria-current', 'page');
    const ink = await resolvedColour(page, '--on-ink');
    await expect(inView).toHaveCSS('color', ink);
    expect(await iconColour(inView)).toBe(ink);
    // The others keep the quiet tone, so only the pill changes.
    const other = rail.getByRole('button', { name: destinationLabel(en.t, 'leads') });
    expect(await iconColour(other)).toBe(await resolvedColour(page, '--text-secondary'));
  });

  test(`in ${scheme}, the phone pill's item in view draws its icon in the pill's ink`, async ({
    mount,
    page,
  }) => {
    await inScheme(page, scheme);
    const pill = await mount(
      <div style={{ position: 'relative', height: 600 }}>
        <BottomNav
          label={en.t(SHELL.mainNavigation)}
          items={[item('home'), item('leads')]}
          value="home"
        />
      </div>,
    );
    const inView = pill.getByRole('button', { name: destinationLabel(en.t, 'home') });
    expect(await iconColour(inView)).toBe(await resolvedColour(page, '--on-ink'));
  });
}
