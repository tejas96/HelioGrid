import { createTranslator, filterPanelWords } from '@heliogrid/i18n';
import type { FilterDimension } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { HeldFilterPanel } from './FilterPanel.story';

/**
 * Design-system change 8 (`SCR-M01-15`, design-system change 8): one column of sections at every width, a hairline between,
 * *Clear all* once in the footer, every flag a `Switch` row in a last *Show* section, a chip list
 * longer than six capped behind *Show all*, and a dimension under a value folded as one
 * `Accordion` line that shows only while the value is chosen and is cleared when it is not.
 */
const en = await createTranslator('en');
const words = filterPanelWords(en.t);

/* A screen's dimensions are the screen's own words — catalog data here, as `SCR-M01-15`'s board
   passes them. Only the panel's own words are asserted, and they come from the catalog. */
const PANELS = 'Panels';
const PANEL_SPECS = { key: 'kind', value: PANELS, group: 'Panel specs' };
const KINDS = [PANELS, 'Inverters', 'Batteries', 'Micro-inverters', 'Optimisers'];
const MAKERS = [
  'Adani',
  'Waaree',
  'Vikram',
  'Tata',
  'Goldi',
  'Rayzon',
  'Premier',
  'Saatvik',
  'Emmvee',
];
const PREFERRED = 'Preferred items only';
const ARCHIVED = 'Archived items instead';

const DIMENSIONS: FilterDimension[] = [
  { key: 'source', kind: 'facet', label: 'Source', options: ['Platform', 'Your SKUs'] },
  { key: 'kind', kind: 'facet', label: 'Component kind', noun: 'kinds', options: KINDS },
  {
    key: 'wattage',
    kind: 'range',
    label: 'Wattage',
    min: 0,
    max: 700,
    step: 5,
    unit: 'Wp',
    under: PANEL_SPECS,
  },
  {
    key: 'technology',
    kind: 'one-of',
    label: 'Technology',
    options: ['Any', 'Mono PERC', 'TOPCon', 'Bifacial', 'Poly', 'HJT'],
    allValue: 'Any',
    under: PANEL_SPECS,
  },
  { key: 'maker', kind: 'facet', label: 'Maker', noun: 'makers', options: MAKERS },
  { key: 'preferred', kind: 'flag', label: 'Ranking', optionLabel: PREFERRED },
  { key: 'archived', kind: 'flag', label: 'Archived', optionLabel: ARCHIVED },
];

const INITIAL = {
  source: [],
  kind: [],
  wattage: null,
  technology: 'Any',
  maker: [MAKERS[7] ?? ''],
  preferred: false,
  archived: false,
};

/** One key of what the panel holds now, read until it settles. */
const heldKey = (page: Page, key: string) => async () =>
  (JSON.parse((await page.getByTestId('held').textContent()) ?? '{}') as Record<string, unknown>)[
    key
  ];

const sections = (page: Page) => page.getByRole('dialog').locator('.hg-filter-section');

test('one column of sections at 375 and 1536', async ({ mount, page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mount(<HeldFilterPanel dimensions={DIMENSIONS} initial={INITIAL} resultNoun="items" />);
  for (const [width, height] of [
    [375, 812],
    [1536, 960],
  ] as const) {
    await page.setViewportSize({ width, height });
    /* Source, kind, maker, then Show — the folded two stay out while Panels is not chosen. */
    await expect(sections(page)).toHaveCount(4);
    const lefts = new Set(
      await sections(page).evaluateAll((all: Element[]) =>
        all.map((s) => s.getBoundingClientRect().x),
      ),
    );
    expect(lefts.size).toBe(1);
    /* A hairline between, none above the first. */
    await expect(sections(page).first()).toHaveCSS('border-top-width', '0px');
    await expect(sections(page).nth(1)).toHaveCSS('border-top-width', '1px');
    /* Clear all once, in the footer; no "N of M filters on" header. */
    await expect(page.getByRole('button', { name: words.clearAll })).toHaveCount(1);
    await expect(page.locator('.hg-filter-panel-footer')).toContainText(words.clearAll);
    await expect(page.locator('.hg-filter-set-header')).toHaveCount(0);
    await expect(page.getByRole('button', { name: words.showResults(2, 'items') })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test('flags are switches in a last Show section', async ({ mount, page }) => {
  await mount(<HeldFilterPanel dimensions={DIMENSIONS} initial={INITIAL} resultNoun="items" />);
  const show = sections(page).last();
  await expect(show.getByRole('heading', { name: words.show, exact: true })).toBeVisible();
  await expect(show.getByRole('switch')).toHaveCount(2);
  await expect(page.getByRole('dialog').getByRole('switch')).toHaveCount(2);
  await expect(page.getByRole('dialog').getByRole('checkbox')).toHaveCount(0);

  await show.getByText(PREFERRED, { exact: true }).click();
  await expect(show.getByRole('switch', { name: PREFERRED })).toBeChecked();
  await expect.poll(heldKey(page, 'preferred')).toBe(true);
});

test('a long chip list shows six then Show all', async ({ mount, page }) => {
  await mount(<HeldFilterPanel dimensions={DIMENSIONS} initial={INITIAL} resultNoun="items" />);
  const makers = page.getByRole('group', { name: 'Maker' }).getByRole('button');
  /* The first six, and the chosen eighth beyond them. */
  await expect(makers).toHaveCount(7);
  await expect(makers.last()).toHaveAttribute('aria-pressed', 'true');
  const showAll = page.getByRole('button', { name: words.showAll(MAKERS.length, 'makers') });
  await expect(showAll).toBeVisible();
  /* Five kinds is not long: no Show all under them. */
  await expect(
    page.getByRole('button', { name: words.showAll(KINDS.length, 'kinds') }),
  ).toHaveCount(0);

  await showAll.click();
  await expect(makers).toHaveCount(MAKERS.length);
  await expect(showAll).toHaveCount(0);
});

test('an under dimension folds and clears', async ({ mount, page }) => {
  await mount(<HeldFilterPanel dimensions={DIMENSIONS} initial={INITIAL} resultNoun="items" />);
  const kinds = page.getByRole('group', { name: 'Component kind' });
  const fold = page.getByRole('button', { name: PANEL_SPECS.group });
  await expect(fold).toHaveCount(0);

  await kinds.getByRole('button', { name: PANELS }).click();
  await expect(fold).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('tablist', { name: 'Technology' })).toHaveCount(0);

  await fold.click();
  await page
    .getByRole('tablist', { name: 'Technology' })
    .getByRole('tab', { name: 'TOPCon' })
    .click();
  await expect.poll(heldKey(page, 'technology')).toBe('TOPCon');
  await expect(fold).toContainText(words.groupOn(1));

  /* Unchoosing Panels hides the fold and resets what was on inside it. */
  await kinds.getByRole('button', { name: PANELS }).click();
  await expect(fold).toHaveCount(0);
  await expect.poll(heldKey(page, 'technology')).toBe('Any');
});
