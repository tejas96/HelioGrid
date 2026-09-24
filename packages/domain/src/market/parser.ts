import { z } from 'zod';
import { CALLING_RULES_PACK_SCHEMA } from '../calling/pack-schema';
import { CERTIFICATION_SCHEMES_PACK_SCHEMA } from '../certification/pack-schema';
import { FORMAT_PACK_SCHEMA } from '../format/pack-schema';
import { PRICE_BOOK_PACK_SCHEMA } from '../pricing/pack-schema';
import { PAYMENT_RAILS_PACK_SCHEMA } from '../rails/pack-schema';
import { SUBSIDY_PACK_SCHEMA } from '../subsidy/pack-schema';
import { TAX_PACK_SCHEMA } from '../tax/pack-schema';
import { marketCode } from './code';
import type { PackEnvelope } from './envelope';
import type { MarketPack } from './pack';
import { packVersion } from './version';

/** The keys a row stores today: `MarketPack`'s own, in `PACK_KEYS` order (`dataRights` waits). */
export type StoredPackKey = Exclude<keyof MarketPack, 'market' | 'version'>;

/**
 * One schema per stored key, each typed to its key's own type — a key added to `MarketPack`
 * fails to compile here until its schema exists, and a schema whose output drifts from the key's
 * type fails the same way (`F1-02`). Key order is `PACK_KEYS`'s.
 */
export const PACK_SCHEMAS: {
  readonly [K in StoredPackKey]: z.ZodType<MarketPack[K], z.ZodTypeDef, unknown>;
} = {
  tax: TAX_PACK_SCHEMA,
  subsidy: SUBSIDY_PACK_SCHEMA,
  callingRules: CALLING_RULES_PACK_SCHEMA,
  paymentRails: PAYMENT_RAILS_PACK_SCHEMA,
  certificationSchemes: CERTIFICATION_SCHEMES_PACK_SCHEMA,
  formats: FORMAT_PACK_SCHEMA,
  priceBook: PRICE_BOOK_PACK_SCHEMA,
};

/** One thing wrong with a stored pack: which key, where inside it, and what was found there. */
export interface PackIssue {
  readonly key: string;
  /** Dotted path inside the key — `platformSale.rateBasisPoints`; empty for the key itself. */
  readonly path: string;
  readonly found: string;
}

export type StoredPackRead =
  | { readonly ok: true; readonly pack: MarketPack; readonly dropped: readonly PackIssue[] }
  | { readonly ok: false; readonly issues: readonly PackIssue[] };

/** The seven keys as one object: a missing key is zod's to name; a stranger is dropped (`droppedKeys`). */
const PAYLOAD_SCHEMA = z.object(PACK_SCHEMAS);

/**
 * A stored pack, validated WHOLE before anything reads it (`F1-01`, `F1-02`): the envelope's
 * market and revision through their constructors, then every key's interior through its schema,
 * every brand re-minted by its owner. The row is untrusted however it was written — a hand, a
 * file, or code older than the code reading it — so nothing partial is ever returned.
 */
export function parseStoredPack(envelope: PackEnvelope): StoredPackRead {
  const issues: PackIssue[] = [];
  const market = minted('market', () => marketCode(envelope.market), issues);
  const version =
    market === undefined
      ? undefined
      : minted('version', () => packVersion(market, envelope.revision), issues);
  const payload = PAYLOAD_SCHEMA.safeParse(envelope.pack);
  if (!payload.success) issues.push(...payload.error.issues.flatMap(issuesOf));
  if (!payload.success || market === undefined || version === undefined) {
    return { ok: false, issues };
  }
  return {
    ok: true,
    pack: { market, version, ...payload.data },
    dropped: droppedKeys(envelope.pack, payload.data, []),
  };
}

/**
 * The stored pack, or a throw naming every key and path — for a server read, where a malformed row
 * is a platform fault: the request answers `INTERNAL` and the log carries this message, and no
 * quote is ever priced from a figure the parser refused.
 */
export function readStoredPack(envelope: PackEnvelope): {
  readonly pack: MarketPack;
  readonly dropped: readonly PackIssue[];
} {
  const read = parseStoredPack(envelope);
  if (read.ok) return { pack: read.pack, dropped: read.dropped };
  const named = read.issues.map(
    (issue) => `${issue.key}${issue.path === '' ? '' : `.${issue.path}`}: ${issue.found}`,
  );
  throw new RangeError(
    `the stored ${envelope.market} pack, revision ${envelope.revision}, is malformed — ${named.join('; ')}`,
  );
}

function minted<T>(key: string, construct: () => T, issues: PackIssue[]): T | undefined {
  try {
    return construct();
  } catch (error) {
    issues.push({ key, path: '', found: String(error) });
    return undefined;
  }
}

/** A zod issue as the pack names it: the first path step is the key, the rest is inside it. */
function issuesOf(issue: z.ZodIssue): PackIssue[] {
  const [key, ...inside] = issue.path;
  return [{ key: String(key), path: inside.join('.'), found: issue.message }];
}

/**
 * Every property the row holds that the code does not declare, named and never served. A release
 * rolls machine by machine, so old code reads a row newer code published: a field it does not know
 * is dropped rather than refused, and a field it NEEDS that the row lacks is still a failure
 * (expand, then contract — `docs/engineering/09-observability-and-ops.md`).
 */
function droppedKeys(stored: unknown, kept: unknown, path: readonly string[]): PackIssue[] {
  if (Array.isArray(stored) && Array.isArray(kept)) {
    return stored.flatMap((item, index) =>
      droppedKeys(item, kept[index], [...path, String(index)]),
    );
  }
  if (!isRecord(stored) || !isRecord(kept)) return [];
  return Object.entries(stored).flatMap(([name, value]) =>
    Object.hasOwn(kept, name)
      ? droppedKeys(value, kept[name], [...path, name])
      : [issueAt([...path, name], 'not declared by this code — dropped')],
  );
}

function issueAt(path: readonly string[], found: string): PackIssue {
  const [key = '', ...inside] = path;
  return { key, path: inside.join('.'), found };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
