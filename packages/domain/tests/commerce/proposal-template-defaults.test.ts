import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SECTIONS_INCLUDED,
  DEFAULT_TERMS,
  isSectionFloor,
  PROPOSAL_SECTIONS,
  sectionsIncluded,
} from '../../src/commerce/proposal-template-defaults';
import { UI_LANGUAGES } from '../../src/format/languages';

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

describe('the platform terms (M01-28) — a body in every launch language, no number in it', () => {
  it.each(UI_LANGUAGES.map((language) => [language]))('carries %s paragraphs', (language) => {
    const body = DEFAULT_TERMS[language];
    expect(body?.blocks.length).toBeGreaterThan(0);
    for (const block of body?.blocks ?? []) {
      expect(block.type).toBe('p');
      expect(JSON.stringify(block)).not.toMatch(/\d/);
    }
  });
});
