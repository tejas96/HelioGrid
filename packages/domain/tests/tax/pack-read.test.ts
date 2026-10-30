import { describe, expect, it } from 'vitest';
import { IN_TAX } from '../../src/tax/pack';
import { taxPackOf } from '../../src/tax/pack-schema';

describe('taxPackOf — pack.tax as a device reads it off the wire', () => {
  it('India’s tax pack, through JSON and back, reads as itself', () => {
    expect(taxPackOf(JSON.parse(JSON.stringify(IN_TAX)))).toEqual(IN_TAX);
  });

  it('a pack stored before the place rule and the platform registration reads them as absent', () => {
    const { platformRegistration: _, ...older } = IN_TAX;
    const stored = {
      ...older,
      registrationTypes: IN_TAX.registrationTypes.map(({ placeAt: __, ...type }) => type),
    };
    const read = taxPackOf(JSON.parse(JSON.stringify(stored)));
    expect(read?.platformRegistration).toBeNull();
    expect(read?.registrationTypes.map((type) => type.placeAt)).toEqual([null]);
  });

  it.each([
    ['a key that never travelled', undefined],
    ['null', null],
    ['another key’s value', { calendar: 'gregory' }],
    [
      'a pack with a registration type that has no pattern',
      {
        ...IN_TAX,
        registrationTypes: [{ type: 'IN_GST', capturedAt: 'conversion', format: { en: 'x' } }],
      },
    ],
  ])('%s reads as no pack', (_name, value) => {
    expect(taxPackOf(value)).toBeNull();
  });
});
