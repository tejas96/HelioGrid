'use client';
import type { PlaceAnswer, PlaceSuggestion } from '@heliogrid/contracts';
import type { Coordinate, SiteForm } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { aKey } from '../client/creation-key';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

/** The address search as the form draws it. */
export type SitePlaceSearchState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'searching' }
  | { readonly kind: 'found'; readonly places: readonly PlaceSuggestion[] }
  | { readonly kind: 'unavailable' };

/** A search is asked for once the typing rests this long, and from this many letters. */
const SEARCH_RESTS_MS = 300;
const SEARCH_FROM_LETTERS = 3;

/** The address the search should be asked for now, or `''` while there is nothing to ask. */
function wantedSearchOf(form: SiteForm | null): string {
  if (form === null || form.mode !== 'address' || form.pin !== null) return '';
  const typed = form.address.trim();
  return typed.length >= SEARCH_FROM_LETTERS ? typed : '';
}

export interface SitePlaceSearch {
  readonly state: SitePlaceSearchState;
  /** The place a suggestion names; `null` when the service did not answer or knows none. */
  pick(placeId: string): Promise<PlaceAnswer['place']>;
  /** What lies at a point; `null` when the service did not answer or knows nothing there. */
  at(point: Coordinate): Promise<PlaceAnswer['place']>;
  /** The person typed again: a search that was not available is tried anew. */
  typedAgain(): void;
}

/**
 * The place search of Site details: suggestions once the typed address rests, the place one names,
 * and what lies at a typed point. A service that is down is the state `unavailable` — typed
 * coordinates still set the place — and never a failure thrown at the form.
 */
export function useSitePlaceSearch(form: SiteForm | null): SitePlaceSearch {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const [asked, setAsked] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  /* One search, from its first letter to the picked place: the map service bills it as one. */
  const session = useRef(aKey());
  const wanted = wantedSearchOf(form);
  useEffect(() => {
    if (wanted === '') return setAsked('');
    const rest = setTimeout(() => setAsked(wanted), SEARCH_RESTS_MS);
    return () => clearTimeout(rest);
  }, [wanted]);
  const suggestions = useQuery({
    queryKey: queryKeys.studio.placeSuggestions(tenantId, asked),
    queryFn: ({ signal }) => repositories.places.suggest(asked, session.current, signal),
    enabled: tenantId !== '' && asked !== '',
  });
  const details = useAction((placeId: string) =>
    repositories.places.details(placeId, session.current),
  );

  const answer = recordReadOf(suggestions);
  const stateOf = (): SitePlaceSearchState => {
    if (unavailable || answer.kind === 'failed') return { kind: 'unavailable' };
    if (details.pending) return { kind: 'searching' };
    if (wanted === '') return { kind: 'idle' };
    if (asked !== wanted || answer.kind !== 'ready') return { kind: 'searching' };
    const { available, suggestions: places } = answer.value;
    return available ? { kind: 'found', places } : { kind: 'unavailable' };
  };
  return {
    state: stateOf(),
    pick: async (placeId) => {
      const answer = await details.run(placeId);
      session.current = aKey();
      const place = answer.kind === 'done' ? answer.output.place : null;
      // A press that sent nothing — another pick is out — changes nothing.
      if (place === null && answer.kind !== 'out') setUnavailable(true);
      return place;
    },
    at: (point) =>
      repositories.places.at(point).then(
        (answer) => answer.place,
        () => null,
      ),
    typedAgain: () => setUnavailable(false),
  };
}
