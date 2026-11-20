'use client';
import type { DesignDetail } from '@heliogrid/contracts';
import {
  type Coordinate,
  type DesignMount,
  type FormatPack,
  operatorsForArea,
  packLabel,
  pinText,
  type Read,
  readCoordinatePair,
  type SiteForm,
  type SiteFormEvent,
  type SiteLocationMode,
  type SupplyPhase,
  sitePinMoved,
  siteSaveOf,
  type UiLanguage,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { DesignActRefusedError } from '../studio/studio-repository';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { type LeaveAsk, useLeaveAsk } from './use-leave-ask';
import { useSiteForm } from './use-site-form';
import { type SiteMapHeld, useSiteMapLoad } from './use-site-map-load';
import { type SitePlaceSearchState, useSitePlaceSearch } from './use-site-place-search';
import { useTenantId } from './use-tenant-id';

export type { SitePlaceSearchState } from './use-site-place-search';

/** Where Site details leads once the design starts. */
export interface SiteDetailsMoves {
  toDesign(designId: string): void;
}

/** Why the save came back undone: the lead closed meanwhile, or anything else. */
export type SiteSaveFailure = 'host_closed' | 'other';

export interface SiteDetailsShown {
  /** The design as read: who it is for, and whether the reader may change it. */
  readonly detail: DesignDetail;
  readonly form: SiteForm;
  /** The market's states, each by its name in the reader's language. */
  readonly areas: readonly { readonly code: string; readonly name: string }[];
  /** The operators of the picked state, as the market's directory lists them. */
  readonly operators: readonly string[];
  readonly search: SitePlaceSearchState;
  /** The pin as one line, or `null` while none stands. */
  readonly pin: string | null;
  readonly pinMoved: boolean;
  /**
   * The design had its place when the form opened: the form changes a started design's site, its
   * save goes back to the design, and so does Cancel.
   */
  readonly started: boolean;
}

/** The design read — never empty — or `unavailable` when it answered 404. */
export type SiteDetailsRead =
  | Exclude<Read<SiteDetailsShown>, { readonly kind: 'empty' }>
  | { readonly kind: 'unavailable' };

export interface SiteDetailsScreen {
  readonly read: SiteDetailsRead;
  readonly acts: {
    name(name: string): void;
    mount(mount: DesignMount): void;
    mode(mode: SiteLocationMode): void;
    address(address: string): void;
    pickPlace(placeId: string): void;
    latitude(latitude: string): void;
    longitude(longitude: string): void;
    /** The two numbers read together: on Enter, or when the caret leaves the pair. */
    readCoordinates(): void;
    /** A pasted text; `true` when it was a pair of coordinates and was used. */
    paste(text: string): boolean;
    /** The map came to rest: its centre is the pin. */
    movePin(point: Coordinate): void;
    putBack(): void;
    area(code: string): void;
    operator(operator: string): void;
    phase(phase: SupplyPhase): void;
    load(load: string): void;
  };
  readonly map: SiteMapHeld;
  /** *Start design*: the site is saved and the design opens. */
  start(): void;
  readonly saving: boolean;
  readonly failure: SiteSaveFailure | null;
  /** A fact of the form differs from what the site holds: leaving asks first. */
  readonly changed: boolean;
  /** *Leave without saving?* — the platform holds the move and hands it here. */
  readonly leave: LeaveAsk;
}

const samePoint = (left: Coordinate | null, right: Coordinate | null): boolean =>
  left?.latitude === right?.latitude && left?.longitude === right?.longitude;

const saveFailureOf = (failure: unknown): SiteSaveFailure | null => {
  if (failure === null) return null;
  return failure instanceof DesignActRefusedError && failure.refusal === 'host_closed'
    ? 'host_closed'
    : 'other';
};

/**
 * Site details (`SCR-M05-01`, `T-M05-001`), the web's and the phone's alike: the design read, the
 * form over it — every decision domain's `siteFormStep` — the address search, the place a
 * suggestion or a typed point names, and the save that starts the design.
 */
export function useSiteDetailsScreen(
  designId: string,
  market: { readonly formats: FormatPack; readonly language: UiLanguage },
  moves: SiteDetailsMoves,
): SiteDetailsScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { formats, language } = market;
  const key = queryKeys.studio.design(tenantId, designId);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.studio.design(designId, signal),
    enabled: tenantId !== '',
  });
  const held = useSiteForm(designId, query.data, formats.utilities);
  const search = useSitePlaceSearch(held.form);
  const { map, showAgain } = useSiteMapLoad();
  /** A map move came while the save was out and was refused: the map is told the pin again after. */
  const dropped = useRef(false);
  /** The form as it was sent, and the design whose save has landed and whose page is still to open. */
  const sent = useRef<SiteForm | null>(null);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const leave = useLeaveAsk(held.discard);
  const latestMoves = useRef(moves);
  latestMoves.current = moves;
  /* Read once, from the first answer: a save that sets the first pin must not turn the form into a change. */
  const started = useRef<boolean | null>(null);
  if (started.current === null && query.data !== undefined) {
    started.current = query.data.site.pin !== null;
  }

  const save = useAction(
    (body: NonNullable<ReturnType<typeof siteSaveOf>>) =>
      repositories.studio.saveSite(designId, { ...body, capturedAt: new Date().toISOString() }),
    {
      onDone: async (saved) => {
        queryClient.setQueryData(key, saved);
        if (sent.current !== null) held.saved(sent.current);
        const { leadId } = saved.subject;
        await queryClient.invalidateQueries({ queryKey: queryKeys.crm.lead(tenantId, leadId) });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.studio.leadDesigns(tenantId, leadId),
        });
        // The Proposals page orders a design by its last change and names who made it.
        await queryClient.invalidateQueries({ queryKey: queryKeys.proposals.lists(tenantId) });
        setSavedFor(designId);
      },
    },
  );
  // A save that ends with a refused map move behind it: the map rests where it was left, off the pin.
  const saving = save.pending;
  useEffect(() => {
    if (saving || !dropped.current) return;
    dropped.current = false;
    showAgain();
  }, [saving, showAgain]);
  // The design opens from the render that already knows the form is saved: a leave guard fed by
  // `changed` in the same press would hold the move and ask about a save that had just landed.
  useEffect(() => {
    if (savedFor === null) return;
    setSavedFor(null);
    latestMoves.current.toDesign(savedFor);
  }, [savedFor]);

  const typed = (event: SiteFormEvent) => {
    search.typedAgain();
    held.step(event);
  };
  /** A point the person gave becomes the pin; the search is then asked what lies there. */
  const pointGiven = (event: SiteFormEvent) => {
    const before = held.now()?.pin ?? null;
    const pin = held.step(event)?.pin ?? null;
    if (pin === null || samePoint(before, pin)) return;
    void search.at(pin).then((place) => {
      // Used only while that very point still stands.
      if (place !== null && samePoint(held.now()?.pin ?? null, pin)) {
        held.step({ kind: 'point-located', place });
      }
    });
  };

  return {
    read: readOf(query, held.form, search.state, formats, language, started.current === true),
    acts: {
      name: (name) => typed({ kind: 'name-typed', name }),
      mount: (mount) => typed({ kind: 'mount-picked', mount }),
      mode: (mode) => typed({ kind: 'mode-picked', mode }),
      address: (address) => typed({ kind: 'address-typed', address }),
      pickPlace: (placeId) => {
        void search.pick(placeId).then((place) => {
          if (place !== null) held.step({ kind: 'place-found', place });
        });
      },
      latitude: (latitude) => typed({ kind: 'coordinates-typed', latitude }),
      longitude: (longitude) => typed({ kind: 'coordinates-typed', longitude }),
      readCoordinates: () => pointGiven({ kind: 'coordinates-read' }),
      paste: (text) => {
        const point = readCoordinatePair(text);
        if (point === null) return false;
        pointGiven({ kind: 'coordinates-pasted', point });
        return true;
      },
      // A map still settling while the save is out moves nothing: the pin that was sent is the pin.
      movePin: (point) => {
        if (save.isOut()) dropped.current = true;
        else typed({ kind: 'pin-moved', point });
      },
      putBack: () => typed({ kind: 'pin-reset' }),
      area: (code) => typed({ kind: 'area-picked', area: code }),
      operator: (operator) => typed({ kind: 'operator-picked', operator }),
      phase: (phase) => typed({ kind: 'phase-picked', phase }),
      load: (load) => typed({ kind: 'load-typed', load }),
    },
    map,
    start: () => {
      if (save.isOut()) return;
      // On touch the press can land while the pair still holds the caret, before the fields were
      // read on leaving them: the typed numbers are read first, so they are what is saved.
      if (held.now()?.mode === 'coordinates') held.step({ kind: 'coordinates-read' });
      const form = held.now();
      const body = form === null ? null : siteSaveOf(form);
      if (form === null || body === null) return;
      sent.current = form;
      void save.run(body);
    },
    saving: save.pending,
    failure: saveFailureOf(save.failure),
    changed: held.changed,
    leave,
  };
}

/** The screen's read: the design's own, with the form over it once the first read opened one. */
function readOf(
  query: Parameters<typeof recordReadOf<DesignDetail>>[0],
  form: SiteForm | null,
  search: SitePlaceSearchState,
  formats: FormatPack,
  language: UiLanguage,
  started: boolean,
): SiteDetailsRead {
  /* A 404 wins over a design already shown: a lead moved away leaves nothing this reader may see. */
  if (query.error instanceof ApiError && query.error.status === 404) return { kind: 'unavailable' };
  const answer = recordReadOf(query);
  if (answer.kind !== 'ready') return answer;
  if (form === null) return { kind: 'loading' };
  return {
    kind: 'ready',
    value: {
      detail: answer.value,
      form,
      areas: formats.areas.map((area) => ({
        code: area.code,
        name: packLabel(area.name, language),
      })),
      operators: form.area === null ? [] : operatorsForArea(formats.utilities, form.area.area),
      search,
      pin: form.pin === null ? null : pinText(form.pin),
      pinMoved: sitePinMoved(form),
      started,
    },
  };
}
