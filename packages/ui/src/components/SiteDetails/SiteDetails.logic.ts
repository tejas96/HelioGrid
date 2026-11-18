import type { TranslatedText } from '@heliogrid/contracts';
import {
  DESIGN_MOUNTS,
  type DesignMount,
  FIGURE_SLOT,
  SITE_LOCATION_MODES,
  type SiteForm,
  type SiteLocationMode,
  SUPPLY_PHASES,
  type SupplyPhase,
} from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { type LabelRun, labelRunsOf } from '../Button/Button.logic';
import type { MapPin, MapPlacementSpec } from '../MapSurface/MapSurface.types';
import type { SegmentedOption } from '../SegmentedControl/SegmentedControl.types';
import type { SelectOption } from '../Select/Select.types';
import type {
  SiteAreaOption,
  SiteDetailsProps,
  SiteDetailsWords,
  SitePlaceOption,
  SitePlaceSearch,
} from './SiteDetails.types';

/* The inner parts' contracts (Law 7): both halves of a part take the one slice of the form's props. */
export type SiteLocationFieldProps = Pick<
  SiteDetailsProps,
  'form' | 'search' | 'saving' | 'acts' | 'words'
>;
export type SitePinMapProps = Pick<
  SiteDetailsProps,
  'room' | 'form' | 'pin' | 'pinMoved' | 'map' | 'saving' | 'acts' | 'words'
>;
export type SiteConnectionFieldsProps = Pick<
  SiteDetailsProps,
  'room' | 'form' | 'areas' | 'operators' | 'saving' | 'acts' | 'words'
>;
export type SiteFormBarProps = Pick<
  SiteDetailsProps,
  'room' | 'form' | 'saving' | 'failure' | 'acts' | 'words'
>;
export interface SitePlaceListProps {
  readonly list: SitePlaceRows;
  /** The list's spoken name. */
  readonly label: TranslatedText;
  readonly disabled: boolean;
  readonly onPick: (placeId: string) => void;
}
export interface SiteBigMapProps extends Pick<SiteDetailsProps, 'form' | 'pin' | 'map' | 'words'> {
  /** The bigger-map button: where focus lands once the layer has closed. */
  readonly focusAfter: FocusAfter;
}

/**
 * The form's measure where the room is wide, the approved frame's own: no layout token holds it.
 * `SiteDetails.css` states the same number for the web.
 */
export const SITE_MEASURE = 720;

/** The map field's height in each room, as the approved frame draws it. */
export const SITE_MAP_HEIGHT: Readonly<Record<SiteDetailsProps['room'], number>> = {
  wide: 280,
  narrow: 220,
};

/** The most a sanctioned load holds as typed: `99999.99`. */
export const SITE_LOAD_MAX_LENGTH = 8;

/**
 * The map moves under the pin, which stays at the centre. The frame's own pill is left out: the
 * line under the map (`pinHint`) is the one place the form says how.
 */
export const SITE_PIN_PLACEMENT: MapPlacementSpec = { pill: null };

/**
 * The pin stands until *Start design* takes it: pending, never confirmed here. Its words say what
 * it marks ("Roof", "Ground"): nothing on this form waits for the pin.
 */
export function sitePinOf(
  mount: SiteDetailsProps['form']['mount'],
  words: SiteDetailsWords,
): MapPin {
  return { state: 'pending', label: words.mounts[mount] };
}

/** Where the panels go: the two answers, each with its mark. */
export function mountOptionsOf(words: SiteDetailsWords): SegmentedOption[] {
  const glyph = { roof: 'house', ground: 'solar-panel' } as const;
  return DESIGN_MOUNTS.map((mount) => ({
    value: mount,
    label: words.mounts[mount],
    glyph: glyph[mount],
  }));
}

export function modeOptionsOf(words: SiteDetailsWords): SegmentedOption[] {
  return SITE_LOCATION_MODES.map((mode) => ({ value: mode, label: words.modes[mode] }));
}

export function phaseOptionsOf(words: SiteDetailsWords): SegmentedOption[] {
  return SUPPLY_PHASES.map((phase) => ({ value: phase, label: words.phases[phase] }));
}

/* A segmented control hands back a string: one of its own answers, or nothing. */
export function mountOf(value: string): DesignMount | null {
  return DESIGN_MOUNTS.find((mount) => mount === value) ?? null;
}

export function modeOf(value: string): SiteLocationMode | null {
  return SITE_LOCATION_MODES.find((mode) => mode === value) ?? null;
}

export function phaseOf(value: string): SupplyPhase | null {
  return SUPPLY_PHASES.find((phase) => phase === value) ?? null;
}

/** The line under the location: a fault, what was found, or what to do. */
export interface SiteLocationNote {
  readonly tone: 'danger' | 'success' | 'secondary';
  readonly text: TranslatedText;
}

export function locationNoteOf(form: SiteForm, words: SiteDetailsWords): SiteLocationNote {
  if (form.fault !== null) return { tone: 'danger', text: words.fault[form.fault] };
  const byAddress = form.mode === 'address';
  if (form.pin === null) {
    return { tone: 'secondary', text: byAddress ? words.pickPlace : words.typeNumbers };
  }
  // A typed point says only that it stands: the address beside it may be a person's own words,
  // which no search placed there.
  if (!byAddress) {
    return { tone: 'success', text: form.address === '' ? words.pointNoAddress : words.pointSet };
  }
  return { tone: 'success', text: form.address === '' ? words.pointNoAddress : words.found };
}

/** What the list under the address draws: nothing, one quiet line, or the places to pick from. */
export type SitePlaceRows =
  | { readonly kind: 'line'; readonly text: TranslatedText }
  | { readonly kind: 'places'; readonly places: readonly SitePlaceOption[] };

export function placeListOf(
  search: SitePlaceSearch,
  words: SiteDetailsWords,
): SitePlaceRows | null {
  if (search.kind === 'idle') return null;
  if (search.kind === 'searching') return { kind: 'line', text: words.searching };
  if (search.kind === 'unavailable') return { kind: 'line', text: words.searchUnavailable };
  if (search.places.length === 0) return { kind: 'line', text: words.noPlace };
  return { kind: 'places', places: search.places };
}

/** The place Enter picks: the first one found. */
export function firstPlaceOf(search: SitePlaceSearch): string | null {
  return search.kind === 'found' ? (search.places[0]?.placeId ?? null) : null;
}

/**
 * What one change put into a field: the text between what stayed at its start and at its end. A
 * phone reports no paste, so more than one character arriving at once is read as one.
 */
export function insertedOf(previous: string, next: string): string {
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) {
    start += 1;
  }
  let kept = 0;
  while (
    kept < previous.length - start &&
    kept < next.length - start &&
    previous[previous.length - 1 - kept] === next[next.length - 1 - kept]
  ) {
    kept += 1;
  }
  return next.slice(start, next.length - kept);
}

export function areaOptionsOf(areas: readonly SiteAreaOption[]): SelectOption[] {
  return areas.map((area) => ({ value: area.code, label: area.name }));
}

/** The operator's field as the picked state leaves it. */
export interface SiteOperatorField {
  readonly disabled: boolean;
  readonly placeholder: TranslatedText;
  readonly helper: TranslatedText | undefined;
}

export function operatorFieldOf(
  form: SiteForm,
  areas: readonly SiteAreaOption[],
  operators: readonly string[],
  words: SiteDetailsWords,
): SiteOperatorField {
  const code = form.area?.area;
  if (code === undefined) {
    return { disabled: true, placeholder: words.operatorNeedsState, helper: undefined };
  }
  const state = areas.find((area) => area.code === code)?.name ?? code;
  const placeholder = words.operatorPlaceholder;
  if (operators.length === 0) {
    return { disabled: true, placeholder, helper: words.operatorNone(state) };
  }
  const helper = operators.length === 1 ? words.operatorOnly(state) : undefined;
  return { disabled: false, placeholder, helper };
}

/** The pin's line as runs: its figure apart, in mono, where the reader's language puts it. */
export function pinRunsOf(words: SiteDetailsWords, pin: string): readonly LabelRun[] {
  return labelRunsOf(words.pinAt(FIGURE_SLOT), [pin]);
}

/** The bar's line: why the design cannot start yet, or what comes next. */
export function barLineOf(form: SiteForm, words: SiteDetailsWords): TranslatedText {
  return form.pin === null ? words.needsLocation : words.next[form.mount];
}

/**
 * The word beside the pin's figure: that it was moved, how to move it — said only where a live map
 * stands under the pin, since the neutral grid moves nothing — or nothing at all.
 */
export function pinNoteOf(
  pinMoved: boolean,
  liveMap: boolean,
  words: SiteDetailsWords,
): TranslatedText | null {
  if (pinMoved) return words.pinMoved;
  return liveMap ? words.pinHint : null;
}
