/**
 * The filter body's own words (`FilterPanel`, design-system change 8), against the real catalogs.
 * The choice under test: a noun given or not, and one result or many.
 */
import { describe, expect, it } from 'vitest';
import { filterPanelWords } from '../src/copy/filter-panel';
import { createTranslator } from '../src/runtime';

const english = async () => filterPanelWords((await createTranslator('en')).t);

describe('filterPanelWords — Show all under a capped chip list', () => {
  it.each([
    [9, 'kinds', 'Show all 9 kinds'],
    [9, undefined, 'Show all 9'],
  ])('%i with noun %s → %s', async (count, noun, line) => {
    expect((await english()).showAll(count, noun)).toBe(line);
  });
});

describe('filterPanelWords — the footer dismiss', () => {
  it.each([
    [0, undefined, 'Show 0 results'],
    [1, undefined, 'Show 1 result'],
    [2, undefined, 'Show 2 results'],
    [24, 'items', 'Show 24 items'],
  ])('%i with noun %s → %s', async (count, noun, line) => {
    expect((await english()).showResults(count, noun)).toBe(line);
  });
});

describe('filterPanelWords — what is on', () => {
  it.each([
    [2, '2 selected', '2 on'],
    [1, '1 selected', '1 on'],
  ])('%i → %s · %s', async (count, selected, on) => {
    const en = await english();
    expect(en.selected(count)).toBe(selected);
    expect(en.groupOn(count)).toBe(on);
  });
});
