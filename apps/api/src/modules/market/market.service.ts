import type { MarketPackRead } from '@heliogrid/contracts';
import {
  type MarketPack,
  marketOfPhone,
  nextEnvelope,
  type PackEnvelope,
  packFromEnvelope,
  tenantReadablePayload,
} from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackAdminRepository } from './market.admin.repository';
import { MarketPackRepository } from './market.repository';

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
    @Inject(MarketPackRepository) private readonly packs: MarketPackRepository,
    @Inject(MarketPackAdminRepository) private readonly publisher: MarketPackAdminRepository,
  ) {}

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
      .map(packFromEnvelope);
  }

  /**
   * The pack a phone belongs to, for a message the platform sends to it — refusing a number no
   * market's allowlist covers (`F1-49`). One answer for the code and the invite, so the two can
   * never disagree about where the rail reaches.
   */
  async deliverablePack(phoneE164: string): Promise<MarketPack> {
    const pack = marketOfPhone(await this.currentPacks(), phoneE164);
    const allowed = pack?.formats.otpDestinationDialCodes.some((code) =>
      phoneE164.startsWith(code),
    );
    if (!pack || !allowed) {
      throw new ContractException(
        'DOMAIN_RULE_VIOLATION',
        'We cannot send messages to that country yet.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return pack;
  }

  /** The tenant-facing read: the envelope and the tenant-readable keys, never the book (`F1-25`). */
  async current(marketCode: string): Promise<MarketPackRead | null> {
    const envelope = await this.packs.currentEnvelope(marketCode);
    if (envelope === null) return null;
    const { version } = packFromEnvelope(envelope);
    return {
      market: envelope.market,
      revision: envelope.revision,
      publishedAt: envelope.publishedAt,
      version,
      ...tenantReadablePayload(envelope.pack),
    };
  }

  /**
   * Publishes a typed literal as its market's next revision (`F1-11`): revision 1 for a market
   * with none, the next number when the payload differs, nothing when it does not.
   */
  async publish(candidate: MarketPack, publishedAt: string): Promise<PublishOutcome> {
    const current = await this.packs.currentEnvelope(candidate.market);
    const written = nextEnvelope(candidate, current, publishedAt);
    if (written !== null) await this.publisher.publish(written);
    return { current, written };
  }
}
