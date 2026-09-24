import { describe, expect, it } from 'vitest';
import { envelopeOf, type PackEnvelope } from '../../src/market/envelope';
import { PACK_KEYS } from '../../src/market/keys';
import { unauthoredKeys } from '../../src/market/launch';
import { IN_PACK } from '../../src/market/pack';
import { PACK_SCHEMAS, parseStoredPack, readStoredPack } from '../../src/market/parser';
import { packVersion } from '../../src/market/version';

/**
 * `F1-01`, `F1-02` — a stored pack is validated WHOLE before anything reads it: every key's
 * interior, every brand re-minted by its owner's constructor, and a malformed key named exactly —
 * which key, which path inside it, what was found — with no partial pack returned.
 */
const PUBLISHED_AT = '2026-09-25T00:00:00.000Z';
/** What the store gives back: the row after a JSON round trip, which is how jsonb returns it. */
const stored = (envelope: PackEnvelope): PackEnvelope => JSON.parse(JSON.stringify(envelope));
const envelope = stored(envelopeOf(IN_PACK, PUBLISHED_AT));

/** The India payload with one change applied inside one key. */
function withPayload(change: (pack: Record<string, unknown>) => void): PackEnvelope {
  const copy = stored(envelope);
  change(copy.pack as Record<string, unknown>);
  return copy;
}
const inside = (pack: Record<string, unknown>, key: string) => pack[key] as Record<string, never>;

/** The message a constructor throws for a value, so a test compares with the owner's own words. */
function thrownBy(construct: () => unknown): string {
  try {
    construct();
  } catch (error) {
    return String(error);
  }
  throw new Error('the constructor accepted the value');
}

describe('parseStoredPack — a stored pack read whole (F1-01, F1-02)', () => {
  it('gives the India pack back whole, every brand re-minted', () => {
    expect(parseStoredPack(envelope)).toEqual({ ok: true, pack: IN_PACK, dropped: [] });
  });

  it('reports the same unauthored keys for a stored pack as for the literal', () => {
    const parsed = parseStoredPack(envelope);
    expect(parsed.ok && unauthoredKeys(parsed.pack)).toEqual(unauthoredKeys(IN_PACK));
  });

  it('mints the version from the row, so revision 3 reads IN.3 whatever the literal said', () => {
    const parsed = parseStoredPack({ ...envelope, revision: 3 });
    expect(parsed.ok && parsed.pack.version).toBe('IN.3');
  });

  it("refuses revision 0 with the version constructor's own words", () => {
    expect(parseStoredPack({ ...envelope, revision: 0 })).toEqual({
      ok: false,
      issues: [{ key: 'version', path: '', found: thrownBy(() => packVersion(IN_PACK.market, 0)) }],
    });
  });

  it('refuses a market nobody authored, naming the market', () => {
    const parsed = parseStoredPack({ ...envelope, market: 'XX' });
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.issues.map((issue) => issue.key)).toEqual(['market']);
  });

  it.each([
    [
      'a tax rate stored as text',
      (pack: Record<string, unknown>) => {
        inside(pack, 'tax').platformSale = {
          serviceCode: '998434',
          rateBasisPoints: '1800',
        } as never;
      },
      'tax',
      'platformSale.rateBasisPoints',
    ],
    [
      'a tax rate above the whole amount',
      (pack: Record<string, unknown>) => {
        inside(pack, 'tax').platformSale = {
          serviceCode: '998434',
          rateBasisPoints: 20_000,
        } as never;
      },
      'tax',
      'platformSale.rateBasisPoints',
    ],
    [
      'a negative subsidy ceiling',
      (pack: Record<string, unknown>) => {
        inside(pack, 'subsidy').slabs = [{ kw: 2, perKw: -3_000_000 }] as never;
      },
      'subsidy',
      'slabs.0.perKw',
    ],
    [
      'an amount that is not whole minor units',
      (pack: Record<string, unknown>) => {
        inside(pack, 'subsidy').slabs = [{ kw: 2, perKw: 30.5 }] as never;
      },
      'subsidy',
      'slabs.0.perKw',
    ],
    [
      'a send hour past midnight',
      (pack: Record<string, unknown>) => {
        inside(inside(pack, 'callingRules'), 'messaging').scheduledSendHour = {
          enforcement: 'default',
          value: 1_500,
        } as never;
      },
      'callingRules',
      'messaging.scheduledSendHour.value',
    ],
    [
      'a key missing from the row',
      (pack: Record<string, unknown>) => {
        delete pack.tax;
      },
      'tax',
      '',
    ],
    [
      'a market code no market authored, inside the formats',
      (pack: Record<string, unknown>) => {
        inside(pack, 'formats').id = 'XX' as never;
      },
      'formats',
      'id',
    ],
    [
      'a calling window that closes before it opens',
      (pack: Record<string, unknown>) => {
        inside(inside(pack, 'callingRules'), 'messaging').statutoryWindow = {
          enforcement: 'floor',
          value: { opens: 1_260, closes: 540 },
        } as never;
      },
      'callingRules',
      'messaging.statutoryWindow.value',
    ],
    [
      'a whole-number length stored as a fraction',
      (pack: Record<string, unknown>) => {
        inside(inside(pack, 'formats'), 'phone').nsnLength = 9.5 as never;
      },
      'formats',
      'phone.nsnLength',
    ],
  ])('refuses %s, naming the key and the path, and returns no pack', (_, change, key, path) => {
    const parsed = parseStoredPack(withPayload(change));
    expect(parsed.ok).toBe(false);
    expect(parsed).not.toHaveProperty('pack');
    expect(!parsed.ok && parsed.issues.map((issue) => [issue.key, issue.path])).toContainEqual([
      key,
      path,
    ]);
  });

  it.each([
    [
      'a property the code does not declare',
      (pack: Record<string, unknown>) => {
        inside(pack, 'tax').platformSale = {
          serviceCode: '998434',
          rateBasisPoints: 1800,
          surcharge: 1,
        } as never;
      },
      'tax',
      'platformSale.surcharge',
    ],
    [
      'a property inside a label',
      (pack: Record<string, unknown>) => {
        const [registration] = inside(pack, 'tax').registrationTypes as unknown as [
          { format: Record<string, string> },
        ];
        registration.format.xx = 'y';
      },
      'tax',
      'registrationTypes.0.format.xx',
    ],
    [
      'a property at the top of a key',
      (pack: Record<string, unknown>) => {
        inside(pack, 'priceBook').legacyTiers = [] as never;
      },
      'priceBook',
      'legacyTiers',
    ],
    [
      'a top-level property that is not a pack key',
      (pack: Record<string, unknown>) => {
        pack.demoProject = {};
      },
      'demoProject',
      '',
    ],
    [
      'a key with no schema yet',
      (pack: Record<string, unknown>) => {
        pack.dataRights = {};
      },
      'dataRights',
      '',
    ],
  ])(
    'drops %s, names it, and never serves it — a rolling release reads a newer row',
    (_, change, key, path) => {
      const parsed = parseStoredPack(withPayload(change));
      expect(parsed.ok && parsed.pack).toEqual(IN_PACK);
      expect(parsed.ok && parsed.dropped.map((issue) => [issue.key, issue.path])).toEqual([
        [key, path],
      ]);
    },
  );

  it('keys its schemas by the stored keys, in the pack order', () => {
    expect(Object.keys(PACK_SCHEMAS)).toEqual(PACK_KEYS.filter((key) => key !== 'dataRights'));
  });
});

describe('readStoredPack — a server read, which throws rather than serves (T-FCORE-017)', () => {
  it('returns the pack for a well-formed row', () => {
    expect(readStoredPack(envelope)).toEqual({ pack: IN_PACK, dropped: [] });
  });

  it('throws for a malformed row, naming every key and path', () => {
    const malformed = withPayload((pack) => {
      inside(pack, 'subsidy').slabs = [{ kw: 2, perKw: -1 }] as never;
      delete pack.tax;
    });
    expect(() => readStoredPack(malformed)).toThrow(/subsidy\.slabs\.0\.perKw: /);
    expect(() => readStoredPack(malformed)).toThrow(/tax: /);
  });
});
