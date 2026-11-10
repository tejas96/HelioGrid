import type { SearchQuery, SearchResults } from '@heliogrid/contracts';
import { type SearchQuery as AskedQuery, rankSearchHits, searchQueryOf } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.public';
import type { LeadReader } from '../crm/crm.public';
import { SettingsService } from '../settings/settings.public';
import { noHits, SearchRepository } from './search.repository';

const NOTHING_ASKED: SearchResults = {
  leads: noHits,
  customers: noHits,
  people: noHits,
  catalog: noHits,
};

/**
 * The global search (`F6-20`…`F6-25`, `T-FPLAT-020`): the query read once by domain's
 * `searchQueryOf` in the tenant market's phone format, then each group from its own domain's read —
 * leads, customers and people here, catalog items through the catalog's own list, which every
 * member reads. A read, so no billing state ever stops it (`F6-24`).
 */
@Injectable()
export class SearchService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SearchRepository) private readonly records: SearchRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}

  async search(reader: LeadReader, query: SearchQuery, now: number): Promise<SearchResults> {
    const { formats } = await this.settings.packOf(reader.tenantId);
    const asked = searchQueryOf(formats, query.q);
    // Punctuation alone asks nothing; the catalog's list would read it as no filter at all.
    if (asked.terms.length === 0 && asked.phone === null) return NOTHING_ASKED;
    const [records, catalog] = await Promise.all([
      this.records.records(reader, asked, query.limit),
      this.catalogItems(reader, query, asked, now),
    ]);
    return { ...records, catalog };
  }

  /** The catalog's own list, narrowed by the same text, its first rows ranked as every group's. */
  private async catalogItems(
    reader: LeadReader,
    query: SearchQuery,
    asked: AskedQuery,
    now: number,
  ): Promise<SearchResults['catalog']> {
    const page = await this.catalog.list(
      reader.tenantId,
      [...reader.roles],
      { q: query.q, limit: query.limit, page: 1 },
      now,
    );
    const items = rankSearchHits(page.items, asked, (item) => ({
      phonesE164: [],
      name: `${item.brand} ${item.model}`,
      city: null,
    }));
    return {
      total: page.totalCount,
      items: items.map((item) => ({
        id: item.id,
        source: item.source,
        kind: item.spec.kind,
        brand: item.brand,
        model: item.model,
      })),
    };
  }
}
