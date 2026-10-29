import { IN_FORMATS } from '@heliogrid/domain';
import {
  createTranslator,
  filterBarWords,
  NOTIFICATION_CENTRE,
  SEARCH_FIELD,
  SHELL,
  TYPE_GROUP_NAME,
  teamListWords,
} from '@heliogrid/i18n';
import { FacetChips, FilterChips, SearchField } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { settledBox } from '../support/layout';
import { resolvedColour } from '../support/token';
import { expectTouchFloor } from '../support/touch-target';
import { FilterSquareStory, FocusHandlesStory } from './SearchField.story';

/**
 * The open page's list head (the design system's `SearchField` and `FilterChips`): the grey search
 * pill 50 tall with a white clear button, the 50×50 near-black filter square beside it, and the
 * kind chips 44 tall, the chosen one near-black.
 */
const en = await createTranslator('en');
const search = en.t(SHELL.search);
const filters = en.t(NOTIFICATION_CENTRE.filterBar);
const clear = en.t(SEARCH_FIELD.clear);
const bar = filterBarWords(en.t);
const sales = en.t(TYPE_GROUP_NAME.sales);
const delivery = en.t(TYPE_GROUP_NAME.delivery);

test.use({ viewport: { width: 375, height: 300 } });

test('the expressive pill is 50 tall at --r-pill on --fill, its clear button white', async ({
  mount,
  page,
}) => {
  const field = await mount(
    <SearchField
      ariaLabel={search}
      placeholder={search}
      value="Kulkarni"
      onClear={() => {}}
      clearLabel={clear}
    />,
  );
  const box = await settledBox(field);
  expect(box?.height).toBe(50);
  await expect(field).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  expect(
    Number.parseFloat(await field.evaluate((node) => getComputedStyle(node).borderTopLeftRadius)),
  ).toBeGreaterThanOrEqual(25);
  await expect(field.locator('.hg-search-field-clear-pill')).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--surface'),
  );
});

test('with a value, only the field’s own clear button shows — never the browser’s search cancel too', async ({
  mount,
}) => {
  const field = await mount(
    <SearchField
      ariaLabel={search}
      placeholder={search}
      value="Kulkarni"
      onClear={() => {}}
      clearLabel={clear}
    />,
  );
  // Chrome reports no computed style for the cancel button, so the rule that hides it is read.
  const hidesBrowserCancel = await field.evaluate(() =>
    [...document.styleSheets].some((sheet) =>
      [...sheet.cssRules].some(
        (rule) =>
          rule instanceof CSSStyleRule &&
          rule.selectorText.includes('.hg-search-field-input::-webkit-search-cancel-button') &&
          rule.style.appearance === 'none',
      ),
    ),
  );
  expect(hidesBrowserCancel).toBe(true);
  await expect(field.getByRole('button')).toHaveCount(1);
});

test('with onFilterClick the 50 square rides beside the pill, near-black, named with its count', async ({
  mount,
  page,
}) => {
  const row = await mount(<FilterSquareStory label={search} count={3} />);
  const square = row.getByRole('button', { name: bar.filtersActive(3) });
  const box = await settledBox(square);
  expect(box?.width).toBe(50);
  expect(box?.height).toBe(50);
  await expect(square).toHaveCSS(
    'background-color',
    await resolvedColour(page, '--action-primary'),
  );
  const pill = await settledBox(row.locator('.hg-search-field'));
  expect((pill?.x ?? 0) + (pill?.width ?? 0)).toBeLessThan(box?.x ?? 0);
});

test('a kind chip is 44 tall; the chosen one is near-black with inverse words and its count', async ({
  mount,
  page,
}) => {
  const chips = await mount(
    <FilterChips
      label={filters}
      options={[
        { value: 'sales', label: sales },
        { value: 'delivery', label: delivery },
      ]}
      value="sales"
      counts={{ sales: 4, delivery: 2 }}
    />,
  );
  const chosen = chips.getByRole('tab', { name: `${sales} 4` });
  await expect(chosen).toHaveAttribute('aria-selected', 'true');
  const pill = chosen.locator('.hg-filter-pill');
  expect((await settledBox(pill))?.height).toBe(44);
  await expect(pill).toHaveCSS('background-color', await resolvedColour(page, '--action-primary'));
  const rest = chips.getByRole('tab', { name: `${delivery} 2` }).locator('.hg-filter-pill');
  await expect(rest).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
  await expectTouchFloor(await chips.getByRole('tab').all());
});

test('the functional box keeps the 44 floor, as the shell header draws it', async ({ mount }) => {
  const field = await mount(
    <SearchField density="functional" ariaLabel={search} placeholder={search} />,
  );
  expect((await settledBox(field))?.height).toBe(44);
});

test('a kind chip draws its 18 glyph before the label, in the chip’s ink', async ({
  mount,
  page,
}) => {
  const chips = await mount(
    <FilterChips
      label={filters}
      options={[
        {
          value: 'sales',
          label: sales,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
            </svg>
          ),
        },
      ]}
      value="sales"
    />,
  );
  const glyph = chips.locator('.hg-filter-pill svg').first();
  const box = await settledBox(glyph);
  expect(box?.width).toBe(18);
  const pill = await settledBox(chips.locator('.hg-filter-pill'));
  expect((box?.x ?? 0) - (pill?.x ?? 0)).toBeLessThan((pill?.width ?? 0) / 2);
  await expect(glyph).toHaveCSS('color', await resolvedColour(page, '--text-inverse'));
});

test('a chosen facet is near-black with its tick; the others stay on the control fill', async ({
  mount,
  page,
}) => {
  const facets = await mount(
    <FacetChips
      label={filters}
      options={[
        { value: 'sales', label: sales },
        { value: 'delivery', label: delivery },
      ]}
      values={['sales']}
      selectedLabel={bar.selected}
    />,
  );
  const chosen = facets.getByRole('button', { name: sales });
  await expect(chosen).toHaveAttribute('aria-pressed', 'true');
  const pill = chosen.locator('.hg-filter-pill');
  await expect(pill).toHaveCSS('background-color', await resolvedColour(page, '--action-primary'));
  await expect(pill.locator('svg')).toHaveCount(1);
  const rest = facets.getByRole('button', { name: delivery }).locator('.hg-filter-pill');
  await expect(rest).toHaveCSS('background-color', await resolvedColour(page, '--fill'));
});

test('the search field and the chosen chip each take focus through their handle (D286)', async ({
  mount,
  page,
}) => {
  const words = teamListWords(en.t, {
    pack: IN_FORMATS,
    language: 'en',
    now: 0,
    company: '',
    query: '',
    status: 'all',
  });
  await mount(
    <FocusHandlesStory
      find={words.find}
      status={words.statusFilter}
      options={words.statusOptions}
      toSearch={words.clearSearch}
      toChip={words.showAll}
    />,
  );

  await page.getByRole('button', { name: words.clearSearch }).click();
  await expect(page.getByRole('searchbox', { name: words.find })).toBeFocused();
  await page.getByRole('button', { name: words.showAll }).click();
  await expect(page.getByRole('tab', { name: words.statusOptions[0]?.label })).toBeFocused();
});
