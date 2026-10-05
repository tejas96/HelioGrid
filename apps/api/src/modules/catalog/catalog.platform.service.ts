import {
  catalogAvailabilitySchema,
  catalogProvenanceSchema,
  marketCodeSchema,
} from '@heliogrid/contracts';
import { catalogSpecSchema, certificationVerdict, type MarketPack } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MarketPackService } from '../market/market.public';
import {
  CatalogAdminRepository,
  type PlatformItemToPublish,
  type PlatformPublishOutcome,
} from './catalog.admin.repository';

/**
 * A platform item as the publish command states it, parsed whole into the repository's own input
 * type, so the two cannot drift: the spec through its kind's gates (`MS4-13`, `MS4-23`) — its
 * `kind` is the item's, spelled once — the label never a tenant's, at least one market, and a
 * claim's reference as text or null; whether it is the evidence the scheme demands is the
 * market's rule, checked below against the pack.
 */
const platformItemSchema: z.ZodType<PlatformItemToPublish, z.ZodTypeDef, unknown> = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  spec: catalogSpecSchema,
  provenance: catalogProvenanceSchema.exclude(['tenant_provided']),
  availability: catalogAvailabilitySchema,
  markets: z.array(marketCodeSchema).min(1),
  certifications: z.array(
    z.object({ scheme: z.string().min(1), reference: z.string().min(1).nullable() }),
  ),
});

/**
 * The platform book's publish (`M01-46`): a typed list, parsed at the door like any input, each
 * claim held to its market's evidence rule (`F1-19`, `F1-44`), then written on the admin path.
 * An authoring error throws before anything is written — a command's input is the operator's to
 * fix, never a row to store half-right.
 */
@Injectable()
export class CatalogPlatformService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogAdminRepository) private readonly book: CatalogAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
  ) {}

  async publish(raw: readonly unknown[], now: number): Promise<PlatformPublishOutcome> {
    const packs = await this.markets.currentPacks();
    const items = raw.map((entry, index) => parsedItem(entry, index, packs));
    return this.book.publishItems(items, now);
  }
}

function parsedItem(
  entry: unknown,
  index: number,
  packs: readonly MarketPack[],
): PlatformItemToPublish {
  const parsed = platformItemSchema.safeParse(entry);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`);
    throw new Error(`platform item ${index}: ${issues.join('; ')}`);
  }
  const item = parsed.data;
  for (const market of item.markets) {
    const pack = packs.find((candidate) => candidate.market === market);
    if (pack === undefined) {
      throw new Error(`platform item ${index}: no pack is published for market ${market}`);
    }
    for (const claim of item.certifications) {
      const verdict = certificationVerdict(pack.certificationSchemes, claim);
      if (verdict !== 'held') {
        throw new Error(
          `platform item ${index} (${item.brand} ${item.model}): ${claim.scheme} is ${verdict} in ${market}`,
        );
      }
    }
  }
  return item;
}
