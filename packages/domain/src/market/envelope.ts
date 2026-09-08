import { marketCode } from './code';
import { PACK_KEYS } from './keys';
import type { MarketPack } from './pack';
import { canonicalJson, type PackPayload, payloadOf } from './payload';
import { packVersion, revisionOf } from './version';

/**
 * A pack as a row holds it (`F1-11`): the market, the published ordinal, the instant, and ONE
 * payload. `market` is a plain string here because it is what the row carries; the brand and
 * the version are re-minted through their constructors when the envelope becomes a pack again,
 * which is the only place `as <Brand>` may happen (`CLAUDE.md` §8).
 */
export interface PackEnvelope {
  readonly market: string;
  readonly revision: number;
  /** ISO 8601 instant. Assigned by the publisher; this package holds no clock. */
  readonly publishedAt: string;
  readonly pack: PackPayload;
}

/** A pack as the store would hold it, at the revision the pack itself carries. */
export function envelopeOf(pack: MarketPack, publishedAt: string): PackEnvelope {
  return {
    market: pack.market,
    revision: revisionOf(pack.version),
    publishedAt,
    pack: payloadOf(pack),
  };
}

/**
 * The envelope check, and nothing deeper: every top-level property is a `PACK_KEYS` name, the
 * market is an authored one, the revision mints. A key the payload lacks stays absent, so
 * `unauthoredKeys` reports a stored pack exactly as it reports a literal (`F1-05`).
 */
export function packFromEnvelope(envelope: PackEnvelope): MarketPack {
  const foreign = Object.keys(envelope.pack).filter(
    (key) => !PACK_KEYS.some((name) => name === key),
  );
  if (foreign.length > 0) {
    throw new RangeError(`a stored pack holds only the eight pack keys, not ${foreign.join(', ')}`);
  }
  const market = marketCode(envelope.market);
  const version = packVersion(market, envelope.revision);
  /* Typed code is the only writer, so the interior already has `MarketPack`'s shape. The
     whole is parsed before any writer that is not typed code exists (`T-FCORE-017`). */
  return { market, version, ...envelope.pack } as MarketPack;
}

/**
 * What publishing `candidate` over its market's current envelope writes: revision 1 when the
 * market has none, the next revision when the payload differs, and nothing when it does not
 * (`F1-11`). The revision is assigned here, never read off the literal: a literal's own version
 * says where it was authored, the store says what was published.
 */
export function nextEnvelope(
  candidate: MarketPack,
  current: PackEnvelope | null,
  publishedAt: string,
): PackEnvelope | null {
  if (current !== null && current.market !== candidate.market) {
    throw new RangeError(`${candidate.market} cannot revise the ${current.market} pack`);
  }
  const revision = current === null ? 1 : current.revision + 1;
  const next = envelopeOf(revised(candidate, revision), publishedAt);
  const unchanged = current !== null && canonicalJson(current.pack) === canonicalJson(next.pack);
  return unchanged ? null : next;
}

function revised(pack: MarketPack, revision: number): MarketPack {
  return { ...pack, version: packVersion(pack.market, revision) };
}
