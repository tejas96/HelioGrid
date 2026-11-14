import { describe, expect, it } from 'vitest';
import {
  COMPONENT_CATEGORIES,
  isCountedCategory,
  isSavedPartKind,
} from '../../src/proposals/component-category';
import { needsBattery, SYSTEM_TYPES } from '../../src/proposals/system-type';

describe('the sections of step 8 (M06-27, M06-28)', () => {
  it('only panels and inverters carry a count', () => {
    expect(COMPONENT_CATEGORIES.filter(isCountedCategory)).toEqual(['panel', 'inverter']);
  });

  it('cable, electrical and structure come from the company’s saved parts', () => {
    expect(COMPONENT_CATEGORIES.filter(isSavedPartKind)).toEqual([
      'cable',
      'electrical',
      'structure',
    ]);
  });
});

describe('needsBattery — a system that cannot work without storage (M06-30)', () => {
  it('on-grid alone works without one', () => {
    expect(SYSTEM_TYPES.filter(needsBattery)).toEqual(['hybrid', 'off_grid']);
  });
});
