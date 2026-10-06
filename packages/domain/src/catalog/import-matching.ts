import type { CatalogImportAttentionReason, CatalogImportConflictAnswer } from './import';
import {
  type ImportCurrency,
  isBlank,
  readComponentKind,
  readImportPrice,
  readImportSpec,
  readSpecValue,
  specValueAt,
} from './import-cells';
import type { CatalogImportField } from './import-columns';
import { type CatalogSpec, SPEC_FIELDS } from './specs';
import { COMPONENT_KINDS } from './vocabulary';

/**
 * The matching pass (`M01-41`, §M01.4 edge cases): each row of a mapped sheet against the tenant's
 * market slice and its own SKUs. Brand and model are compared exactly as written, outer spaces
 * aside — never case-folded, never translated (`F3-08`). A match yields a price and NEVER a spec:
 * a spec that disagrees is a question for the person, and no answer edits a platform item.
 * It reads a price out of a file and judges it against the currency's minor unit, so it is on
 * `./server` (`F4-04`).
 */

/** One row as the preview holds it: its mapped cells and what the person has answered on it. */
export interface CatalogImportRowInput {
  readonly cells: Readonly<Partial<Record<CatalogImportField, string>>>;
  readonly leftOut: boolean;
  readonly answer: CatalogImportConflictAnswer | null;
}

/** An item a row may match: a platform item in the market slice, or one of the tenant's SKUs. */
export interface ImportCatalogEntry {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
}

export interface ImportCatalog {
  readonly platformItems: readonly ImportCatalogEntry[];
  readonly ownItems: readonly ImportCatalogEntry[];
  readonly currency: ImportCurrency;
}

/** A reason, and the spec fields it is about when it is about any. */
export interface ImportAttention {
  readonly reason: CatalogImportAttentionReason;
  readonly fields: readonly string[];
}

export type CatalogImportRowMatch =
  | { readonly outcome: 'price_override'; readonly platformItemId: string; readonly rate: string }
  | { readonly outcome: 'own_item_price'; readonly ownItemId: string; readonly rate: string }
  | {
      readonly outcome: 'new_item';
      readonly brand: string;
      readonly model: string;
      readonly spec: CatalogSpec;
      readonly rate: string;
    }
  | { readonly outcome: 'needs_attention'; readonly attention: readonly ImportAttention[] }
  | { readonly outcome: 'left_out' };

type Target =
  | { readonly on: 'platform'; readonly entry: ImportCatalogEntry }
  | { readonly on: 'own'; readonly entry: ImportCatalogEntry };

const identityOf = (brand: string, model: string) => `${brand.trim()}\u0000${model.trim()}`;

function byIdentity(entries: readonly ImportCatalogEntry[]): Map<string, ImportCatalogEntry[]> {
  const index = new Map<string, ImportCatalogEntry[]>();
  for (const entry of entries) {
    const key = identityOf(entry.brand, entry.model);
    index.set(key, [...(index.get(key) ?? []), entry]);
  }
  return index;
}

/** The spec fields whose cells say something other than the matched item's spec. */
function conflictingFields(row: CatalogImportRowInput, spec: CatalogSpec): string[] {
  const kindCell = row.cells.kind;
  const kindDiffers =
    !isBlank(kindCell) && readComponentKind(kindCell, COMPONENT_KINDS) !== spec.kind;
  const fields = SPEC_FIELDS[spec.kind].filter((field) => {
    const cell = row.cells[field.path as CatalogImportField];
    return !isBlank(cell) && readSpecValue(field, cell) !== specValueAt(spec, field.path);
  });
  return [...(kindDiffers ? ['kind'] : []), ...fields.map((field) => field.path)];
}

type NewItemSpec =
  | { readonly ok: true; readonly spec: CatalogSpec }
  | { readonly ok: false; readonly attention: readonly ImportAttention[] };

/** The spec a row that matched nothing brings with it: its kind's whole envelope, gated. */
function newItemSpec(row: CatalogImportRowInput): NewItemSpec {
  const kind = readComponentKind(row.cells.kind, COMPONENT_KINDS);
  if (kind === null) return { ok: false, attention: [{ reason: 'kind_missing', fields: [] }] };
  const read = readImportSpec(kind, row.cells);
  if (read.ok) return read;
  const attention: ImportAttention[] = [];
  if (read.missing.length > 0) attention.push({ reason: 'spec_missing', fields: read.missing });
  if (read.invalid.length > 0) attention.push({ reason: 'spec_invalid', fields: read.invalid });
  return { ok: false, attention };
}

interface MatchIndex {
  readonly own: Map<string, ImportCatalogEntry[]>;
  readonly platform: Map<string, ImportCatalogEntry[]>;
}

/** The tenant's own SKUs come first: a product the tenant already made is the one it means. */
function candidatesFor(identity: string, index: MatchIndex): readonly Target[] {
  const own = index.own.get(identity) ?? [];
  if (own.length > 0) return own.map((entry) => ({ on: 'own', entry }));
  return (index.platform.get(identity) ?? []).map((entry) => ({ on: 'platform', entry }));
}

/** What a row's brand and model name, before its price is judged. */
type Resolution =
  | { readonly is: 'attention'; readonly attention: readonly ImportAttention[] }
  | { readonly is: 'match'; readonly target: Target }
  | { readonly is: 'new'; readonly spec: CatalogSpec };

/**
 * One candidate is a match unless its spec disagrees and nobody has answered; a platform match the
 * person chose to import as their own, or no candidate at all, is a new item held to its envelope.
 */
function resolve(row: CatalogImportRowInput, candidates: readonly Target[]): Resolution {
  if (candidates.length > 1) {
    return { is: 'attention', attention: [{ reason: 'several_matches', fields: [] }] };
  }
  const [target] = candidates;
  const asOwnItem = target?.on === 'platform' && row.answer === 'import_as_own_item';
  if (target !== undefined && !asOwnItem) {
    // On an own SKU the only answer is to keep its spec: it is already the tenant's own.
    const conflicts = conflictingFields(row, target.entry.spec);
    if (conflicts.length === 0 || row.answer === 'keep_catalog_spec')
      return { is: 'match', target };
    return { is: 'attention', attention: [{ reason: 'spec_conflict', fields: conflicts }] };
  }
  const made = newItemSpec(row);
  return made.ok ? { is: 'new', spec: made.spec } : { is: 'attention', attention: made.attention };
}

function matchRow(
  row: CatalogImportRowInput,
  catalog: ImportCatalog,
  index: MatchIndex,
  seen: Set<string>,
): CatalogImportRowMatch {
  if (row.leftOut) return { outcome: 'left_out' };
  const attention: ImportAttention[] = [];
  const brand = row.cells.brand?.trim() ?? '';
  const model = row.cells.model?.trim() ?? '';
  const named = brand !== '' && model !== '';
  if (!named) attention.push({ reason: 'brand_or_model_missing', fields: [] });
  const price = readImportPrice(row.cells.rate, catalog.currency);
  if (!price.ok) attention.push({ reason: price.reason, fields: [] });
  if (!named) return { outcome: 'needs_attention', attention };

  const identity = identityOf(brand, model);
  if (seen.has(identity)) attention.push({ reason: 'repeated_in_file', fields: [] });
  seen.add(identity);
  const resolved = resolve(row, candidatesFor(identity, index));
  if (resolved.is === 'attention') attention.push(...resolved.attention);
  if (!price.ok || resolved.is === 'attention' || attention.length > 0) {
    return { outcome: 'needs_attention', attention };
  }
  if (resolved.is === 'new') {
    return { outcome: 'new_item', brand, model, spec: resolved.spec, rate: price.amount };
  }
  const { target } = resolved;
  return target.on === 'platform'
    ? { outcome: 'price_override', platformItemId: target.entry.id, rate: price.amount }
    : { outcome: 'own_item_price', ownItemId: target.entry.id, rate: price.amount };
}

/**
 * Every row of one sheet, in order. A brand and model the sheet repeats is matched once — its
 * first row that is not left out — and every later row asks which one is meant, so one import never
 * writes two SKUs for one product.
 */
export function matchImportRows(
  rows: readonly CatalogImportRowInput[],
  catalog: ImportCatalog,
): readonly CatalogImportRowMatch[] {
  const index: MatchIndex = {
    own: byIdentity(catalog.ownItems),
    platform: byIdentity(catalog.platformItems),
  };
  const seen = new Set<string>();
  return rows.map((row) => matchRow(row, catalog, index, seen));
}
