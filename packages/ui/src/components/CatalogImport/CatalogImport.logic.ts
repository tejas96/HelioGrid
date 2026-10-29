import type { CatalogImportRowWire, CatalogImportWire } from '@heliogrid/contracts';
import {
  CATALOG_IMPORT_ATTENTION_REASONS,
  CATALOG_IMPORT_ROW_FAILURES,
  CATALOG_IMPORT_STATES,
  type CatalogImportCells,
  type CatalogImportState,
  COMPONENT_KINDS,
  type ComponentKind,
  firstAttentionReason,
  type ImportFixAct,
  type ImportFixChoice,
  importFixAct,
  importFixRequest,
} from '@heliogrid/domain';
import type { StatusTone } from '../../primitives/StatusMark/StatusMark.types';
import type {
  CatalogImportProps,
  CatalogImportWords,
  ImportRowWordsFacts,
} from './CatalogImport.types';

/**
 * What both halves draw from the props (`SCR-M01-17`): a row's card or list line, the overview's
 * figures and filters, the file chip and the step's act. Pure: no markup, no data access.
 */

/** The market's formats, from `useCatalogFormats` and the pack's clock. */
export interface ImportFormats {
  readonly money: (amount: string) => string;
  readonly date: (iso: string) => string;
  readonly clockAt: (iso: string) => string;
}

export function stateOf(job: CatalogImportWire | null): CatalogImportState | null {
  if (job === null) return null;
  return CATALOG_IMPORT_STATES.find((state) => state === job.status) ?? 'completed';
}

const cellsOf = (row: CatalogImportRowWire): CatalogImportCells => ({ ...row.cells, ...row.fix });

/** The row's reasons this build knows; one a later server adds asks nothing here. */
const reasonsOf = (row: CatalogImportRowWire) =>
  row.attention.flatMap((entry) => {
    const reason = CATALOG_IMPORT_ATTENTION_REASONS.find((known) => known === entry.reason);
    return reason === undefined ? [] : [{ reason, fields: entry.fields }];
  });

const failureOf = (row: CatalogImportRowWire) =>
  CATALOG_IMPORT_ROW_FAILURES.find((known) => known === row.failure) ?? null;

/** A row's product as its own cells name it — the file's words, never translated. */
export function productOf(row: CatalogImportRowWire): string {
  const cells = cellsOf(row);
  const name = [cells.brand, cells.model].filter(
    (part) => part !== undefined && part.trim() !== '',
  );
  return name.length > 0 ? name.join(' ') : '—';
}

const namedName = (item: { readonly brand: string; readonly model: string }) =>
  `${item.brand} ${item.model}`;

function specAt(spec: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value === null || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, spec);
}

/** What the row's question or reason names. */
export function rowFacts(
  row: CatalogImportRowWire,
  words: CatalogImportWords,
  formats: ImportFormats,
): ImportRowWordsFacts {
  const cells = cellsOf(row);
  const [only, ...more] = row.named;
  const named = only !== undefined && more.length === 0 ? only : null;
  const conflict = row.attention.find((entry) => entry.reason === 'spec_conflict');
  const field = conflict?.fields[0];
  return {
    product: productOf(row),
    named: named === null ? null : namedName(named),
    conflict:
      field === undefined || named === null
        ? null
        : {
            field: words.fields[field as keyof CatalogImportWords['fields']] ?? field,
            file: cells[field as keyof CatalogImportCells] ?? '',
            catalog: String(specAt(named.spec, field) ?? ''),
          },
    priceText: cells.rate ?? '',
    repeat:
      row.repeats === null
        ? null
        : {
            row: row.repeats.rowNumber,
            price: row.repeats.filePrice === null ? null : formats.money(row.repeats.filePrice),
          },
    unit: null,
  };
}

export interface ImportCardView {
  readonly rowNumber: number;
  readonly title: string;
  readonly sub: string;
  readonly question: string;
  readonly act: ImportFixAct;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly busy: boolean;
  /** Sends a choice: the request and its undo are domain's. */
  readonly choose: (choice: ImportFixChoice) => void;
}

/** One row of *Need you* as its card asks it. */
export function cardOf(
  row: CatalogImportRowWire,
  props: Pick<CatalogImportProps, 'words' | 'job' | 'busy' | 'onFix'>,
  formats: ImportFormats,
): ImportCardView {
  const { words } = props;
  const reason = firstAttentionReason(reasonsOf(row)) ?? 'brand_or_model_missing';
  const facts = rowFacts(row, words, formats);
  const act = importFixAct(reason, stateOf(props.job) ?? 'previewed');
  const several = row.named.length > 1;
  const options =
    act === 'pick'
      ? row.named.map((item) => ({
          value: item.kind,
          label: `${namedName(item)} · ${words.kinds[item.kind]}`,
        }))
      : act === 'kind'
        ? COMPONENT_KINDS.map((kind: ComponentKind) => ({ value: kind, label: words.kinds[kind] }))
        : [];
  return {
    rowNumber: row.rowNumber,
    title: facts.product,
    sub: words.rowSub(row.rowNumber, facts.named, several ? 'several' : 'matches'),
    question: words.question(reason, facts),
    act,
    options,
    busy: props.busy(row.rowNumber) || (row.repeats !== null && props.busy(row.repeats.rowNumber)),
    choose: (choice) => {
      const request = importFixRequest(row, choice);
      if (request !== null) props.onFix(row, request.target, request.body, request.undo);
    },
  };
}

/** What a settled card says it set. */
export function fixedLineOf(
  row: CatalogImportRowWire,
  words: CatalogImportWords,
  formats: ImportFormats,
): string {
  if (row.outcome === 'left_out') return words.fixedLine('leftOut', null);
  if (row.answer !== null) return words.fixedLine('answer', null);
  const typed = row.fix;
  if (typed.rate !== undefined && row.filePrice !== null) {
    return words.fixedLine('price', formats.money(row.filePrice));
  }
  const kind = COMPONENT_KINDS.find((known) => known === typed.kind);
  if (kind !== undefined) return words.fixedLine('kind', words.kinds[kind]);
  return words.fixedLine('repeat', null);
}

export interface ImportListRowView {
  readonly rowNumber: number;
  readonly title: string;
  readonly sub: string;
  readonly reason: string | null;
  readonly reasonTone: 'danger' | 'warning' | null;
  readonly chip: { readonly label: string; readonly tone: StatusTone };
  /** The price before, formatted; `null` draws *No price*. */
  readonly was: string | null;
  /** The price after, formatted; `null` draws *Unchanged*. */
  readonly now: string | null;
}

type SubKind = Parameters<CatalogImportWords['rowSub']>[2];

/** How the row's line under its name reads: what it matched, or that it is new. */
function subKindOf(row: CatalogImportRowWire): SubKind {
  switch (row.outcome) {
    case 'own_item_price':
      return 'own';
    case 'new_item':
      return row.result === 'failed' ? 'notCreated' : 'new';
    case 'price_override':
      return 'override';
    default:
      return 'matches';
  }
}

/** The chip a row's outcome — or, in the report, its open result — reads. */
function chipOf(row: CatalogImportRowWire, words: CatalogImportWords): ImportListRowView['chip'] {
  if (row.result === 'failed') return { label: words.outcomes.failed, tone: 'danger' };
  if (row.result === 'left_out') return { label: words.outcomes.leftOut, tone: 'warning' };
  if (row.outcome === 'own_item_price') return { label: words.outcomes.own, tone: 'info' };
  if (row.outcome === 'new_item') return { label: words.outcomes.new, tone: 'neutral' };
  return { label: words.outcomes.override, tone: 'info' };
}

const REASON_TONE: Partial<Record<string, 'danger' | 'warning'>> = {
  failed: 'danger',
  left_out: 'warning',
};

/** One row of an outcome list, in the preview or the report. */
export function listRowOf(
  row: CatalogImportRowWire,
  words: CatalogImportWords,
  formats: ImportFormats,
  phase: 'preview' | 'report',
): ImportListRowView {
  const facts = rowFacts(row, words, formats);
  const money = (amount: string | null | undefined) =>
    amount === null || amount === undefined ? null : formats.money(amount);
  const base = {
    rowNumber: row.rowNumber,
    title: facts.product,
    sub: words.rowSub(row.rowNumber, facts.named, subKindOf(row)),
    chip: chipOf(row, words),
  };
  if (phase === 'preview') {
    const was = money(row.catalogPrice?.amount);
    return { ...base, reason: null, reasonTone: null, was, now: money(row.filePrice) };
  }
  const tone = REASON_TONE[row.result ?? ''] ?? null;
  const attention = firstAttentionReason(reasonsOf(row));
  return {
    ...base,
    reason: tone === null ? null : words.reason({ ...facts, attention, failure: failureOf(row) }),
    reasonTone: tone,
    was: money(row.priceBefore?.amount),
    now: money(row.priceApplied?.amount),
  };
}
