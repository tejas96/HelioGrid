import type { ComponentLineWire, ResolvedCatalogItemWire, SavedPart } from '@heliogrid/contracts';
import type { SavedPartKind } from '@heliogrid/domain';

/**
 * What step 8's picker offers (`M06-27`, `M06-28`): a resolved catalog brand, or one of the
 * company's saved parts, each as the line a proposal keeps of it (`M06-31`). Pure: no read, no state.
 */

export type Line = ComponentLineWire;

const WATTS_PER_KW = 1000;

/** Words a line stores that only the caller can write in the reader's language. */
export interface PartLabels {
  /** `25-year warranty`. */
  readonly warrantyYears: (years: number) => string;
}

/** A catalog brand, or a saved part, as the line a proposal keeps of it (`M06-31`). */
export interface Offer {
  readonly key: string;
  readonly brand: string;
  readonly line: string;
  readonly schemes: readonly string[];
  readonly asLine: (capacityKw: number | null) => Line;
}

export const BASE = {
  description: null,
  tier: 'assumed',
  savedPartId: null,
  catalogItemId: null,
} as const;

export function catalogOffer(item: ResolvedCatalogItemWire, labels: PartLabels): Offer | null {
  const { spec } = item;
  const brand = `${item.brand} ${item.model}`.trim();
  const warranty =
    'warrantyYears' in spec && spec.warrantyYears !== undefined
      ? labels.warrantyYears(spec.warrantyYears)
      : null;
  const from = {
    ...BASE,
    brand,
    source: item.source,
    catalogItemId: item.id,
    certifications: item.certifications,
    warranty,
  };
  const said = (size: string) => [size, warranty].filter((part) => part !== null).join(' · ');
  const schemes = item.certifications.map((held) => held.scheme);
  const key = `catalog:${item.id}`;
  if (spec.kind === 'panel') {
    return {
      key,
      brand,
      line: said(`${spec.watt} Wp`),
      schemes,
      /* `T-M06-005`: the count follows the size — enough panels to reach it. */
      asLine: (kw) => ({
        ...from,
        category: 'panel',
        count: kw === null ? null : Math.max(1, Math.ceil((kw * WATTS_PER_KW) / spec.watt)),
        wattPeak: spec.watt,
        technology: spec.technology,
      }),
    };
  }
  if (spec.kind === 'inverter') {
    return {
      key,
      brand,
      line: said(`${spec.acKw} kW`),
      schemes,
      asLine: () => ({
        ...from,
        category: 'inverter',
        count: 1,
        capacityKw: spec.acKw,
        inverterType: null,
        phases: spec.phases,
      }),
    };
  }
  if (spec.kind === 'battery') {
    return {
      key,
      brand,
      line: said(`${spec.usableKwh} kWh`),
      schemes,
      asLine: () => ({
        ...from,
        category: 'battery',
        count: null,
        capacityKwh: spec.usableKwh,
        chemistry: spec.chemistry,
        chemistryCustom: null,
      }),
    };
  }
  return null;
}

export function savedOffer(part: SavedPart, kind: SavedPartKind): Offer {
  const from = {
    ...BASE,
    brand: part.brand,
    description: part.description,
    count: null,
    source: 'saved_part' as const,
    savedPartId: part.id,
    certifications: [],
  };
  const lines: Record<SavedPartKind, Line> = {
    cable: {
      ...from,
      category: 'cable',
      cableType: null,
      specification: part.specification,
      warranty: part.warranty,
    },
    electrical: { ...from, category: 'electrical', includes: part.specification, standard: null },
    structure: {
      ...from,
      category: 'structure',
      warranty: part.warranty,
      weightPerKw: null,
      standard: part.specification,
    },
  };
  return {
    key: `saved:${part.id}`,
    brand: part.brand,
    line: [part.specification, part.warranty].filter((one) => one !== null).join(' · '),
    schemes: [],
    asLine: () => lines[kind],
  };
}

export const keyOfLine = (line: Line): string =>
  line.catalogItemId !== null
    ? `catalog:${line.catalogItemId}`
    : line.savedPartId !== null
      ? `saved:${line.savedPartId}`
      : `own:${line.category}:${line.brand}`;

/** What `Add a new part` types (`M06-28`). */
export interface NewPart {
  readonly brand: string;
  readonly specification: string;
  readonly warranty: string;
}

/** A panel, inverter or battery typed on the proposal: its own line (`custom`, `T-M06-026`). */
export function typedLine(category: 'panel' | 'inverter' | 'battery', part: NewPart): Line {
  const warranty = part.warranty.trim() === '' ? null : part.warranty.trim();
  const own = {
    ...BASE,
    brand: part.brand.trim(),
    description: part.specification.trim() === '' ? null : part.specification.trim(),
    source: 'custom' as const,
    certifications: [],
    warranty,
  };
  const lines: Record<typeof category, Line> = {
    panel: { ...own, category: 'panel', count: null, wattPeak: null, technology: null },
    inverter: {
      ...own,
      category: 'inverter',
      count: 1,
      capacityKw: null,
      inverterType: null,
      phases: null,
    },
    battery: {
      ...own,
      category: 'battery',
      count: null,
      capacityKwh: null,
      chemistry: null,
      chemistryCustom: null,
    },
  };
  return lines[category];
}

/** The brands a picker shows: what the proposal holds that the list does not offer, then the list. */
export function choicesOf(offers: readonly Offer[], held: readonly Line[]) {
  const strays = held
    .filter((line) => !offers.some((offer) => offer.key === keyOfLine(line)))
    .map((line) => ({
      key: keyOfLine(line),
      brand: line.brand,
      line: line.description ?? '',
      schemes: line.certifications.map((one) => one.scheme),
      picked: true,
    }));
  return [
    ...strays,
    ...offers.map((offer) => ({
      key: offer.key,
      brand: offer.brand,
      line: offer.line,
      schemes: offer.schemes,
      picked: held.some((line) => keyOfLine(line) === offer.key),
    })),
  ];
}
