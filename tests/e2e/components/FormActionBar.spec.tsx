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
        await expect(barAt(page, placement)).toHaveCSS('background-color', surface);
      }
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
