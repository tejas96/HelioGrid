import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECTIONS_INCLUDED,
  isSectionFloor,
  PROPOSAL_SECTIONS,
  sectionsIncluded,
} from '../../src/commerce/proposal-template-defaults';

describe('sectionsIncluded — the tenant’s choice made whole (M01-51, SCR-M01-19)', () => {
  it('keeps the terms in when the tenant left them out: whether they print is not a setting', () => {
    expect(sectionsIncluded(['system'])).toEqual(['system', 'terms']);
    expect(isSectionFloor('terms')).toBe(true);
    expect(isSectionFloor('system')).toBe(false);
  });

  it('returns the document’s order whatever order the tenant chose in', () => {
    expect(sectionsIncluded(['bank_details', 'achievements', 'terms'])).toEqual([
      'achievements',
      'terms',
      'bank_details',
    ]);
  });

  it('counts a section named twice once', () => {
    expect(sectionsIncluded(['system', 'system'])).toEqual(['system', 'terms']);
  });

  it('gives the floor alone for an empty choice, and every section by default', () => {
    expect(sectionsIncluded([])).toEqual(['terms']);
    expect(sectionsIncluded(DEFAULT_SECTIONS_INCLUDED)).toEqual([...PROPOSAL_SECTIONS]);
  });
});
