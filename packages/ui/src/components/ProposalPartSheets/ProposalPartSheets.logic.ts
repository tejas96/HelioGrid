import {
  BATTERY_CHEMISTRIES,
  type ComponentCategory,
  type ComponentLine,
  INVERTER_TYPES,
  isCountedCategory,
  PANEL_TECHNOLOGIES,
} from '@heliogrid/domain';
import type { ProposalPartPickerProps } from './ProposalPartSheets.types';

/** How one of a line's print facts is typed in the edit sheet (`M06-29`). */
export type PartFieldKind =
  | { readonly kind: 'number'; readonly unit?: string; readonly precision: number }
  | { readonly kind: 'text' }
  | { readonly kind: 'choice'; readonly values: readonly string[] };

export interface PartField {
  /** The key the line holds the fact under — and the key its name is worded by. */
  readonly key: string;
  readonly input: PartFieldKind;
}

const text = (key: string): PartField => ({ key, input: { kind: 'text' } });
const number = (key: string, unit: string | undefined, precision = 0): PartField => ({
  key,
  input: unit === undefined ? { kind: 'number', precision } : { kind: 'number', unit, precision },
});
const choice = (key: string, values: readonly string[]): PartField => ({
  key,
  input: { kind: 'choice', values },
});

/** The supply phases an inverter may carry, as the edit sheet offers them. */
const PHASES = ['1', '3'] as const;

/** `M06-29`'s census, a kind at a time, in the order the sheet draws them. Units are never translated. */
const FIELDS: Readonly<Record<ComponentCategory, readonly PartField[]>> = {
  panel: [number('wattPeak', 'Wp'), choice('technology', PANEL_TECHNOLOGIES), text('warranty')],
  inverter: [
    number('capacityKw', 'kW', 2),
    choice('inverterType', INVERTER_TYPES),
    choice('phases', PHASES),
    text('warranty'),
  ],
  cable: [text('cableType'), text('specification'), text('warranty')],
  electrical: [text('includes'), text('standard')],
  structure: [text('warranty'), number('weightPerKw', 'kg', 1), text('standard')],
  battery: [
    number('capacityKwh', 'kWh', 1),
    choice('chemistry', BATTERY_CHEMISTRIES),
    text('warranty'),
  ],
};

/** The fields the edit sheet draws for a line: its count where the kind carries one, then its facts. */
export function partFieldsOf(category: ComponentCategory): readonly PartField[] {
  const counted = isCountedCategory(category) ? [number('count', undefined)] : [];
  const custom = category === 'battery' ? [text('chemistryCustom')] : [];
  return [...counted, ...FIELDS[category], ...custom];
}

type Fact = string | number | null;

/** A line's fact by its key. The census above names only keys the line's own kind holds. */
export function factOf(line: ComponentLine, key: string): Fact {
  const facts: Readonly<Record<string, unknown>> = { ...line };
  const fact = facts[key];
  return typeof fact === 'string' || typeof fact === 'number' ? fact : null;
}

/** The line with one fact changed; an emptied fact is `null`, never an empty string. */
export function withFact(line: ComponentLine, key: string, fact: Fact): ComponentLine {
  const value = typeof fact === 'string' && fact.trim() === '' ? null : fact;
  /* The key is one of the line's own kind (the census), so the kind is unchanged by the spread. */
  return {
    ...line,
    [key]: key === 'phases' && value !== null ? Number(value) : value,
  } as ComponentLine;
}

/** Whether a field is drawn: the chemistry's own words only while the chemistry is `custom`. */
export function isFieldShown(line: ComponentLine, key: string): boolean {
  return key !== 'chemistryCustom' || factOf(line, 'chemistry') === 'custom';
}

/** A brand the view model offers, by shape: its key, its two lines, the schemes it holds. */
export interface PartChoiceFact {
  readonly key: string;
  readonly brand: string;
  /** biome-ignore lint/plugin/copy-prop-type: a fact — the item's specification and warranty, as stored */
  readonly line: string;
  readonly schemes: readonly string[];
  readonly picked: boolean;
}

/** The picker's rows from the brands on offer; `null` while they are still being read. */
export function partPickerOptionsOf(
  choices: readonly PartChoiceFact[] | null,
): ProposalPartPickerProps['options'] {
  if (choices === null) return null;
  return choices.map((choice) => ({
    key: choice.key,
    brand: choice.brand,
    line: choice.line,
    /* The first scheme the item holds is its mark — the one a subsidy-path proposal checks (`F1-34`). */
    ...(choice.schemes[0] === undefined ? {} : { mark: choice.schemes[0] }),
    picked: choice.picked,
  }));
}
