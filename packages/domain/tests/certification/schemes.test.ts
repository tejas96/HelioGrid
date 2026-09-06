import { describe, expect, it } from 'vitest';
import type { Certification, CertificationSchemesPack } from '../../src/certification/pack';
import { IN_CERTIFICATION_SCHEMES } from '../../src/certification/pack';
import {
  badgedSchemes,
  certificationScheme,
  holdsScheme,
  undeclaredSchemes,
} from '../../src/certification/schemes';

/** A market that requires no scheme — permitted content, never a missing key (`F1-19`). */
const NO_SCHEMES: CertificationSchemesPack = {
  schemes: [],
  standards: { family: 'EN', additional: [] },
};

const ALMM_LISTED: Certification = { scheme: 'ALMM', reference: 'MNRE/ALMM/I/2026/0412' };
const DCR_COMPLIANT: Certification = { scheme: 'DCR', reference: null };

describe('certificationScheme — the open-set validation (F1-09, F1-19)', () => {
  it('reads back a scheme the market declares', () => {
    expect(certificationScheme(IN_CERTIFICATION_SCHEMES, 'ALMM')?.scheme).toBe('ALMM');
  });

  it('refuses a scheme the market does not declare', () => {
    expect(certificationScheme(IN_CERTIFICATION_SCHEMES, 'MCS')).toBeNull();
    expect(certificationScheme(NO_SCHEMES, 'DCR')).toBeNull();
  });
});

describe('badgedSchemes — what a picker badges (F1-19, M01-34)', () => {
  it('badges both IN schemes', () => {
    expect(badgedSchemes(IN_CERTIFICATION_SCHEMES)).toEqual(['ALMM', 'DCR']);
  });

  it('badges nothing where the market declares no scheme — no chrome, never an error', () => {
    expect(badgedSchemes(NO_SCHEMES)).toEqual([]);
  });
});

describe('holdsScheme — presence is the claim, absence fails closed (F1-19)', () => {
  it('reads an item certified under the scheme', () => {
    expect(holdsScheme([ALMM_LISTED, DCR_COMPLIANT], 'DCR')).toBe(true);
  });

  it('fails an item whose evidence nobody recorded, rather than passing it', () => {
    expect(holdsScheme([ALMM_LISTED], 'DCR')).toBe(false);
    expect(holdsScheme([], 'DCR')).toBe(false);
  });
});

describe('undeclaredSchemes — the guard against a rule that gates on nothing (F1-19)', () => {
  it('passes a rule naming only declared schemes', () => {
    expect(undeclaredSchemes(IN_CERTIFICATION_SCHEMES, ['DCR', 'ALMM'])).toEqual([]);
  });

  it('names every required scheme the market never declared', () => {
    expect(undeclaredSchemes(IN_CERTIFICATION_SCHEMES, ['DCR', 'dcr', 'MCS'])).toEqual([
      'dcr',
      'MCS',
    ]);
  });

  it('names them all where the market declares no scheme at all', () => {
    expect(undeclaredSchemes(NO_SCHEMES, ['DCR'])).toEqual(['DCR']);
  });

  it('requires nothing of a rule that requires nothing', () => {
    expect(undeclaredSchemes(NO_SCHEMES, [])).toEqual([]);
  });
});
