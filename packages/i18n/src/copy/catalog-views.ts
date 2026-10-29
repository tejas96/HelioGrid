import type {
  CatalogReleaseLineWire,
  ResolvedCatalogItemWire,
  TranslatedText,
} from '@heliogrid/contracts';
import {
  type CatalogItemsListed,
  type CatalogRowAct,
  catalogLayerOf,
  RELEASE_CHANGE_KINDS,
  type ReleaseChangeKind,
  type ReleaseFieldChange,
  releaseFieldChanges,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { CATALOG_EDITOR, releaseChangeWord } from './catalog-editor';
import {
  CATALOG_SETTINGS,
  type CatalogStill,
  catalogEditFailed,
  catalogViewOnly,
} from './catalog-settings';
import {
  catalogEditorChips,
  catalogItemsWords,
  catalogReleaseStripWords,
  catalogRowWords,
} from './catalog-words';

type T = Translator['t'];

/** The market's formats, handed in so the words stay format-free. */
export interface CatalogFormats {
  readonly number: (value: number) => string;
  readonly money: (amount: string) => string;
  readonly percent: (pct: string) => string;
}

/** The schemes an item holds, of the market's declared ones, in the market's order (`M01-34`). */
function heldOf(item: ResolvedCatalogItemWire, schemes: readonly string[]): string[] {
  const held = new Set(item.certifications.map((claim) => claim.scheme));
  return schemes.filter((scheme) => held.has(scheme));
}

/** One resolved item as the Items panel draws it (`SCR-M01-15`): facts and their words. */
export function catalogRowOf(
  t: T,
  item: ResolvedCatalogItemWire,
  schemes: readonly string[],
  formats: CatalogFormats,
) {
  const layer = catalogLayerOf(item);
  const amount = item.rate === undefined ? undefined : (item.rate?.amount ?? null);
  return {
    id: item.id,
    kind: item.spec.kind,
    layer,
    provenance: item.provenance,
    amount,
    held: heldOf(item, schemes),
    hidden: item.hidden,
    preferred: item.preferred,
    archived: item.archived,
    source: item.source,
    ...catalogRowWords(t, { ...item, layer, amount }, formats.number, formats.money),
  };
}

/** The price editor's item card. */
export function catalogEditedItemOf(
  t: T,
  item: ResolvedCatalogItemWire,
  schemes: readonly string[],
  formats: CatalogFormats,
) {
  return {
    overline: t(item.source === 'own_item' ? CATALOG_EDITOR.ownItem : CATALOG_EDITOR.platformItem),
    name: `${item.brand} ${item.model}`,
    chips: catalogEditorChips(t, item.spec, item.provenance, formats.number),
    held: heldOf(item, schemes),
  };
}

const FIELD: Record<ReleaseFieldChange['field'], { id: string }> = {
  price: CATALOG_EDITOR.price,
  tax: CATALOG_EDITOR.taxRate,
  hidden: CATALOG_EDITOR.pickers,
  preferred: CATALOG_EDITOR.preferred,
  archived: /*i18n*/ { id: 'Archived' },
};

function valueWord(
  t: T,
  change: ReleaseFieldChange,
  value: string | boolean | null,
  formats: CatalogFormats,
) {
  if (value === null) return t(CATALOG_EDITOR.noValue);
  if (change.field === 'price') return formats.money(String(value));
  if (change.field === 'tax') return formats.percent(String(value));
  if (change.field === 'hidden') return t(value ? CATALOG_EDITOR.hiddenWord : CATALOG_EDITOR.shown);
  return t(value ? CATALOG_EDITOR.yes : CATALOG_EDITOR.no);
}

/**
 * A release's before-and-after (`M01-43`): its counts as tiles — a kind with none draws no tile —
 * and each item with the fields it moved. An addition reads *New*, with no before.
 */
export function catalogReleaseChangesOf(
  t: T,
  counts: Readonly<Record<ReleaseChangeKind, number>>,
  lines: readonly CatalogReleaseLineWire[],
  formats: CatalogFormats,
) {
  return {
    counts: RELEASE_CHANGE_KINDS.filter((kind) => counts[kind] > 0).map((kind) => ({
      kind,
      count: counts[kind],
      word: releaseChangeWord(t, kind),
    })),
    items: lines.map((line) => ({
      id: line.item.id,
      name: `${line.item.brand} ${line.item.model}`,
      kind: line.changeKind,
      fields: releaseFieldChanges(line.before, line.after).map((change) => ({
        field: t(FIELD[change.field]),
        from: change.from === undefined ? null : valueWord(t, change, change.from, formats),
        to: valueWord(t, change, change.to, formats),
        figure: change.field === 'price' || change.field === 'tax',
      })),
    })),
  };
}

/** A row act, as its pending line names it and its failed line says what is still true. */

const ACT: Record<CatalogRowAct, { id: string }> = {
  price: CATALOG_EDITOR.savePrice,
  preferred: CATALOG_EDITOR.preferredInPickers,
  hidden: CATALOG_EDITOR.hideFromPickers,
  archive: /*i18n*/ { id: 'Archive' },
  restore: /*i18n*/ { id: 'Restore' },
};

function stillOf(act: CatalogRowAct, item: ResolvedCatalogItemWire): CatalogStill {
  if (act === 'preferred') return item.preferred ? 'preferred' : 'not-preferred';
  if (act === 'hidden') return item.hidden ? 'hidden' : 'shown';
  if (act === 'archive') return 'listed';
  if (act === 'restore') return 'archived';
  return 'priced';
}

/** The pending and failed lines of one row's act (`s-error-edit`). */
export function catalogRowStatusWords(t: T, act: CatalogRowAct, item: ResolvedCatalogItemWire) {
  return { label: t(ACT[act]), reason: catalogEditFailed(t, stillOf(act, item)) };
}

/** What the Items panel shows, as the page's reads hand it over (`packages/domain`'s shape). */
export type CatalogItemsInput = CatalogItemsListed<ResolvedCatalogItemWire>;

/**
 * The Items panel's words and rows in one (`SCR-M01-15`): the strip, the view-only line, the
 * first-day card, the archived caption, every row and every row's pending or failed line. The
 * apps add the handlers.
 */
export function catalogItemsViewOf(
  t: T,
  input: CatalogItemsInput,
  formats: CatalogFormats & { readonly date: (value: string) => string },
) {
  const byId = new Map(input.items.map((item) => [item.id, item]));
  const statuses = Object.entries(input.acts).flatMap(([id, row]) => {
    const item = byId.get(id);
    return item === undefined
      ? []
      : [[id, { state: row.state, ...catalogRowStatusWords(t, row.act, item) }] as const];
  });
  return {
    words: catalogItemsWords(t, input.schemes, {
      count: input.archivedFilter ? input.totalCount : input.wholeCount,
      matched: input.narrowed && !input.archivedFilter ? input.totalCount : null,
      archived: input.archivedFilter,
      fresh: input.teaches,
      preferredFirst: input.preferredFirst,
    }),
    rows: input.items.map((item) => catalogRowOf(t, item, input.schemes, formats)),
    statuses: Object.fromEntries(statuses),
    strip: catalogReleaseStripWords(
      t,
      input.release === null
        ? null
        : { label: input.release.label, since: formats.date(input.release.publishedAt) },
      input.administers,
    ),
    viewOnly: input.administers ? null : catalogViewOnly(t, input.owners),
    teaching: input.teaches ? t(CATALOG_SETTINGS.teaching, { count: input.wholeCount }) : null,
    archivedCaption:
      input.archivedCount > 0 && !input.archivedFilter && !input.teaches
        ? t(CATALOG_SETTINGS.archivedCaption, { count: input.archivedCount })
        : null,
  };
}

/** A landed row act, as the toast tells it: the archive with its *Undo*, the restore, a failed undo. */
export function catalogActToast(
  t: T,
  note:
    | {
        readonly kind: 'archived';
        readonly item: { readonly brand: string; readonly model: string };
        readonly undo: () => void;
      }
    | {
        readonly kind: 'restored' | 'undo-failed';
        readonly item: { readonly brand: string; readonly model: string };
      },
) {
  const name = `${note.item.brand} ${note.item.model}`;
  if (note.kind === 'archived') {
    return {
      tone: 'neutral' as const,
      title: t(CATALOG_EDITOR.archived, { name }),
      description: t(CATALOG_EDITOR.archivedBody),
      undo: { label: t(CATALOG_EDITOR.undo), onUndo: note.undo },
    };
  }
  if (note.kind === 'restored')
    return { tone: 'success' as const, title: t(CATALOG_EDITOR.restored, { name }) };
  return { tone: 'danger' as const, title: t(CATALOG_EDITOR.undoFailed, { name }) };
}

/** The publish dialog's refusal under the name: taken, nothing new, or no answer. */
export function catalogPublishProblem(
  t: T,
  refusal: 'label-taken' | 'nothing-changed' | 'failed' | null,
): TranslatedText | null {
  if (refusal === null) return null;
  if (refusal === 'label-taken') return t(CATALOG_EDITOR.labelTaken);
  if (refusal === 'nothing-changed') return t(CATALOG_EDITOR.nothingChanged);
  return t(CATALOG_EDITOR.publishFailed);
}

/**
 * The publish dialog's body from the preview (`SCR-M01-15` s-publish): the count tiles and change
 * cards, the refusal under the name — the publish's own, or the preview's empty set, said as the
 * publish would say it — and whether *Publish* may be pressed.
 */
export function catalogPublishView(
  t: T,
  preview: {
    readonly counts: Readonly<Record<ReleaseChangeKind, number>> | undefined;
    readonly lines: readonly CatalogReleaseLineWire[];
  },
  refusal: 'label-taken' | 'nothing-changed' | 'failed' | null,
  formats: CatalogFormats,
) {
  const { counts } = preview;
  const empty = counts !== undefined && counts.added + counts.changed + counts.archived === 0;
  return {
    changes:
      counts === undefined ? null : catalogReleaseChangesOf(t, counts, preview.lines, formats),
    problem: catalogPublishProblem(t, empty ? 'nothing-changed' : refusal),
    sendable: counts !== undefined && !empty,
    moreLabel: t(CATALOG_EDITOR.moreChanges),
  };
}
