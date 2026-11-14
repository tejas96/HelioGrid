import { describe, expect, it } from 'vitest';
import { PROPOSAL_SECTIONS } from '../../src/commerce/proposal-template-defaults';
import {
  isPageOptional,
  PAGES_ALWAYS_PRINTED,
  PROPOSAL_PAGES,
  PROPOSAL_STEPS,
  pagesPrinted,
  presentedSteps,
  STEP_PAGE,
  sectionOfPage,
  stepNumberOf,
} from '../../src/proposals/steps';

describe('the eleven steps (M06-07…M06-17) and Quick mode’s four (M06-18)', () => {
  it('Quick mode presents exactly steps 1, 3, 8 and 10', () => {
    expect(presentedSteps(true).map(stepNumberOf)).toEqual([1, 3, 8, 10]);
  });

  it('the full builder presents all eleven, in order', () => {
    expect(presentedSteps(false)).toEqual(PROPOSAL_STEPS);
    expect(PROPOSAL_STEPS.map(stepNumberOf)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('every step feeds a page the document has', () => {
    for (const step of PROPOSAL_STEPS) expect(PROPOSAL_PAGES).toContain(STEP_PAGE[step]);
  });
});

describe('pagesPrinted — the cover, the price and the terms always print (T-M06-017)', () => {
  it('every section included prints all nine, in order', () => {
    expect(pagesPrinted(PROPOSAL_SECTIONS)).toEqual(PROPOSAL_PAGES);
  });

  it('no section included still prints the three', () => {
    expect(pagesPrinted([])).toEqual(['cover', 'price', 'terms']);
    expect(pagesPrinted([])).toEqual(PAGES_ALWAYS_PRINTED);
  });

  it.each([
    ['achievements', 'about'],
    ['components', 'system'],
    ['performance', 'generation'],
    ['financials', 'savings'],
    ['timeline', 'timeline'],
    ['bank_details', 'bank'],
  ] as const)('leaving %s out leaves the %s page out, and only it', (section, page) => {
    const included = PROPOSAL_SECTIONS.filter((one) => one !== section);
    expect(pagesPrinted(included)).toEqual(PROPOSAL_PAGES.filter((one) => one !== page));
    expect(sectionOfPage(page)).toBe(section);
    expect(isPageOptional(page)).toBe(true);
  });

  it.each(['system', 'payment_terms', 'terms'] as const)(
    'the %s section has no page of its own to switch off',
    (section) => {
      expect(pagesPrinted(PROPOSAL_SECTIONS.filter((one) => one !== section))).toEqual(
        PROPOSAL_PAGES,
      );
    },
  );

  it.each(PAGES_ALWAYS_PRINTED)('the %s page has no switch', (page) => {
    expect(sectionOfPage(page)).toBeNull();
    expect(isPageOptional(page)).toBe(false);
  });
});
