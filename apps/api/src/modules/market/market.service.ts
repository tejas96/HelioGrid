import type { MarketPackRead } from '@heliogrid/contracts';
import {
  type MarketPack,
  nextEnvelope,
  type PackEnvelope,
  payloadOf,
  phoneReach,
  readStoredPack,
  tenantReadablePayload,
} from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackAdminRepository } from './market.admin.repository';
import { MarketPackReferenceRepository } from './market.reference.repository';

/** What one publish did: the envelope it found, and the one it wrote — or null when nothing changed. */
export interface PublishOutcome {
  readonly current: PackEnvelope | null;
  readonly written: PackEnvelope | null;
}

/**
 * The pack's two paths. Every decision is domain's — which keys a tenant may read, whether a
 * literal is a new revision — and this only orders the reads and the one write around them.
 */
@Injectable()
export class MarketPackService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(MarketPackReferenceRepository) private readonly packs: MarketPackReferenceRepository,
    @Inject(MarketPackAdminRepository) private readonly publisher: MarketPackAdminRepository,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MarketPackService.name);
  }

  /**
   * Every authored market's current pack, whole, for the server's own use — the market a phone
   * resolves to, the currency a signup assigns, the template a code message uses. Never served
   * to a tenant as is: the book rides inside.
   */
  async currentPacks(): Promise<MarketPack[]> {
    const codes = await this.packs.marketCodes();
    const envelopes = await Promise.all(codes.map((code) => this.packs.currentEnvelope(code)));
    return envelopes
      .filter((envelope): envelope is PackEnvelope => envelope !== null)
      .map((envelope) => this.stored(envelope));
  }

  /**
   * The pack a phone belongs to, for a message the platform sends to it — refusing a number no
   * market's allowlist covers, and one whose national part is not the length that market fixes
   * (`F1-49`, `phoneReach`). One answer for the code and the invite, so the two can never
   * disagree about where the rail reaches, and a number no rail reaches never becomes an account.
   */
  async deliverablePack(phoneE164: string): Promise<MarketPack> {
    const reach = phoneReach(await this.currentPacks(), phoneE164);
    if (reach.kind === 'reachable') return reach.pack;
    throw new ContractException(
      'DOMAIN_RULE_VIOLATION',
      reach.kind === 'wrong-length'
        ? `That is ${reach.typed} digits. A mobile number in this market has ${reach.needed}.`
        : 'We cannot send messages to that country yet.',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  /** The tenant-facing read: the envelope and the tenant-readable keys, never the book (`F1-25`). */
  async current(marketCode: string): Promise<MarketPackRead | null> {
    const envelope = await this.packs.currentEnvelope(marketCode);
    if (envelope === null) return null;
    const pack = this.stored(envelope);
    return {
      market: envelope.market,
      revision: envelope.revision,
      publishedAt: envelope.publishedAt,
      version: pack.version,
      // The PARSED pack's keys, never the raw row's: what a tenant reads is what was validated.
      ...tenantReadablePayload(payloadOf(pack)),
    };
  }

  /**
   * The stored row, parsed whole (`T-FCORE-017`). A malformed row throws, so the request answers
   * `INTERNAL`; a property this code does not declare is dropped, never served, and logged, so a
   * row newer than the code during a rolling release reads — and says what it skipped.
   */
  private stored(envelope: PackEnvelope): MarketPack {
    const { pack, dropped } = readStoredPack(envelope);
    if (dropped.length > 0) {
      this.logger.warn(
        { market: envelope.market, revision: envelope.revision, dropped },
        'the stored pack carries properties this code does not declare',
      );
    }
    return pack;
  }

  /**
   * Publishes a typed literal as its market's next revision (`F1-11`): revision 1 for a market
   * with none, the next number when the payload differs, nothing when it does not.
   */
  /**
   * The decision is domain's `nextEnvelope`; the ordering is the repository's, which holds the
   * read and the write under one per-market lock. Reading here and writing there would leave two
   * publishers computing the same revision — the race this shape exists to close.
   */
  async publish(candidate: MarketPack, publishedAt: string): Promise<PublishOutcome> {
    return this.publisher.publishNext(candidate.market, (current) =>
      nextEnvelope(candidate, current, publishedAt),
    );
  }
}
