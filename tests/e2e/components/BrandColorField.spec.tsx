import { compliantShades } from '@heliogrid/domain';
import { expect, test } from '@playwright/experimental-ct-react';
import { BRAND_COLOUR_WORDS } from '../support/brand-colour-words';
import { expectTouchFloor } from '../support/touch-target';
import { HeldBrandColorField } from './BrandColorField.story';

/**
 * `SCR-M01-18`'s colour field beside the live preview (design-system change 12): no specimen, and
 * one line naming the outcome. A colour that fails either question is offered its derived ink —
 * domain's `compliantShades(hex).ink`, the shade the api saves — and *Use it* takes it.
 */
const SHORT = BRAND_COLOUR_WORDS.short;
const INK = BRAND_COLOUR_WORDS.ink;

const FRAMES = [
  { frame: 'm18-b', hex: '#0D7A4F', line: SHORT.readsWell('white'), offersInk: false },
  { frame: 's18-u', hex: '#0070FC', line: SHORT.noTextOnIt, offersInk: true },
  { frame: 's18-o', hex: '#26968F', line: SHORT.fillsAndLines('near-black'), offersInk: true },
  { frame: 's18-n', hex: '#F2C200', line: SHORT.fillsOnly('near-black'), offersInk: true },
] as const;

test('the short verdict for each of the three shortfalls', async ({ mount }) => {
  for (const { frame, hex, line, offersInk } of FRAMES) {
    await test.step(`${frame} · ${hex}`, async () => {
      const field = await mount(<HeldBrandColorField initial={hex} />);

      await expect(field.locator('.hg-brand-color-short-line')).toHaveText(line);
      /* `specimen={false}`: beside the live document the field draws none of its own. */
      await expect(field.locator('.hg-brand-color-specimen')).toHaveCount(0);
      await expect(field.getByText(BRAND_COLOUR_WORDS.specimenLabel)).toHaveCount(0);
      /* The short line prints no ratio, so nothing in it carries a tier. */
      await expect(field.locator('.hg-provenance-tier')).toHaveCount(0);

      const swatches = await field.getByRole('radio').all();
      await expectTouchFloor(swatches);

      const row = field.locator('.hg-brand-color-ink');
      if (!offersInk) {
        await expect(row).toHaveCount(0);
        await field.unmount();
        return;
      }

      const ink = compliantShades(hex).ink;
      await expect(row.locator('.hg-brand-color-ink-hex')).toHaveText(ink);
      await expect(row.getByText(INK.caption)).toBeVisible();
      const use = row.getByRole('button', { name: INK.act, exact: true });
      await expectTouchFloor([use]);

      await use.click();
      /* `onChange` carried the ink: the held colour is now it, and the ink passes both questions. */
      await expect(
        field.getByRole('textbox', { name: BRAND_COLOUR_WORDS.hexLabel, exact: true }),
      ).toHaveValue(ink);
      await expect(field.locator('.hg-brand-color-short-line')).toHaveText(
        SHORT.readsWell('white'),
      );
      await expect(row).toHaveCount(0);
      await field.unmount();
    });
  }
});

test('the specimen draws only when asked, with no figure', async ({ mount }) => {
  const field = await mount(<HeldBrandColorField initial="#26968F" specimen />);

  const specimen = field.locator('.hg-brand-color-specimen');
  await expect(specimen).toHaveCount(1);
  await expect(field.getByText(BRAND_COLOUR_WORDS.specimenLabel)).toBeVisible();
  /* The colour cannot be a word on paper, so the specimen's word takes the derived ink. */
  const word = specimen.locator('.hg-brand-color-specimen-word');
  await expect(word).toHaveText(BRAND_COLOUR_WORDS.specimenWord);
  const ink = compliantShades('#26968F').ink;
  const [r, g, b] = [1, 3, 5].map((at) => Number.parseInt(ink.slice(at, at + 2), 16));
  await expect(word).toHaveCSS('color', `rgb(${r}, ${g}, ${b})`);
});
