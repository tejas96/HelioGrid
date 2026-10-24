import {
  type CatalogFilter,
  COMPONENT_KINDS,
  type ComponentKind,
  PANEL_TECHNOLOGIES,
  PANEL_WATT_RANGE,
  type PanelTechnology,
  withKinds,
} from '@heliogrid/domain';
import type { FilterDimension, FilterValue } from '../FilterPanel/FilterPanel.types';
import type { CatalogItemsWords, CatalogRowStatus } from './CatalogItems.types';

/** The filter panel's dimension keys; the panel's value is keyed by them. */
const KEY = {
  source: 'source',
  kind: 'kind',
  wattage: 'wattage',
  technology: 'technology',
  scheme: 'scheme',
  preferred: 'preferred',
  archived: 'archived',
} as const;

const SOURCES = ['platform_item', 'own_item'] as const;
const ANY = 'any';

/**
 * The catalog's filter dimensions (`M01-38`): source, kind, the two panel specs folded under
 * *Panels*, the market's schemes — absent when it declares none — and the two switches.
 */
export function catalogFilterDimensions(
  words: CatalogItemsWords,
  schemes: readonly string[],
): FilterDimension[] {
  const f = words.filterPanel;
  const panelSpecs = { key: KEY.kind, value: 'panel', group: f.panelSpecs };
  const dimensions: FilterDimension[] = [
    {
      key: KEY.source,
      kind: 'facet',
      label: f.source,
      options: [
        { value: 'platform_item', label: f.platform },
        { value: 'own_item', label: f.yourSkus },
      ],
    },
    {
      key: KEY.kind,
      kind: 'facet',
      label: words.kindLabel,
      noun: f.kindNoun,
      options: COMPONENT_KINDS.map((kind) => ({ value: kind, label: words.kinds[kind] })),
    },
    {
      key: KEY.wattage,
      kind: 'range',
      label: f.wattage,
      min: PANEL_WATT_RANGE.min,
      max: PANEL_WATT_RANGE.max,
      step: PANEL_WATT_RANGE.step,
      unit: 'Wp',
      under: panelSpecs,
    },
    {
      key: KEY.technology,
      kind: 'one-of',
      label: f.technology,
      noun: f.technologyNoun,
      allValue: ANY,
      options: [
        { value: ANY, label: f.anyTechnology },
        ...PANEL_TECHNOLOGIES.map((tech) => ({ value: tech, label: words.technologies[tech] })),
      ],
      under: panelSpecs,
    },
  ];
  if (schemes.length > 0) {
    dimensions.push({
      key: KEY.scheme,
      kind: 'facet',
      label: f.scheme,
      options: schemes.map((scheme) => ({ value: scheme, label: scheme })),
    });
  }
  dimensions.push(
    { key: KEY.preferred, kind: 'flag', label: f.preferredOnly, optionLabel: f.preferredOnly },
    { key: KEY.archived, kind: 'flag', label: f.archivedInstead, optionLabel: f.archivedInstead },
  );
  return dimensions;
}

/** The catalog filter as the panel's value. */
export function catalogFilterValue(filter: CatalogFilter): FilterValue {
  const watt =
    filter.wattMin === null && filter.wattMax === null
      ? null
      : ([filter.wattMin ?? PANEL_WATT_RANGE.min, filter.wattMax ?? PANEL_WATT_RANGE.max] as [
          number,
          number,
        ]);
  return {
    [KEY.source]: filter.source === null ? [] : [filter.source],
    [KEY.kind]: [...filter.kinds],
    [KEY.wattage]: watt,
    [KEY.technology]: filter.technology ?? ANY,
    [KEY.scheme]: [...filter.schemes],
    [KEY.preferred]: filter.preferredOnly,
    [KEY.archived]: filter.archived,
  };
}

const listOf = (value: FilterValue[string]): string[] =>
  Array.isArray(value) ? value.map(String) : [];
const isKind = (value: string): value is ComponentKind =>
  (COMPONENT_KINDS as readonly string[]).includes(value);
const isTechnology = (value: unknown): value is PanelTechnology =>
  (PANEL_TECHNOLOGIES as readonly unknown[]).includes(value);

/**
 * The panel's value back as the catalog filter. One source is a filter; both or neither is none.
 * A range at its two ends filters nothing; the panel specs follow *Panels* (`withKinds`).
 */
export function catalogFilterOf(value: FilterValue): CatalogFilter {
  const sources = listOf(value[KEY.source]).filter((s): s is (typeof SOURCES)[number] =>
    (SOURCES as readonly string[]).includes(s),
  );
  const [low, high] = Array.isArray(value[KEY.wattage]) ? (value[KEY.wattage] as number[]) : [];
  const technology = value[KEY.technology];
  const filter: CatalogFilter = {
    source: sources.length === 1 ? (sources[0] ?? null) : null,
    kinds: [],
    wattMin: low === undefined || low <= PANEL_WATT_RANGE.min ? null : low,
    wattMax: high === undefined || high >= PANEL_WATT_RANGE.max ? null : high,
    technology: isTechnology(technology) ? technology : null,
    schemes: listOf(value[KEY.scheme]),
    preferredOnly: value[KEY.preferred] === true,
    archived: value[KEY.archived] === true,
  };
  return withKinds(filter, listOf(value[KEY.kind]).filter(isKind));
}

/** A row's pending or failed line: its words, joined to the act's *Retry* and *Dismiss*. */
export function catalogRowStatesOf(
  words: Readonly<Record<string, { readonly label: string; readonly reason: string }>>,
  acts: Readonly<
    Record<
      string,
      { readonly state: 'saving' } | { readonly state: 'failed'; retry(): void; dismiss(): void }
    >
  >,
): Record<string, CatalogRowStatus> {
  const states: Record<string, CatalogRowStatus> = {};
  for (const [id, row] of Object.entries(acts)) {
    const said = words[id];
    if (said === undefined) continue;
    states[id] =
      row.state === 'failed'
        ? { state: 'failed', ...said, onRetry: row.retry, onDismiss: row.dismiss }
        : { state: 'saving', label: said.label };
  }
  return states;
}

/** A read's status as a body's surface: still out, failed, or in. */
export function surfaceOf(status: 'pending' | 'error' | 'success'): 'loading' | 'error' | 'ready' {
  if (status === 'pending') return 'loading';
  return status === 'error' ? 'error' : 'ready';
}
