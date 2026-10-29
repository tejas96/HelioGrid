import type { TranslatedText } from '@heliogrid/contracts';
import {
  Children,
  createContext,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react';
import type { NamedGapSpec } from '../NamedGap/NamedGap.types';
import type {
  FactDensity,
  FactForm,
  FactInkKind,
  FactInkProps,
  FactReason,
  FactRowForm,
  FactRowProps,
  FactRowsForm,
  FactShape,
} from './FactRow.types';

/** The design system's defaults: a 44-character reading measure, the 240 floor, 32-character long. */
export const FACT_MEASURE = 44;
export const FACT_LEAD_BELOW = 240;
export const FACT_LONG_AT = 32;

/** The join between items of a short list, and between the word and the value in the flow form. */
export const FACT_JOIN = ' · ';
export const FACT_DASH = ' — ';

/** A value box taller than this many of its own lines has wrapped. */
export const FACT_WRAP_LINES = 1.6;

interface RowShapeInput {
  value?: ReactNode;
  values?: ReactNode[];
  long?: boolean;
  stack?: boolean;
}

interface RowShape {
  /** The list, its absent items filtered out — `null` when the row holds one value. */
  items: ReactNode[] | null;
  /** A list whose items are long enough to need a line each. */
  stacked: boolean;
  /** The caller said so, or the value is a long string, or the list stacks — no measuring needed. */
  declaredLong: boolean;
}

export function rowShape(p: RowShapeInput, longAt: number = FACT_LONG_AT): RowShape {
  const items = Array.isArray(p.values)
    ? p.values.filter((v) => v !== null && v !== undefined && v !== false)
    : null;
  const longItem = (items ?? []).some((v) => typeof v === 'string' && v.length > longAt);
  const stacked = items !== null && items.length > 0 ? (p.stack ?? longItem) : false;
  const longValue = typeof p.value === 'string' && p.value.length > longAt;
  return { items, stacked, declaredLong: p.long ?? (stacked || longValue) };
}

/** Would this row's value need the full-width form on its own, before anything is measured? */
export function factWantsLead(
  props: Partial<FactRowProps>,
  longAt: number = FACT_LONG_AT,
): boolean {
  return rowShape(props, longAt).declaredLong;
}

export const isWords = (node: ReactNode): node is string | number =>
  typeof node === 'string' || typeof node === 'number';

/** A flow row's value as one run of words — the list joined — or `null` when it holds a node. */
export function flowWords(value: ReactNode, items: ReactNode[] | null): string | null {
  if (items !== null && items.length > 0)
    return items.every(isWords) ? items.join(FACT_JOIN) : null;
  return isWords(value) ? String(value) : null;
}

/** The floor answers for a box too small to hold a pair — never for one not laid out (`null`). */
export function isUnderFloor(width: number | null, leadBelow: number): boolean {
  return width !== null && width < leadBelow;
}

/** A group's one form for every row it holds, and why. */
export function groupForm(input: {
  forced: FactForm | 'auto';
  declared: boolean;
  floor: boolean;
  fits: boolean;
}): { form: FactForm; reason: FactReason } {
  if (input.forced !== 'auto') return { form: input.forced, reason: 'forced' };
  if (input.declared) return { form: 'lead', reason: 'declared' };
  if (input.floor) return { form: 'lead', reason: 'floor' };
  return input.fits ? { form: 'pair', reason: 'fits' } : { form: 'lead', reason: 'measured' };
}

export function shapeOf(lead: boolean, stacked: boolean): FactShape {
  if (!lead) return 'pair';
  return stacked ? 'stack' : 'flow';
}

/**
 * A row on its own takes its forced form, else `lead` when it is declared long, under the floor or
 * does not fit. Its answer is reported only once it is settled and its box has been measured.
 */
export function loneRowForm(input: {
  forced: FactForm | 'auto';
  declaredLong: boolean;
  floor: boolean;
  fits: boolean;
  answered: boolean;
  width: number | null;
  stacked: boolean;
  hasMark: boolean;
}): { lead: boolean; shape: FactShape; answer: FactRowForm | null } {
  const { forced, declaredLong, floor, width } = input;
  const lead = forced !== 'auto' ? forced === 'lead' : declaredLong || floor || !input.fits;
  const shape = shapeOf(lead, input.stacked);
  const settled = forced !== 'auto' || declaredLong || floor || input.answered;
  const answer: FactRowForm | null =
    settled && width !== null
      ? { form: lead ? 'lead' : 'pair', shape, width, hasMark: input.hasMark }
      : null;
  return { lead, shape, answer };
}

/** A row in a group takes its own forced form, else the group's — and the group's density unless its own. */
export function groupedRowShape(props: FactRowProps, group: FactGroupAnswer) {
  const { items, stacked } = rowShape(props, group.longAt);
  const forced = props.form ?? 'auto';
  const lead = forced !== 'auto' ? forced === 'lead' : group.form === 'lead';
  return {
    items,
    stacked,
    shape: shapeOf(lead, stacked),
    hasMarkCol: group.hasMark,
    density: props.density ?? group.density,
  };
}

/**
 * A group's form and why, from its rows and its box — reported only once it is settled and its box
 * has been measured.
 */
export function rowsGroupForm(input: {
  forced: FactForm | 'auto';
  declared: boolean;
  floor: boolean;
  fits: boolean;
  answered: boolean;
  width: number | null;
  hasMark: boolean;
}): { form: FactForm; reason: FactReason; answer: FactRowsForm | null } {
  const { forced, declared, floor, width, hasMark } = input;
  const { form, reason } = groupForm({ forced, declared, floor, fits: input.fits });
  const settled = forced !== 'auto' || declared || floor || input.answered;
  const answer = settled && width !== null ? { form, width, hasMark, reason } : null;
  return { form, reason, answer };
}

/** The rows a group holds — its element children. */
export function factRowsOf(children: ReactNode): ReactElement<Partial<FactRowProps>>[] {
  return Children.toArray(children).filter(isFactRowElement);
}

/** A group's rows, whether any declares itself long, and whether any carries a mark. */
export function groupedRows(children: ReactNode, longAt: number) {
  const rows = factRowsOf(children).map((row) => row.props);
  return {
    rows,
    declared: rows.some((row) => factWantsLead(row, longAt)),
    hasMark: rows.some((row) => Boolean(row.mark)),
  };
}

/** A child element read for its row props: a group holds rows and nothing else. */
function isFactRowElement(node: ReactNode): node is ReactElement<Partial<FactRowProps>> {
  return isValidElement(node);
}

/** What a measurement was taken of: how many rows and how long each one's words are, so a value
 *  edited from short to long re-opens the question without waiting for a resize. */
export function contentSignature(rows: readonly Partial<FactRowProps>[]): string {
  return rows
    .map((p) => {
      const words =
        typeof p.value === 'string'
          ? p.value
          : Array.isArray(p.values)
            ? p.values.filter((v) => typeof v === 'string').join('')
            : '';
      return `${typeof p.label === 'string' ? p.label.length : 0}.${words.length}`;
    })
    .join(',');
}

/** The gap with the row's own name for its action; a spec's own `fieldName` is kept unless the row
 *  names one. */
export function gapWithName(
  gap: NamedGapSpec,
  fieldName: TranslatedText | undefined,
  label: TranslatedText,
): NamedGapSpec {
  return { ...gap, fieldName: fieldName ?? gap.fieldName ?? label };
}

/** Reports an answer once per change of `key`, never on a render that did not change it. `info`
 *  is `null` while nothing has been measured — a form nobody measured is not worth publishing. */
export function useAnswerReport<T>(
  info: T | null,
  key: string,
  onFormChange: ((info: T) => void) | undefined,
): void {
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (onFormChange === undefined || info === null || reported.current === key) return;
    reported.current = key;
    onFormChange(info);
  }, [info, key, onFormChange]);
}

/** A tier answers how a figure was arrived at; beside a gap there is no figure, so it is dropped. */
export function useGapDropsTier(gap: unknown, provenance: unknown, label: TranslatedText): void {
  useEffect(() => {
    if (gap && provenance) {
      console.warn(
        `FactRow ${JSON.stringify(label)}: a named gap takes no provenance tier (law 10) — the tier was dropped.`,
      );
    }
  }, [gap, provenance, label]);
}

/** The group's answer every row in it lands on. */
export interface FactGroupAnswer {
  form: FactForm;
  hasMark: boolean;
  density: FactDensity;
  longAt: number;
}

export interface FactGround {
  ink: FactInkKind;
  group?: FactGroupAnswer;
}

const FactGroundContext = createContext<FactGround>({ ink: 'default' });

export const FactGroundProvider = FactGroundContext.Provider;

export function useFactGround(): FactGround {
  return useContext(FactGroundContext);
}

/**
 * The ground a fact row is rendered on. `Banner` wraps its body in this, so a fact row on a tinted
 * strip takes the banner's ink — label and value both `currentColor`, separated by weight.
 */
export function FactInk({ ink = 'inherit', children }: FactInkProps) {
  const outer = useFactGround();
  return createElement(FactGroundProvider, { value: { ...outer, ink } }, children);
}
