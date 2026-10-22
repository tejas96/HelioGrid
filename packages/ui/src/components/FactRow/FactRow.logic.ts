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
  FactRowProps,
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

/** The rows a group holds — its element children. */
export function factRowsOf(children: ReactNode): ReactElement<Partial<FactRowProps>>[] {
  return Children.toArray(children).filter(isFactRowElement);
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
  fieldName: string | undefined,
  label: ReactNode,
): NamedGapSpec {
  const name = fieldName ?? gap.fieldName ?? (typeof label === 'string' ? label : undefined);
  return name === undefined ? gap : { ...gap, fieldName: name };
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
export function useGapDropsTier(gap: unknown, provenance: unknown, label: ReactNode): void {
  const named = typeof label === 'string' ? label : '';
  useEffect(() => {
    if (gap && provenance) {
      console.warn(
        `FactRow ${JSON.stringify(named)}: a named gap takes no provenance tier (law 10) — the tier was dropped.`,
      );
    }
  }, [gap, provenance, named]);
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
