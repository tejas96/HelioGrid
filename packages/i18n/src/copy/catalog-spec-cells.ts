import type { TranslatedText } from '@heliogrid/contracts';
import type { CatalogSpec, ComponentKind } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { addItemFieldWords, addItemPhaseWords } from './catalog-add-item-fields';
import { catalogChemistryOption, catalogTechnology } from './catalog-settings';

type T = Translator['t'];

/** One spec as an item's detail shows it in its grid: the field's name over its value. */
export interface CatalogSpecCell {
  readonly label: TranslatedText;
  readonly value: string;
}

/**
 * The facts an installer sizes and quotes with, per kind, in the grid's order: the headline rating
 * first, then what string sizing and the customer's questions need. An optional fact the item does
 * not carry draws no cell.
 */
const CELLS: { readonly [Kind in ComponentKind]: readonly string[] } = {
  panel: ['watt', 'technology', 'vocV', 'iscA', 'warrantyYears', 'weightKg'],
  inverter: ['acKw', 'phases', 'mppt.count', 'maxDcV', 'efficiencyPct', 'warrantyYears'],
  battery: ['usableKwh', 'chemistry', 'powerKw', 'cycleLife', 'warrantyYears', 'weightKg'],
  micro_inverter: ['ratedAcW', 'warrantyYears'],
  optimiser: ['ratedInputW', 'warrantyYears'],
};

const WARRANTY = /*i18n*/ { id: '{count, plural, one {# year} other {# years}}' };

/** The raw value at a spec's dotted path, or `undefined` where the item does not carry it. */
function valueAt(spec: CatalogSpec, path: string): unknown {
  if (path === 'mppt.count') return spec.kind === 'inverter' ? spec.mppt.count : undefined;
  return (spec as unknown as Readonly<Record<string, unknown>>)[path];
}

function wordOf(t: T, path: string, value: number, number: (n: number) => string) {
  if (path === 'warrantyYears') return t(WARRANTY, { count: value });
  if (path === 'phases') {
    return (
      addItemPhaseWords(t).find((phase) => phase.value === String(value))?.label ?? number(value)
    );
  }
  const { unit } = addItemFieldWords(t, path);
  if (unit === null) return number(value);
  /* A percentage sits against its figure; every other symbol stands a space apart. */
  return unit === '%' ? `${number(value)}%` : `${number(value)} ${unit}`;
}

/**
 * An item's spec as its detail's grid: each cell its field's own name (the add sheet's) over the
 * value in the market's numerals, a symbol unit as written (`CLAUDE.md` §9) and a word in the
 * reader's language.
 */
export function catalogSpecCells(
  t: T,
  spec: CatalogSpec,
  number: (value: number) => string,
): readonly CatalogSpecCell[] {
  return CELLS[spec.kind].flatMap((path) => {
    const label = addItemFieldWords(t, path).label;
    if (path === 'technology' && spec.kind === 'panel') {
      return [{ label, value: catalogTechnology(t, spec.technology) }];
    }
    if (path === 'chemistry' && spec.kind === 'battery') {
      return [{ label, value: catalogChemistryOption(t, spec.chemistry) }];
    }
    const value = valueAt(spec, path);
    return typeof value === 'number' ? [{ label, value: wordOf(t, path, value, number) }] : [];
  });
}
