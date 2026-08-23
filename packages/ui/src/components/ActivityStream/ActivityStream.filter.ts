import type { ActorClassName } from '../ActorClass';
import { ACTOR_CLASSES } from '../ActorClass';
import type { FilterOption } from '../FilterBar';
import { kindOf } from './ActivityStream.kinds';
import type { ActivityEntry, ActivityKindSpec } from './ActivityStream.types';

/**
 * The `facet` arm of `FilterPanel`'s `FilterDimension`, structurally identical to it. It is spelled
 * here so this folder builds a filter body without importing the panel it feeds — the stream renders
 * no filter UI of its own, and `FilterPanel` owns what a dimension LOOKS like.
 */
export interface ActivityFacetDimension {
  key: string;
  label: string;
  kind: 'facet';
  options: FilterOption[];
  counts?: Record<string, number>;
  hint?: string;
}

/** `{ [dimension key]: string[] | … }` — `FilterPanel`'s `FilterValue`, read structurally. */
export type ActivityFilterValue = Record<string, unknown>;

export interface ActivityFilterOptions {
  kinds?: Record<string, ActivityKindSpec>;
  includeActors?: boolean;
  kindLabel?: string;
  actorLabel?: string;
}

const ACTOR_ORDER: ActorClassName[] = ['person', 'agent', 'system', 'customer'];

/**
 * The kind and actor-class dimensions for a `FilterSet` / `FilterPanel`, with live counts — both
 * `facet` kinds, because these are sets and a tablist would lie to a screen reader.
 */
export function filterDimensions(
  entries: ActivityEntry[] = [],
  options: ActivityFilterOptions = {},
): ActivityFacetDimension[] {
  const kinds = options.kinds ?? {};
  const kindCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  for (const entry of entries) {
    kindCounts[entry.kind] = (kindCounts[entry.kind] ?? 0) + 1;
    if (entry.actorClass !== undefined) {
      actorCounts[entry.actorClass] = (actorCounts[entry.actorClass] ?? 0) + 1;
    }
  }
  const kindOptions: FilterOption[] = Object.keys(kindCounts)
    .map((kind) => ({ value: kind, label: kindOf(kinds, kind).label }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const dimensions: ActivityFacetDimension[] = [
    {
      key: 'kind',
      kind: 'facet',
      label: options.kindLabel ?? 'Kind',
      options: kindOptions,
      counts: kindCounts,
    },
  ];
  if (options.includeActors !== false && Object.keys(actorCounts).length > 1) {
    dimensions.push({
      key: 'actorClass',
      kind: 'facet',
      label: options.actorLabel ?? 'Who',
      options: ACTOR_ORDER.filter((name) => (actorCounts[name] ?? 0) > 0).map((name) => ({
        value: name,
        label: ACTOR_CLASSES[name].label,
      })),
      counts: actorCounts,
      hint: 'The agent and the system are different actors, and so is the customer.',
    });
  }
  return dimensions;
}

const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** Applies a `FilterValue` from those dimensions. Pure, so a screen can filter before paging. */
export function applyFilter(
  entries: ActivityEntry[] = [],
  value: ActivityFilterValue = {},
): ActivityEntry[] {
  const kindsOn = asStrings(value.kind);
  const actorsOn = asStrings(value.actorClass);
  if (kindsOn.length === 0 && actorsOn.length === 0) return entries;
  return entries.filter(
    (entry) =>
      (kindsOn.length === 0 || kindsOn.includes(entry.kind)) &&
      (actorsOn.length === 0 || actorsOn.includes(entry.actorClass)),
  );
}
