import type { AreaRef, Coordinate } from '../format/areas';
import { SUPPLY_PHASES, type SupplyPhase } from '../format/supply-phase';
import type { UtilityDirectory } from '../format/utility';
import {
  type CoordinateFault,
  pinPartText,
  readCoordinatePair,
  readCoordinates,
  roundPin,
} from './coordinates';
import { operatorAfterArea, type StudioSite } from './site';
import { type DesignMount, SITE_NAME_MAX } from './vocabulary';

/**
 * Site details as a person fills them (`T-M05-001`): one form, decided here once for the web and
 * the phone. The reducer owns every decision — what a found place fills, what a moved pin keeps,
 * what a changed state does to the operator; the hook that runs it owns the searches and the save.
 */

/** The two ways a place is given: an address searched for, or two typed numbers. */
export const SITE_LOCATION_MODES = ['address', 'coordinates'] as const;
export type SiteLocationMode = (typeof SITE_LOCATION_MODES)[number];

/** Why the location is not set: the typed numbers are not a place, or the place is not in the market. */
export type SiteLocationFault = CoordinateFault | 'outside_market';

/** A place a search found, as the company's market reads it. */
export interface FoundPlace {
  readonly address: string | null;
  readonly pin: Coordinate;
  /** The market's area the place lies in, or `null` when its region matched none. */
  readonly area: string | null;
  /** `false`: outside the company's market. `null`: the search did not say. */
  readonly inMarket: boolean | null;
}

export interface SiteForm {
  readonly name: string;
  readonly mount: DesignMount;
  readonly mode: SiteLocationMode;
  readonly address: string;
  readonly latitude: string;
  readonly longitude: string;
  /** The place's own point, before the person moved the pin: where *Put it back* returns to. */
  readonly placed: Coordinate | null;
  /** The exact point of the roof or the land — the one fact a design cannot start without. */
  readonly pin: Coordinate | null;
  readonly fault: SiteLocationFault | null;
  readonly area: AreaRef | null;
  /** The area was filled from the found place: its field says so until the person changes it. */
  readonly areaFromPlace: boolean;
  readonly utilityOperator: string | null;
  readonly supplyPhase: SupplyPhase;
  /** The sanctioned load as typed, in kW. */
  readonly sanctionedLoad: string;
}

export type SiteFormEvent =
  | { readonly kind: 'name-typed'; readonly name: string }
  | { readonly kind: 'mount-picked'; readonly mount: DesignMount }
  | { readonly kind: 'mode-picked'; readonly mode: SiteLocationMode }
  | { readonly kind: 'address-typed'; readonly address: string }
  | { readonly kind: 'place-found'; readonly place: FoundPlace }
  /** What a search says of the point the person typed or pasted: the pin stays theirs. */
  | { readonly kind: 'point-located'; readonly place: FoundPlace }
  | { readonly kind: 'coordinates-typed'; readonly latitude?: string; readonly longitude?: string }
  /** The two fields are read together: on Enter, or when the caret leaves the pair. */
  | { readonly kind: 'coordinates-read' }
  | { readonly kind: 'coordinates-pasted'; readonly point: Coordinate }
  | { readonly kind: 'pin-moved'; readonly point: Coordinate }
  | { readonly kind: 'pin-reset' }
  | { readonly kind: 'area-picked'; readonly area: string | null }
  | { readonly kind: 'operator-picked'; readonly operator: string | null }
  | { readonly kind: 'phase-picked'; readonly phase: SupplyPhase }
  | { readonly kind: 'load-typed'; readonly load: string };

/** A home's supply, until the person says otherwise. */
const [FIRST_PHASE] = SUPPLY_PHASES;
const LOAD_TYPED = /[^0-9.]/g;
const LOAD_MAX_KW = 100_000;

/** A load as it is typed: digits and the first point. A second point would read as no load at all. */
function loadTyped(typed: string): string {
  const [whole = '', ...parts] = typed.replace(LOAD_TYPED, '').split('.');
  return parts.length === 0 ? whole : `${whole}.${parts.join('')}`;
}

const pinTexts = (pin: Coordinate) => ({
  latitude: pinPartText(pin.latitude),
  longitude: pinPartText(pin.longitude),
});

/** The form a design opens with: the site as its host holds it, the name given once when it has none. */
export function siteFormOf(
  site: StudioSite,
  mount: DesignMount,
  nameWhenNone: string | null,
): SiteForm {
  const { pin } = site;
  return {
    name: (site.name ?? nameWhenNone ?? '').slice(0, SITE_NAME_MAX),
    mount,
    mode: site.address === null && pin !== null ? 'coordinates' : 'address',
    address: site.address ?? '',
    latitude: pin === null ? '' : pinPartText(pin.latitude),
    longitude: pin === null ? '' : pinPartText(pin.longitude),
    placed: pin,
    pin,
    fault: null,
    area: site.area,
    areaFromPlace: false,
    utilityOperator: site.utilityOperator,
    supplyPhase: site.supplyPhase ?? FIRST_PHASE,
    sanctionedLoad: site.sanctionedLoadKw === null ? '' : String(site.sanctionedLoadKw),
  };
}

const noPlace = { placed: null, pin: null } as const;

/** A found place: refused when it is outside the market, else it sets the pin and fills what it knows. */
function withPlace(form: SiteForm, place: FoundPlace, directory: UtilityDirectory): SiteForm {
  if (place.inMarket === false) return { ...form, ...noPlace, fault: 'outside_market' };
  const pin = roundPin(place.pin);
  const located = { ...form, ...pinTexts(pin), placed: pin, pin, fault: null };
  const address = place.address ?? form.address;
  if (place.area === null || place.area === form.area?.area) return { ...located, address };
  return {
    ...located,
    address,
    area: { area: place.area, district: null },
    areaFromPlace: true,
    utilityOperator: operatorAfterArea(directory, place.area, form.utilityOperator),
  };
}

/**
 * What a search says of a point the person gave: refused when it is outside the market; else it
 * fills only what is still empty — an address someone typed is the site's own and is never
 * replaced by the map's words for a point — and never moves the pin.
 */
function withPointLocated(
  form: SiteForm,
  place: FoundPlace,
  directory: UtilityDirectory,
): SiteForm {
  if (place.inMarket === false) return { ...form, ...noPlace, fault: 'outside_market' };
  const address = form.address.trim() === '' ? (place.address ?? '') : form.address;
  if (form.area !== null || place.area === null) return { ...form, address };
  return {
    ...form,
    address,
    area: { area: place.area, district: null },
    areaFromPlace: true,
    utilityOperator: operatorAfterArea(directory, place.area, form.utilityOperator),
  };
}

/** The two typed numbers read as one answer: a point, a named fault, or nothing yet. */
function withCoordinatesRead(form: SiteForm): SiteForm {
  // The fields already show the standing pin — a map move wrote them, shorter than the pin is
  // kept: reading them back is no new answer, and would pull the pin onto the shorter figure.
  if (form.pin !== null) {
    const shown = pinTexts(form.pin);
    if (form.latitude === shown.latitude && form.longitude === shown.longitude) return form;
  }
  // A pair typed whole into one field ("18.5074, 73.8077") is both halves, as a paste is.
  const pair = readCoordinatePair(form.latitude) ?? readCoordinatePair(form.longitude);
  if (pair !== null) return { ...form, ...pinTexts(pair), placed: pair, pin: pair, fault: null };
  const read = readCoordinates(form.latitude, form.longitude);
  if (read.kind === 'empty') return form;
  if (read.kind === 'fault') return { ...form, ...noPlace, fault: read.fault };
  return { ...form, ...pinTexts(read.point), placed: read.point, pin: read.point, fault: null };
}

/** One step of the form. Total: an event that changes nothing returns the form it was given. */
export function siteFormStep(
  form: SiteForm,
  event: SiteFormEvent,
  directory: UtilityDirectory,
): SiteForm {
  switch (event.kind) {
    case 'name-typed':
      return { ...form, name: event.name.slice(0, SITE_NAME_MAX) };
    case 'mount-picked':
      return { ...form, mount: event.mount };
    case 'mode-picked':
      return { ...form, mode: event.mode, fault: null };
    case 'address-typed':
      // A typed address is a new search: the place the last one found no longer stands.
      return { ...form, address: event.address, ...noPlace, fault: null };
    case 'place-found':
      return withPlace(form, event.place, directory);
    case 'point-located':
      return withPointLocated(form, event.place, directory);
    case 'coordinates-typed':
      return {
        ...form,
        latitude: event.latitude ?? form.latitude,
        longitude: event.longitude ?? form.longitude,
        fault: null,
      };
    case 'coordinates-read':
      return withCoordinatesRead(form);
    case 'coordinates-pasted': {
      const pin = roundPin(event.point);
      return { ...form, mode: 'coordinates', ...pinTexts(pin), placed: pin, pin, fault: null };
    }
    case 'pin-moved': {
      const pin = roundPin(event.point);
      return { ...form, ...pinTexts(pin), pin, fault: null };
    }
    case 'pin-reset':
      return form.placed === null ? form : { ...form, ...pinTexts(form.placed), pin: form.placed };
    case 'area-picked':
      return {
        ...form,
        area: event.area === null ? null : { area: event.area, district: null },
        areaFromPlace: false,
        utilityOperator: operatorAfterArea(directory, event.area, form.utilityOperator),
      };
    case 'operator-picked':
      return { ...form, utilityOperator: event.operator };
    case 'phase-picked':
      return { ...form, supplyPhase: event.phase };
    case 'load-typed':
      return { ...form, sanctionedLoad: loadTyped(event.load) };
  }
}

/** The pin stands apart from the place it was set at: *Put it back* has somewhere to return to. */
export function sitePinMoved(form: SiteForm): boolean {
  const { pin, placed } = form;
  if (pin === null || placed === null) return false;
  return pin.latitude !== placed.latitude || pin.longitude !== placed.longitude;
}

/** The typed load as a figure: a number above zero that a site can hold, else none given. */
function loadOf(typed: string): number | null {
  const load = Number(typed);
  return typed.trim() !== '' && Number.isFinite(load) && load > 0 && load <= LOAD_MAX_KW
    ? load
    : null;
}

const typedOrNone = (text: string): string | null => (text.trim() === '' ? null : text.trim());

/** What the form saves, or `null` while it has no pin — the save a design cannot start without. */
export function siteSaveOf(
  form: SiteForm,
): (StudioSite & { readonly pin: Coordinate; readonly mount: DesignMount }) | null {
  if (form.pin === null) return null;
  return {
    name: typedOrNone(form.name),
    address: typedOrNone(form.address),
    pin: form.pin,
    area: form.area,
    utilityOperator: form.utilityOperator,
    supplyPhase: form.supplyPhase,
    sanctionedLoadKw: loadOf(form.sanctionedLoad),
    mount: form.mount,
  };
}
