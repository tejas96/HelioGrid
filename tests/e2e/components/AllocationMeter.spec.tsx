import { createTranslator, paymentTermsWords } from '@heliogrid/i18n';
import { AllocationMeter } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Locator } from '@playwright/test';
import { rightOf } from '../support/layout';
import { resolvedColour } from '../support/token';

const en = await createTranslator('en');
const words = paymentTermsWords(en.t);
const label = words.split(words.platformStandard);

/* A 375px phone less its page gutters and the card's padding: the room a template card's split has. */
const PHONE_CARD_BODY = 311;

const FOUR_PARTS = [
  { label: 'Advance', value: 30, caption: 'Won' },
  { label: 'Material', value: 40, caption: 'Delivered' },
  { label: 'Installation', value: 20, caption: 'Installed' },
  { label: 'Handover', value: 10, caption: 'Commissioned' },
];

const FIVE_PARTS = [
  { label: 'Booking', value: 10, caption: 'Won' },
  { label: 'Advance', value: 20, caption: 'Surveyed' },
  { label: 'Material', value: 40, caption: 'Delivered' },
  { label: 'Installation', value: 20, caption: 'Installed' },
  { label: 'Handover', value: 10, caption: 'Commissioned' },
];

function splitOf(parts: typeof FOUR_PARTS) {
  return (
    <div style={{ width: PHONE_CARD_BODY }}>
      <AllocationMeter variant="split" label={label} density="functional" parts={parts} />
    </div>
  );
}

/** The distinct rows the key's entries sit on, by their top edge. */
async function keyRows(region: Locator): Promise<number> {
  const tops = await region
    .getByRole('listitem')
    .evaluateAll((entries) =>
      entries.map((entry) => Math.round(entry.getBoundingClientRect().top)),
    );
  return new Set(tops).size;
}

/** How many words of the region's captions the browser broke across two lines. */
async function brokenWords(region: Locator): Promise<number> {
  return region.locator('.hg-allocation-split-caption').evaluateAll(
    (captions) =>
      captions.flatMap((caption) => {
        const text = caption.firstChild;
        if (text === null) {
          return [];
        }
        const content = text.textContent ?? '';
        return [...content.matchAll(/\S+/g)].filter((match) => {
          const start = match.index ?? 0;
          const range = document.createRange();
          range.setStart(text, start);
          range.setEnd(text, start + match[0].length);
          return range.getClientRects().length > 1;
        });
      }).length,
  );
}

test('the split’s key in one row up to four parts: no caption word breaks inside itself', async ({
  mount,
  page,
}) => {
  const card = await mount(splitOf(FOUR_PARTS));
  const region = card.getByRole('region', { name: label });

  await expect(region.getByRole('listitem')).toHaveCount(FOUR_PARTS.length);
  expect(await keyRows(region)).toBe(1);
  expect(await brokenWords(region)).toBe(0);
  expect(await rightOf(region.getByRole('list'))).toBeLessThanOrEqual(await rightOf(card));

  const swatches = region.locator('.hg-allocation-swatch');
  for (const [index] of FOUR_PARTS.entries()) {
    await expect(swatches.nth(index)).toHaveCSS(
      'background-color',
      await resolvedColour(page, `--chart-${index + 1}`),
    );
  }
});

test('a split of five parts wraps its key onto a second row', async ({ mount }) => {
  const card = await mount(splitOf(FIVE_PARTS));
  const region = card.getByRole('region', { name: label });

  await expect(region.getByRole('listitem')).toHaveCount(FIVE_PARTS.length);
  expect(await keyRows(region)).toBeGreaterThan(1);
  expect(await brokenWords(region)).toBe(0);
});

test('a split draws no remainder sentence, no rule and no figure: only each share and its caption', async ({
  mount,
}) => {
  const card = await mount(splitOf(FOUR_PARTS));
  const region = card.getByRole('region', { name: label });

  await expect(region.getByRole('meter')).toHaveCount(0);
  await expect(region.locator('.hg-allocation-words')).toHaveCount(0);
  await expect(region).toHaveText(
    FOUR_PARTS.map((part) => `${part.value}%${part.caption}`).join(''),
  );
});
