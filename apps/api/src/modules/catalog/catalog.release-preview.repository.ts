import type { TenantPool } from '@heliogrid/db';
import { COMPONENT_KINDS, type ReleaseChangeKind } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type NamedItem, namedItems, type ReleaseLine } from './catalog.release-reads.repository';
import {
  type ChangedLine,
  changedLinesOn,
  keyOf,
  type PublishDay,
} from './catalog.releases.repository';
import { lockCatalog } from './catalog.standing.repository';

export interface ReleasePreview {
  readonly counts: Readonly<Record<ReleaseChangeKind, number>>;
  readonly lines: readonly ReleaseLine[];
  readonly totalCount: number;
}

/**
 * What a publish now would carry (`SCR-M01-15` s-publish): the publish's own compare under the
 * catalog lock every write takes — so no write lands between its reads — and nothing written.
 * The changed set is computed whole, as the publish computes it; its counts cover the whole set
 * and a page of its lines is sliced in the detail's order.
 */
@Injectable()
export class CatalogReleasePreviewRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async preview(
    tenantId: string,
    day: PublishDay,
    page: { readonly limit: number; readonly offset: number },
  ): Promise<ReleasePreview> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await lockCatalog(tx, tenantId);
      const changed = await changedLinesOn(tx, tenantId, day);
      const names = await namedItems(tx, tenantId, changed);
      const counts = { added: 0, changed: 0, archived: 0 };
      for (const line of changed) counts[line.changeKind] += 1;
      const lines = changed
        .flatMap((line) => namedLine(line, names))
        .sort(inDetailOrder)
        .slice(page.offset, page.offset + page.limit);
      return { counts, lines, totalCount: changed.length };
    });
  }
}

function namedLine(line: ChangedLine, names: ReadonlyMap<string, NamedItem>): ReleaseLine[] {
  const named = names.get(keyOf(line));
  const id = line.catalogItemId ?? line.tenantCatalogItemId;
  if (named === undefined || id === null) return [];
  return [
    {
      item: { id, source: line.catalogItemId === null ? 'own_item' : 'platform_item', ...named },
      changeKind: line.changeKind,
      before: line.before,
      after: line.after,
    },
  ];
}

/**
 * Kind in its enum's order, then brand and model — the release detail's order, as near as code
 * comes to the database's collation — then the item, where the detail uses the line.
 */
function inDetailOrder(a: ReleaseLine, b: ReleaseLine): number {
  const by = (pick: (line: ReleaseLine) => string) =>
    pick(a) < pick(b) ? -1 : pick(a) > pick(b) ? 1 : 0;
  return (
    COMPONENT_KINDS.indexOf(a.item.kind) - COMPONENT_KINDS.indexOf(b.item.kind) ||
    by((line) => line.item.brand) ||
    by((line) => line.item.model) ||
    by((line) => line.item.id)
  );
}
