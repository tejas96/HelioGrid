import type { CatalogSource, ComponentKind, PanelTechnology } from './vocabulary';

/**
 * Catalog settings' view-model (`SCR-M01-15`): the orders the list sorts by, what the filter
 * holds, which layer an item reads as and which tier supplied each of its money fields. Both
 * platforms read it, so neither screen holds the rule.
 */

/** The list's orders. `preferred` is the shipped order and the default (`M01-38`). */
export const CATALOG_SORTS = ['preferred', 'name', 'price', 'recent'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

/** Which catalog an item lives in: the platform's, or the tenant's own. */
export type CatalogItemSource = Extract<CatalogSource, 'platform_item' | 'own_item'>;

export interface CatalogFilter {
  readonly source: CatalogItemSource | null;
  readonly kinds: readonly ComponentKind[];
  readonly wattMin: number | null;
  readonly wattMax: number | null;
  readonly technology: PanelTechnology | null;
  readonly schemes: readonly string[];
  readonly preferredOnly: boolean;
  readonly archived: boolean;
}

export const NO_CATALOG_FILTER: CatalogFilter = {
  source: null,
  kinds: [],
  wattMin: null,
  wattMax: null,
  technology: null,
  schemes: [],
  preferredOnly: false,
  archived: false,
};

/**
 * The kinds chosen. Wattage and technology are panel specs: they fold under *Panels* and are
 * cleared when panels are not chosen, so a filter never narrows by a spec nobody can see.
 */
export function withKinds(filter: CatalogFilter, kinds: readonly ComponentKind[]): CatalogFilter {
  if (kinds.includes('panel')) return { ...filter, kinds };
  return { ...filter, kinds, wattMin: null, wattMax: null, technology: null };
}

/** The wattage filter's ends and step, as the boards draw it: the market's panels sit inside it. */
export const PANEL_WATT_RANGE = { min: 0, max: 700, step: 5 } as const;

/** How many filters are on — the count the filter button carries. */
export function catalogFiltersOn(filter: CatalogFilter): number {
  const on = [
    filter.source !== null,
    filter.kinds.length > 0,
    filter.wattMin !== null || filter.wattMax !== null,
    filter.technology !== null,
    filter.schemes.length > 0,
    filter.preferredOnly,
    filter.archived,
  ];
  return on.filter(Boolean).length;
}

/** What an item's resolved money fields say, as the wire hands them (absent: not the reader's to see). */
export interface ResolvedFields {
  readonly source: CatalogItemSource;
  readonly hidden: boolean;
  readonly preferred: boolean;
  readonly rate?: { readonly source: 'override' | 'own_item' } | null;
  readonly tax?: { readonly source: 'override' | 'pack' } | null;
}

/** The layer chip: where an item comes from, and whether the tenant changed it. */
export type CatalogLayer = 'platform' | 'own' | 'overridden';

export function catalogLayerOf(item: ResolvedFields): CatalogLayer {
  if (item.source === 'own_item') return 'own';
  const overridden =
    item.hidden ||
    item.preferred ||
    item.rate?.source === 'override' ||
    item.tax?.source === 'override';
  return overridden ? 'overridden' : 'platform';
}

/** One field of the rates panel: the tier that supplied it, or the tier that would have. */
export interface TierRow {
  readonly field: 'price' | 'tax';
  readonly from: CatalogSource;
  readonly missing: boolean;
}

/**
 * Why each money field shows what it shows (`M01-32`, `M01-37`). A platform item carries no
 * price, so a missing price is named against its own layer; a missing tax is the pack's gap.
 * `null` for a reader the wire hides money from.
 */
export function tierRowsOf(item: ResolvedFields): readonly TierRow[] | null {
  if (item.rate === undefined || item.tax === undefined) return null;
  return [
    item.rate === null
      ? { field: 'price', from: item.source, missing: true }
      : { field: 'price', from: item.rate.source, missing: false },
    item.tax === null
      ? { field: 'tax', from: 'pack', missing: true }
      : { field: 'tax', from: item.tax.source, missing: false },
  ];
}

/**
 * The teaching card shows on a tenant's first day: no release published and nothing changed — no
 * own SKU and no override. The platform slice is always there, so the card sits above a full list,
 * never in place of one.
 */
export function catalogTeaches(facts: {
  readonly releases: number;
  readonly changedItems: number;
}): boolean {
  return facts.releases === 0 && facts.changedItems === 0;
}

/** One side of a release line, as stored on the publish day: the fields a release can move. */
export interface ReleaseSide {
  readonly rate: { readonly amount: string } | null;
  readonly taxPct?: string | null;
  readonly hidden?: boolean;
  readonly preferred: boolean;
  readonly archived?: boolean;
}

/** A field a release moved: its value before (`undefined` for an addition) and after. */
export type ReleaseFieldChange =
  | {
      readonly field: 'price';
      readonly from: string | null | undefined;
      readonly to: string | null;
    }
  | { readonly field: 'tax'; readonly from: string | null | undefined; readonly to: string | null }
  | {
      readonly field: 'hidden' | 'preferred' | 'archived';
      readonly from: boolean | undefined;
      readonly to: boolean;
    };

/**
 * What a release line moved, field by field (`M01-43`, its before-and-after). An addition names
 * only what it set — a first price shows as *New* with no before (brief) — never its defaults.
 */
export function releaseFieldChanges(
  before: ReleaseSide | null,
  after: ReleaseSide,
): readonly ReleaseFieldChange[] {
  return before === null ? additionOf(after) : movesBetween(before, after);
}

function additionOf(after: ReleaseSide): ReleaseFieldChange[] {
  const set: ReleaseFieldChange[] = [];
  const price = after.rate?.amount ?? null;
  const tax = after.taxPct ?? null;
  if (price !== null) set.push({ field: 'price', from: undefined, to: price });
  if (tax !== null) set.push({ field: 'tax', from: undefined, to: tax });
  if (after.hidden === true) set.push({ field: 'hidden', from: undefined, to: true });
  if (after.preferred) set.push({ field: 'preferred', from: undefined, to: true });
  return set;
}

function movesBetween(before: ReleaseSide, after: ReleaseSide): ReleaseFieldChange[] {
  const moved: ReleaseFieldChange[] = [];
  const price = { from: before.rate?.amount ?? null, to: after.rate?.amount ?? null };
  if (price.from !== price.to) moved.push({ field: 'price', ...price });
  const tax = { from: before.taxPct ?? null, to: after.taxPct ?? null };
  if (tax.from !== tax.to) moved.push({ field: 'tax', ...tax });
  for (const field of ['hidden', 'preferred', 'archived'] as const) {
    const flag = { from: before[field] ?? false, to: after[field] ?? false };
    if (flag.from !== flag.to) moved.push({ field, ...flag });
  }
  return moved;
}

/** The acts a row of the list takes in place (`s-error-edit`): each has a pending and a failed line. */
export type CatalogRowAct = 'price' | 'preferred' | 'hidden' | 'archive' | 'restore';

/** A numbered page at 1536 (`page` counted from 0, as `Pagination` counts); a growing list at 375. */
export type CatalogPaging =
  | {
      readonly kind: 'pages';
      readonly page: number;
      readonly pageSize: number;
      readonly rowCount: number;
      readonly onPage: (page: number) => void;
    }
  | {
      readonly kind: 'more';
      readonly hasMore: boolean;
      readonly loadingMore: boolean;
      readonly onMore: () => void;
      readonly rowCount: number;
    };

/**
 * What the Items panel lists, as the screen's hook hands it to the panel's words: the one shape
 * `packages/data` fills and `packages/i18n` reads (`catalogItemsViewOf`). `Item` is the wire's
 * resolved item, which domain does not name.
 */
export interface CatalogItemsListed<Item> {
  readonly items: readonly Item[];
  readonly totalCount: number;
  /** Every item, hidden ones included, whatever the search and filters: the summary's "of N". */
  readonly wholeCount: number;
  readonly preferredFirst: boolean;
  readonly schemes: readonly string[];
  readonly administers: boolean;
  readonly owners: readonly string[];
  readonly release: { readonly label: string; readonly publishedAt: string } | null;
  readonly teaches: boolean;
  readonly archivedCount: number;
  readonly archivedFilter: boolean;
  /** A search or a filter narrows the list. */
  readonly narrowed: boolean;
  /** Each row whose act is out or failed, by item id. */
  readonly acts: Readonly<
    Record<string, { readonly state: 'saving' | 'failed'; readonly act: CatalogRowAct }>
  >;
}
