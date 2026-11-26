import { describe, expect, it } from 'vitest';
import {
  changedQuestionOpen,
  dataHeightsApply,
  heightDataStale,
  heightFromFloors,
} from '../../src/studio/site-data';

/**
 * What a design keeps of its site's data (`T-M05-002`, part g): when the height data is old enough
 * to ask "Has the building changed?", when an answer stands, and a roof's height from its floors.
 */

describe('the height data’s age and the changed-roof question', () => {
  it.each([
    ['11 months and 30 days: not old', '2025-10-27', '2026-10-26', false],
    ['12 months: old', '2025-10-26', '2026-10-26', true],
    ['a later day of the month counts the month', '2025-10-31', '2026-10-30', false],
    ['no date never asks', null, '2030-01-01', false],
  ])('%s', (_, dataOn, today, stale) => {
    expect(heightDataStale(dataOn, today)).toBe(stale);
  });

  it.each([
    ['old data, no answer: asked', undefined, '2024-03-01', false, true],
    ['new data, no answer: not asked', undefined, '2026-03-01', false, false],
    [
      'new data, a roof with no building under it: asked at once',
      undefined,
      '2026-03-01',
      true,
      true,
    ],
    [
      'answered for this date: never again',
      { changed: { dataOn: '2024-03-01', changed: false } },
      '2024-03-01',
      true,
      false,
    ],
    [
      'answered for an older date: asked for the new one',
      { changed: { dataOn: '2023-01-01', changed: false } },
      '2024-03-01',
      false,
      true,
    ],
  ])('%s', (_, site, dataOn, noBuilding, open) => {
    expect(changedQuestionOpen(site, dataOn, '2026-11-26', noBuilding)).toBe(open);
  });

  it.each([
    ['no answer: the data stands', undefined, true],
    ['"No": the data stands', { changed: { dataOn: '2024-03-01', changed: false } }, true],
    [
      '"Yes" for this data: it is set aside',
      { changed: { dataOn: '2024-03-01', changed: true } },
      false,
    ],
    [
      '"Yes" for older data: newer data stands',
      { changed: { dataOn: '2023-01-01', changed: true } },
      true,
    ],
  ])('%s', (_, site, applies) => {
    expect(dataHeightsApply(site, '2024-03-01')).toBe(applies);
  });

  it.each([
    ['G: the plinth and one storey', 0, 3.45],
    ['G+1', 1, 6.45],
    ['G+3', 3, 12.45],
  ])('%s', (_, floors, height) => {
    expect(heightFromFloors(floors, { plinthHeightM: 0.45, storeyHeightM: 3 })).toBe(height);
  });
});
