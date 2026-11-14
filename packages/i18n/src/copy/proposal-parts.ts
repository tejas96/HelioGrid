import type { TranslatedText } from '@heliogrid/contracts';
import type { ComponentCategory, ComponentLine } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { catalogChemistryOption, catalogTechnology } from './catalog-settings';

/**
 * What goes on the roof, in words (`M06-27`, `M06-29`): a category's name, how many, and what one
 * line prints — its own specification and warranty, never a fact the line does not hold. The
 * picker, the document and the customer's page read these, so a part reads the same on all three.
 */

type T = Translator['t'];

const KIND: Record<ComponentCategory, { id: string }> = {
  panel: /*i18n*/ { id: 'Solar panels' },
  inverter: /*i18n*/ { id: 'Inverter' },
  cable: /*i18n*/ { id: 'Cables' },
  electrical: /*i18n*/ { id: 'Electrical' },
  structure: /*i18n*/ { id: 'Structure' },
  battery: /*i18n*/ { id: 'Battery' },
};

const PARTS = {
  or: /*i18n*/ { id: 'or' },
  pick: /*i18n*/ { id: 'Pick a brand' },
  notPicked: /*i18n*/ { id: 'Not picked yet — left out until you pick' },
  pickKind: /*i18n*/ { id: 'Pick {kind}' },
  panels: /*i18n*/ { id: '{count, plural, one {# panel} other {# panels}}' },
  units: /*i18n*/ { id: '{count, plural, one {# unit} other {# units}}' },
  wattPeak: /*i18n*/ { id: '{watts} Wp' },
  kilowatts: /*i18n*/ { id: '{size} kW' },
  kilowattHours: /*i18n*/ { id: '{size} kWh' },
  singlePhase: /*i18n*/ { id: 'single phase' },
  threePhase: /*i18n*/ { id: 'three phase' },
  weightPerKw: /*i18n*/ { id: '{weight} kg per kW' },
} as const;

/** What the parts' words are built over: the market's own names and its number format. */
export interface ProposalPartsFacts {
  /** A certification scheme's name, from the market pack — `DCR`. */
  readonly schemeName: (scheme: string) => string;
  /** A number in the market's grouping, as the format prints it. */
  readonly numberText: (value: number) => string;
}

/** Between two facts of one line: a mark, not a word. */
const DOT = ' · ';

type Line<C extends ComponentCategory> = Extract<ComponentLine, { readonly category: C }>;
type Printed = readonly (string | null)[];

/** A figure with its unit, or nothing where the line holds no figure. */
function measured(
  t: T,
  facts: ProposalPartsFacts,
  unit: { id: string },
  slot: string,
  value: number | null,
): string | null {
  return value === null ? null : t(unit, { [slot]: facts.numberText(value) });
}

/** What each category prints, in print order — each a fact of the line, none invented (`M06-29`). */
const PRINTED: {
  readonly [C in ComponentCategory]: (t: T, facts: ProposalPartsFacts, line: Line<C>) => Printed;
} = {
  panel: (t, facts, line) => [
    measured(t, facts, PARTS.wattPeak, 'watts', line.wattPeak),
    line.technology === null ? null : catalogTechnology(t, line.technology),
    line.warranty,
  ],
  inverter: (t, facts, line) => [
    measured(t, facts, PARTS.kilowatts, 'size', line.capacityKw),
    line.phases === null ? null : t(line.phases === 1 ? PARTS.singlePhase : PARTS.threePhase),
    line.warranty,
  ],
  cable: (_t, _facts, line) => [line.cableType, line.specification, line.warranty],
  electrical: (_t, _facts, line) => [line.includes, line.standard],
  structure: (t, facts, line) => [
    line.standard,
    measured(t, facts, PARTS.weightPerKw, 'weight', line.weightPerKw),
    line.warranty,
  ],
  battery: (t, facts, line) => [
    measured(t, facts, PARTS.kilowattHours, 'size', line.capacityKwh),
    line.chemistry === 'custom' ? line.chemistryCustom : chemistryWord(t, line.chemistry),
    line.warranty,
  ],
};

function chemistryWord(t: T, chemistry: Line<'battery'>['chemistry']): string | null {
  return chemistry === null ? null : catalogChemistryOption(t, chemistry);
}

/** One line's printed facts: its category's, with the ones it does not hold left out. */
function printFacts(t: T, facts: ProposalPartsFacts, line: ComponentLine): readonly string[] {
  const print = PRINTED[line.category] as (
    t: T,
    facts: ProposalPartsFacts,
    line: ComponentLine,
  ) => Printed;
  return print(t, facts, line).filter((part): part is string => part !== null && part !== '');
}

/** The parts block's words (`packages/ui`'s `ProposalPartsWords`). */
export function proposalPartsWords(t: T, facts: ProposalPartsFacts) {
  return {
    kind: (category: ComponentCategory) => t(KIND[category]),
    count: (category: ComponentCategory, count: number) =>
      t(category === 'panel' ? PARTS.panels : PARTS.units, { count }),
    /** What prints for a line — its specification and warranty; `null` where it holds neither. */
    detail: (line: ComponentLine): string | null => {
      const printed = printFacts(t, facts, line);
      return printed.length === 0 ? null : printed.join(DOT);
    },
    scheme: facts.schemeName,
    or: t(PARTS.or),
    pick: t(PARTS.pick),
    notPicked: t(PARTS.notPicked),
    pickKind: (kind: TranslatedText) => t(PARTS.pickKind, { kind }),
  };
}
