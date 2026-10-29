import {
  COMPONENT_KINDS,
  type ComponentKind,
  draftIsBlank,
  type ItemDraft,
  type ItemDraftEvent,
  type SchemeDraft,
} from '@heliogrid/domain';
import { figureOf } from '../CatalogRates/CatalogRates.logic';
import type { InputProps } from '../Input/Input.types';
import type { NumberFieldProps } from '../NumberField/NumberField.types';
import type { RangeFieldProps, RangeValue } from '../RangeField/RangeField.types';
import type { SelectProps } from '../Select/Select.types';
import type { SpecCell } from './CatalogItemForm.layout';
import type { FieldFocus } from './CatalogItemForm.parts.types';
import type { CatalogItemFormProps, CatalogItemFormWords } from './CatalogItemForm.types';

type ListCell = Extract<SpecCell, { as: 'technology' | 'phases' | 'chemistry' }>;

/** The MPPT window's track as the board draws it: 0 to 1000 V in steps of 10. */
export const MPPT_WINDOW = { min: 0, max: 1000, step: 10 } as const;

/** What the body shows above the item card: the pre-fill's banner, else the spreadsheet tile. */
export function bodyHeadOf(props: CatalogItemFormProps) {
  const { words, onSpreadsheet, draft, read } = props;
  return {
    banner: words.banner,
    spreadsheet: words.banner === null ? onSpreadsheet : null,
    needs: read.kind !== 'loading' && draftIsBlank(draft),
  };
}

/** A spec figure as `NumberField` takes it: unset is no value, never `0`. */
export function figureAt(draft: ItemDraft, path: string): number | undefined {
  const value = draft.spec[path];
  return typeof value === 'number' ? value : undefined;
}

/** A list cell's choice as `Select` holds it: the phase count as its string. */
export function choiceAt(draft: ItemDraft, cell: ListCell): string | undefined {
  const value = draft.spec[cell.path];
  return value === null || value === undefined ? undefined : String(value);
}

/** A list cell's choices, in the words' order. */
export function choicesOf(words: CatalogItemFormWords, cell: ListCell) {
  if (cell.as === 'technology') return words.technologies;
  if (cell.as === 'phases') return words.phases;
  return words.chemistries;
}

/** A picked choice as the draft's event: the phase count is a number, the others as chosen. */
export function choiceEvent(cell: ListCell, value: string): ItemDraftEvent {
  return { type: 'spec', path: cell.path, value: cell.as === 'phases' ? Number(value) : value };
}

/** The window's two ends as `RangeField` takes them: none while both are unset, an unset end at its track's end. */
export function windowAt(draft: ItemDraft): RangeValue | null {
  const low = draft.spec['mppt.minV'];
  const high = draft.spec['mppt.maxV'];
  if (typeof low !== 'number' && typeof high !== 'number') return null;
  return [
    typeof low === 'number' ? low : MPPT_WINDOW.min,
    typeof high === 'number' ? high : MPPT_WINDOW.max,
  ];
}

/**
 * A committed window as draft events: once either end is set, both ends are held exactly as drawn,
 * so what the boxes show is what the judge reads — an end left at its track's end included.
 */
export function windowEvents(draft: ItemDraft, [low, high]: RangeValue): ItemDraftEvent[] {
  const ends = [
    ['mppt.minV', low],
    ['mppt.maxV', high],
  ] as const;
  return ends.flatMap(([path, value]): ItemDraftEvent[] =>
    draft.spec[path] === value ? [] : [{ type: 'spec', path, value }],
  );
}

/** Fields a person types into: the lists and the window take no keyboard focus from outside. */
const NOT_TYPED = new Set([
  'spec.technology',
  'spec.phases',
  'spec.chemistry',
  'spec.mppt.minV',
  'spec.mppt.maxV',
]);

/** Where a refused send lands focus: the first typed field `failures` names, in their order. */
export function fieldFocusOf(props: CatalogItemFormProps): FieldFocus {
  const path = Object.keys(props.failures).find((at) => !NOT_TYPED.has(at)) ?? null;
  return { path, request: props.refusal };
}

/** One field's `focusRequest`: the refusal's count when focus belongs to it, else none. */
export const focusFor = (focus: FieldFocus, path: string): number | undefined =>
  focus.path === path ? focus.request : undefined;

/** A spec field's words under it, by the body's own path (`spec.vocV`). */
export function specFailureOf(failures: CatalogItemFormProps['failures'], cell: SpecCell) {
  if (cell.as === 'window') return failures['spec.mppt.minV'] ?? failures['spec.mppt.maxV'];
  return failures[`spec.${cell.path}`];
}

/** What one spec cell is handed: the draft, its words, the gate's verdicts and the way back. */
export interface SpecCellFacts {
  readonly focus: FieldFocus;
  readonly draft: ItemDraft;
  readonly words: CatalogItemFormWords;
  readonly failures: CatalogItemFormProps['failures'];
  /** The create is out: every field is inert until it answers. */
  readonly disabled: boolean;
  readonly onChange: (event: ItemDraftEvent) => void;
}

/**
 * A figure's field: its label and unit, the board's places, unset as an empty box; each figure
 * reaches the draft as typed, and emptying it unsets it. A pre-fill's fields say where they came from.
 */
export function figureFieldOf(
  { draft, words, failures, focus, disabled, onChange }: SpecCellFacts,
  cell: Extract<SpecCell, { as: 'number' }>,
): NumberFieldProps {
  const field = words.fields[cell.path];
  return {
    label: field?.label,
    unit: field?.unit ?? undefined,
    precision: cell.precision,
    value: figureAt(draft, cell.path),
    commits: 'as-typed',
    steppers: false,
    density: 'functional',
    hint: words.copied ?? undefined,
    error: specFailureOf(failures, cell),
    focusRequest: focusFor(focus, `spec.${cell.path}`),
    disabled,
    onCommit: (value) => onChange({ type: 'spec', path: cell.path, value }),
    onClear: () => onChange({ type: 'spec', path: cell.path, value: null }),
  };
}

/** A list's field: its choices, the datasheet's own prompt while unset. */
export function choiceFieldOf(
  { draft, words, failures, disabled, onChange }: SpecCellFacts,
  cell: ListCell,
): SelectProps {
  return {
    label: words.fields[cell.path]?.label,
    value: choiceAt(draft, cell),
    options: [...choicesOf(words, cell)],
    placeholder:
      cell.as === 'technology' ? words.technologyPlaceholder : words.fields[cell.path]?.label,
    density: 'functional',
    helper: words.copied ?? undefined,
    error: specFailureOf(failures, cell),
    disabled,
    onChange: (value) => onChange(choiceEvent(cell, value)),
  };
}

/**
 * The inverter's MPPT window: two typed ends on the board's track, each written back as it changes.
 * The track has no readout of its own words, so an untouched pair shows none.
 */
export function windowFieldOf(
  { draft, words, failures, disabled, onChange }: SpecCellFacts,
  cell: SpecCell,
): RangeFieldProps {
  return {
    label: words.mpptWindow,
    value: windowAt(draft),
    ...MPPT_WINDOW,
    unit: words.fields['mppt.minV']?.unit ?? undefined,
    boxes: true,
    boxLabels: [words.low, words.high],
    anyLabel: '',
    hint: words.copied ?? undefined,
    error: specFailureOf(failures, cell),
    disabled,
    onCommit: (value) => {
      for (const event of windowEvents(draft, value)) onChange(event);
    },
  };
}

/** The kind a `Select` value names, or `null` for a value that names none. */
export function kindNamed(value: string): ComponentKind | null {
  return COMPONENT_KINDS.find((kind) => kind === value) ?? null;
}

/** The item card's three fields: what it is, its brand, its model, each with its words. */
export function itemFieldsOf(props: CatalogItemFormProps) {
  const { draft, words, failures, saving, onChange } = props;
  const focus = fieldFocusOf(props);
  const kind: SelectProps = {
    label: words.whatItIs,
    value: draft.kind,
    options: [...words.kinds],
    placeholder: words.whatItIs,
    helper: words.kindHelper,
    density: 'functional',
    disabled: saving,
    onChange: (value) => {
      const picked = kindNamed(value);
      if (picked !== null) onChange({ type: 'kind', kind: picked });
    },
  };
  const brand: InputProps = {
    label: words.brand,
    placeholder: words.brandPlaceholder,
    value: draft.brand,
    helper: words.copied ?? undefined,
    error: failures.brand,
    focusRequest: focusFor(focus, 'brand'),
    density: 'functional',
    disabled: saving,
    onChange: (value) => onChange({ type: 'brand', value }),
  };
  const model: InputProps = {
    label: words.model,
    placeholder: words.modelPlaceholder,
    value: draft.model,
    helper: words.modelCopied ?? undefined,
    error: failures.model,
    focusRequest: focusFor(focus, 'model'),
    density: 'functional',
    disabled: saving,
    onChange: (value) => onChange({ type: 'model', value }),
  };
  return { kind, brand, model };
}

/** *Your price (optional)*: money, never below 0, unset as an empty box; the draft keeps it as typed. */
export function priceFieldOf(props: CatalogItemFormProps) {
  const { draft, words, failures, onChange } = props;
  return {
    label: words.yourPrice,
    hint: words.priceHint,
    value: figureOf(draft.price),
    currency: true,
    outOfRange: 'refuse',
    min: 0,
    steppers: false,
    commits: 'as-typed',
    density: 'functional',
    error: failures['rate.amount'],
    focusRequest: focusFor(fieldFocusOf(props), 'rate.amount'),
    disabled: props.saving,
    onCommit: (value) => onChange({ type: 'price', value: String(value) }),
    onClear: () => onChange({ type: 'price', value: '' }),
  } satisfies NumberFieldProps;
}

const SCHEME_OFF: SchemeDraft = { on: false, reference: '' };

/** One row per declared scheme the words name: its switch words, what the draft holds, its verdict. */
export function schemeRowsOf(props: CatalogItemFormProps) {
  const { schemes, words, draft, failures, saving } = props;
  const focus = fieldFocusOf(props);
  return schemes.flatMap(({ scheme }) => {
    const rowWords = words.schemeRows[scheme];
    if (rowWords === undefined) return [];
    const held = draft.schemes[scheme] ?? SCHEME_OFF;
    const path = `certifications.${scheme}`;
    return [
      {
        scheme,
        words: rowWords,
        held,
        error: failures[path],
        focusRequest: focusFor(focus, path),
        disabled: saving,
      },
    ];
  });
}

/** The pre-fill's wait: one bar per field of the spec grid, nine as the board draws it. */
export const SPEC_LOADING_BARS = Array.from({ length: 9 }, () => 'row' as const);
