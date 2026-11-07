import { COMPANY_PROFILE, createTranslator, PRICE_BOOK } from '@heliogrid/i18n';
import { FormActionBar } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator, Page } from '@playwright/test';
import { bottomOf, expectNoSidewaysScroll, rightOf, settledBox } from '../support/layout';
import { resolvedColour, resolvedLength, resolvedShadow } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';

/**
 * The act bar a settings form raises with a change (`SCR-M01-18` s18-m at 375, s18-r at 1536):
 * the consequence, then Save, then Discard, at both placements. The words are borrowed from
 * screens that already show them — the bar has no word of its own.
 */
const en = await createTranslator('en');
const hi = await createTranslator('hi');

type Words = typeof en;

const barsIn = (words: Words, saving: boolean) => (
  <div>
    <FormActionBar
      placement="sticky"
      align="center"
      consequence={words.t(COMPANY_PROFILE.reseedScope)}
      saveLabel={words.t(COMPANY_PROFILE.saveChanges)}
      discardLabel={words.t(PRICE_BOOK.cancel)}
      saving={saving}
      focusAfter={{ current: null }}
    />
    {/* The settings editor card the footer is the foot of: its padding is the one the bar reaches through. */}
    <div style={{ padding: 'var(--sp-5)' }}>
      <FormActionBar
        placement="footer"
        align="center"
        consequence={words.t(COMPANY_PROFILE.reseedScope)}
        saveLabel={words.t(COMPANY_PROFILE.saveChanges)}
        discardLabel={words.t(PRICE_BOOK.cancel)}
        saving={saving}
        focusAfter={{ current: null }}
      />
    </div>
  </div>
);

const barAt = (page: Page, placement: 'sticky' | 'footer') =>
  page.locator(`.hg-form-action-bar[data-placement="${placement}"]`);

async function expectOneOrder(bar: Locator, words: Words): Promise<void> {
  const consequence = bar.getByText(words.t(COMPANY_PROFILE.reseedScope));
  const save = bar.getByRole('button', { name: words.t(COMPANY_PROFILE.saveChanges) });
  const discard = bar.getByRole('button', { name: words.t(PRICE_BOOK.cancel) });
  await expect(consequence).toBeVisible();
  expect(await bottomOf(consequence)).toBeLessThanOrEqual((await settledBox(save))?.y ?? 0);
  const discardBox = await settledBox(discard);
  const sameRow = (discardBox?.y ?? 0) < (await bottomOf(save));
  if (sameRow) expect(await rightOf(save)).toBeLessThanOrEqual(discardBox?.x ?? 0);
  else expect(await bottomOf(save)).toBeLessThanOrEqual(discardBox?.y ?? 0);
  await expectTouchFloor([save, discard]);
}

/** A computed colour's channels, 0–1 with its alpha: `rgb()`/`rgba()` or `color(srgb …)`. */
function channelsOf(colour: string): readonly number[] {
  const srgb = colour.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
  if (srgb !== null) return [srgb[1], srgb[2], srgb[3], srgb[4] ?? '1'].map(Number);
  const rgb = colour.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);
  if (rgb === null) throw new Error(`not a colour: ${colour}`);
  return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255, Number(rgb[4] ?? '1')];
}

/**
 * The phone's sticky bar is the card colour frosted over the page: the card's own colour, nearly
 * opaque, with the page blurred behind it — never a tint that lets the form show through. The glass
 * may be the bar's own paint or its `::before` layer (a backdrop filter on the bar itself would
 * hold a fixed overlay opened inside it), so either is read.
 */
async function expectFrostedCard(bar: Locator, surface: string) {
  const { colour, backdrop } = await bar.evaluate((node) => {
    const own = getComputedStyle(node);
    const layer = getComputedStyle(node, '::before');
    const clear = (value: string) => value === 'rgba(0, 0, 0, 0)' || value === 'transparent';
    return {
      colour: clear(own.backgroundColor) ? layer.backgroundColor : own.backgroundColor,
      backdrop: own.backdropFilter === 'none' ? layer.backdropFilter : own.backdropFilter,
    };
  });
  const [r = 0, g = 0, b = 0, alpha = 0] = channelsOf(colour);
  const [sr = 0, sg = 0, sb = 0] = channelsOf(surface);
  expect(Math.max(Math.abs(r - sr), Math.abs(g - sg), Math.abs(b - sb))).toBeLessThan(0.01);
  expect(alpha).toBeGreaterThanOrEqual(0.8);
  expect(backdrop).toContain('blur');
}

test('sticky and footer', async ({ mount, page }) => {
  const surface = await resolvedColour(page, '--surface');
  const raised = await resolvedShadow(page, '--e4');
  const hairline = await resolvedColour(page, '--line-soft');
  const tile = await resolvedLength(page, '--r-tile');

  const bars = await mount(barsIn(en, false));
  for (const words of [en, hi]) {
    if (words === hi) await bars.update(barsIn(hi, false));
    for (const width of [375, 1536]) {
      await page.setViewportSize({ width, height: 900 });
      for (const placement of ['sticky', 'footer'] as const) {
        await expectOneOrder(barAt(page, placement), words);
      }
      await expectFrostedCard(barAt(page, 'sticky'), surface);
      await expect(barAt(page, 'footer')).toHaveCSS('background-color', surface);
      await expectNoSidewaysScroll(page);
    }
  }

  const sticky = barAt(page, 'sticky');
  await expect(sticky).toHaveCSS('position', 'sticky');
  await expect(sticky).toHaveCSS('bottom', '0px');
  await expect(sticky).toHaveCSS('box-shadow', raised);

  const footer = barAt(page, 'footer');
  await expect(footer).toHaveCSS('box-shadow', 'none');
  await expect(footer).toHaveCSS('border-top-color', hairline);
  await expect(footer).toHaveCSS('border-bottom-left-radius', `${tile}px`);
  await expect(footer).toHaveCSS('border-bottom-right-radius', `${tile}px`);

  await bars.update(barsIn(en, true));
  for (const placement of ['sticky', 'footer'] as const) {
    const bar = barAt(page, placement);
    const save = bar.getByRole('button', { name: en.t(COMPANY_PROFILE.saveChanges) });
    const discard = bar.getByRole('button', { name: en.t(PRICE_BOOK.cancel) });
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await expect(save).toBeEnabled();
    await expect(discard).toBeDisabled();
    await expectTouchFloor([save, discard]);
  }
});
