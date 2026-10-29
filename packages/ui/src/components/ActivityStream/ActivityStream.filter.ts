import type { TranslatedText } from '@heliogrid/contracts';
import type { ActorClassName } from '../ActorClass';
import type { FilterOption } from '../FilterBar';
import { kindOf } from './ActivityStream.kinds';
import type { ActivityEntry, ActivityKindSpec, ActivityStreamWords } from './ActivityStream.types';

/**
 * The `facet` arm of `FilterPanel`'s `FilterDimension`, structurally identical to it. It is spelled
 * here so this folder builds a filter body without importing the panel it feeds — the stream renders
 * no filter UI of its own, and `FilterPanel` owns what a dimension LOOKS like.
 */
export interface ActivityFacetDimension {
  key: string;
  label: TranslatedText;
  kind: 'facet';
  options: FilterOption[];
  counts?: Record<string, number>;
  hint?: TranslatedText;
}

/** `{ [dimension key]: string[] | … }` — `FilterPanel`'s `FilterValue`, read structurally. */
export type ActivityFilterValue = Record<string, unknown>;

export interface ActivityFilterOptions {
  kinds?: Record<string, ActivityKindSpec>;
  includeActors?: boolean;
  /** The two dimensions' names — "Kind" and "Who". */
  kindLabel: TranslatedText;
  actorLabel: TranslatedText;
  /** The stream's own words: the kinds' and actor classes' names, and the actor hint. */
  words: Pick<ActivityStreamWords, 'kind' | 'actor' | 'actorHint'>;
}

const ACTOR_ORDER: ActorClassName[] = ['person', 'agent', 'system', 'customer'];

/**
 * The kind and actor-class dimensions for a `FilterSet` / `FilterPanel`, with live counts — both
 * `facet` kinds, because these are sets and a tablist would lie to a screen reader.
 */
export function filterDimensions(
  entries: ActivityEntry[],
  options: ActivityFilterOptions,
): ActivityFacetDimension[] {
  const kinds = options.kinds ?? {};
  const { words } = options;
  const kindCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  for (const entry of entries) {
    kindCounts[entry.kind] = (kindCounts[entry.kind] ?? 0) + 1;
    if (entry.actorClass !== undefined) {
      actorCounts[entry.actorClass] = (actorCounts[entry.actorClass] ?? 0) + 1;
    }
  }
  const kindOptions: FilterOption[] = Object.keys(kindCounts)
    .map((kind) => ({ value: kind, label: kindOf(kinds, kind, words.kind).label }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const dimensions: ActivityFacetDimension[] = [
    {
      key: 'kind',
      kind: 'facet',
      label: options.kindLabel,
      options: kindOptions,
      counts: kindCounts,
    },
  ];
  if (options.includeActors !== false && Object.keys(actorCounts).length > 1) {
    dimensions.push({
      key: 'actorClass',
      kind: 'facet',
      label: options.actorLabel,
      options: ACTOR_ORDER.filter((name) => (actorCounts[name] ?? 0) > 0).map((name) => ({
        value: name,
        label: words.actor.label[name],
      })),
      counts: actorCounts,
      hint: words.actorHint,
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
