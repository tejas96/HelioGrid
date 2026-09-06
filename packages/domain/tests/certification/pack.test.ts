import { describe, expect, it } from 'vitest';
import { IN_CERTIFICATION_SCHEMES } from '../../src/certification/pack';
import { badgedSchemes, undeclaredSchemes } from '../../src/certification/schemes';
import { unauthoredKeys } from '../../src/market/launch';
import { IN_PACK } from '../../src/market/pack';
import { requiredSubsidySchemes } from '../../src/subsidy/path';

describe('IN_CERTIFICATION_SCHEMES — the two IN schemes (F1-44)', () => {
  it('declares exactly ALMM and DCR, in that order', () => {
    expect(badgedSchemes(IN_CERTIFICATION_SCHEMES)).toEqual(['ALMM', 'DCR']);
  });

  /** An ALMM entry references the MNRE list; a DCR entry is the flag the subsidy path gates on. */
  it.each([
    ['ALMM', 'list_reference'],
    ['DCR', 'flag'],
  ] as const)('collects %s evidence as a %s', (scheme, evidence) => {
    expect(IN_CERTIFICATION_SCHEMES.schemes.find((s) => s.scheme === scheme)?.evidence).toBe(
      evidence,
    );
  });
});

describe('the IN standards labels (F1-20, F1-45)', () => {
  it('names the IS/IEC family on every electrical document, with CEA where drawings demand it', () => {
    expect(IN_CERTIFICATION_SCHEMES.standards).toEqual({
      family: 'IS/IEC',
      additional: ['CEA'],
    });
  });
});

/**
 * The tie between the two keys. A subsidy rule naming a scheme the market never declared gates
 * on nothing and passes every non-conforming component silently — the one outcome `F1-19`
 * forbids, and the failure mode a rename would produce. No type can hold an open set (`F1-09`),
 * so this test is the mechanism.
 */
describe('every scheme the IN subsidy path requires is a scheme IN declares (F1-19, F1-34)', () => {
  it('leaves no required scheme undeclared', () => {
    expect(
      undeclaredSchemes(IN_PACK.certificationSchemes, requiredSubsidySchemes(IN_PACK.subsidy)),
    ).toEqual([]);
  });
});

describe('the launch gate reads the new key (F1-02, F1-05)', () => {
  it('owes two keys now that certification schemes are authored', () => {
    expect(unauthoredKeys(IN_PACK)).toEqual(['dataRights', 'priceBook']);
  });
});
