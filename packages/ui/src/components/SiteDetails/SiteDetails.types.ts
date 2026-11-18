import type { TranslatedText } from '@heliogrid/contracts';
import type {
  DesignMount,
  SiteForm,
  SiteLocationFault,
  SiteLocationMode,
  SupplyPhase,
} from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { MapSurfaceWords } from '../MapSurface/MapSurface.types';
import type { SurfaceRead } from '../UnavailableNote';

/** One state a site can lie in: the market pack's region code and its name in the reader's language. */
export interface SiteAreaOption {
  readonly code: string;
  /** The region's own name, as the market pack writes it for this language — a fact. */
  readonly name: string;
}

/** One place a typed address matched. */
export interface SitePlaceOption {
  readonly placeId: string;
  /** The place's own words, as the map service names it — facts, never translated. */
  // biome-ignore lint/plugin/copy-prop-type: a place's name from the map service
  readonly title: string;
  // biome-ignore lint/plugin/copy-prop-type: a place's locality from the map service
  readonly line: string;
}

/**
 * The address search as the form draws it: nothing asked yet, an ask out, its matches — none is a
 * state with its own words — or a search that is not available, where typed coordinates still set
 * the place.
 */
export type SitePlaceSearch =
  | { readonly kind: 'idle' }
  | { readonly kind: 'searching' }
  | { readonly kind: 'found'; readonly places: readonly SitePlaceOption[] }
  | { readonly kind: 'unavailable' };

/**
 * The map under the pin. The part draws the frame (`MapSurface`: its states, its fixed centre pin,
 * its controls); the app hands in the map itself — the platform's own SDK — which moves under the
 * pin and reports where its centre came to rest. With no map the frame's neutral grid stands in
 * and the pin is set by the address or the typed numbers alone.
 */
export interface SiteMapSlot {
  /** The platform's live map, centred on the pin; `null` where the app has none to draw. */
  readonly tiles: ReactNode | null;
  readonly read: SurfaceRead;
  /** The bigger map is open: the same map on the whole screen, for a sure pick. */
  readonly big: boolean;
  readonly onBig: () => void;
  readonly onSmall: () => void;
}

/** Every word Site details says, built in `@heliogrid/i18n` (`siteDetailsWords`). */
export interface SiteDetailsWords {
  readonly name: TranslatedText;
  /** "Where do the panels go?", its two answers and what each means. */
  readonly mount: TranslatedText;
  readonly mounts: Readonly<Record<DesignMount, TranslatedText>>;
  readonly mountHelp: Readonly<Record<DesignMount, TranslatedText>>;
  readonly location: TranslatedText;
  /** The switch's spoken name — "Find the place by" — and its two ways. */
  readonly modeLabel: TranslatedText;
  readonly modes: Readonly<Record<SiteLocationMode, TranslatedText>>;
  readonly address: TranslatedText;
  readonly addressPlaceholder: TranslatedText;
  readonly latitude: TranslatedText;
  readonly longitude: TranslatedText;
  /** The line under the location: what to do, or what was found. */
  readonly pickPlace: TranslatedText;
  readonly typeNumbers: TranslatedText;
  readonly found: TranslatedText;
  readonly pointNoAddress: TranslatedText;
  /** A typed point stands: "Point set. Check the pin on the map." */
  readonly pointSet: TranslatedText;
  readonly fault: Readonly<Record<SiteLocationFault, TranslatedText>>;
  readonly searching: TranslatedText;
  readonly noPlace: TranslatedText;
  readonly searchUnavailable: TranslatedText;
  /** The list's spoken name — "Places that match". */
  readonly placesLabel: TranslatedText;
  /** "Pin the roof on the map" / "Pin the land on the map". */
  readonly pinLabel: Readonly<Record<DesignMount, TranslatedText>>;
  readonly mapWaits: TranslatedText;
  /** "Pin: 16.83670, 74.59660" — the figure is a code, shown as it is. */
  readonly pinAt: (pin: string) => TranslatedText;
  readonly pinHint: TranslatedText;
  readonly pinMoved: TranslatedText;
  readonly putBack: TranslatedText;
  readonly biggerMap: TranslatedText;
  readonly closeMap: TranslatedText;
  readonly usePoint: TranslatedText;
  readonly map: MapSurfaceWords;
  readonly connection: TranslatedText;
  readonly state: TranslatedText;
  readonly statePlaceholder: TranslatedText;
  readonly stateFromPlace: TranslatedText;
  readonly operator: TranslatedText;
  readonly operatorPlaceholder: TranslatedText;
  readonly operatorNeedsState: TranslatedText;
  /** "The only one in Goa. Picked for you." */
  readonly operatorOnly: (state: string) => TranslatedText;
  /** "No DISCOM is listed for Sikkim." */
  readonly operatorNone: (state: string) => TranslatedText;
  readonly closeList: TranslatedText;
  readonly phase: TranslatedText;
  readonly phases: Readonly<Record<SupplyPhase, TranslatedText>>;
  readonly load: TranslatedText;
  readonly loadUnit: TranslatedText;
  readonly loadLater: TranslatedText;
  /** The bar: what comes next, or why the design cannot start yet. */
  readonly next: Readonly<Record<DesignMount, TranslatedText>>;
  readonly needsLocation: TranslatedText;
  readonly cancel: TranslatedText;
  readonly start: TranslatedText;
}

/** What each control of the form reports; the screen's hook answers every one. */
export interface SiteDetailsActs {
  readonly onName: (name: string) => void;
  readonly onMount: (mount: DesignMount) => void;
  readonly onMode: (mode: SiteLocationMode) => void;
  readonly onAddress: (address: string) => void;
  readonly onPickPlace: (placeId: string) => void;
  readonly onLatitude: (latitude: string) => void;
  readonly onLongitude: (longitude: string) => void;
  /** The two numbers are one answer: read on Enter, or when the caret leaves the pair. */
  readonly onCoordinatesRead: () => void;
  /** A pasted text; `true` when it was a pair of coordinates and was used. */
  readonly onPaste: (text: string) => boolean;
  readonly onPutBack: () => void;
  readonly onArea: (code: string) => void;
  readonly onOperator: (operator: string) => void;
  readonly onPhase: (phase: SupplyPhase) => void;
  readonly onLoad: (load: string) => void;
  readonly onCancel: () => void;
  readonly onStart: () => void;
}

/**
 * **Site details** (`SCR-M05-01`, `T-M05-001`): the one flat form a design starts with — for a rep
 * at the customer's house who confirms the place before drawing. No cards: one grid, two columns
 * where the room is wide and one where it is narrow, a label above each field and its hint below.
 * Site name and where the panels go; the location by address or by coordinates; the map with its
 * pin as one wide field; the connection under its own overline; and a bar that says what comes
 * next. Only the location is asked for, so *Start design* is off — with its reason beside it —
 * until a pin stands. While the save is out every field and act is inert.
 */
export interface SiteDetailsProps {
  readonly room: 'wide' | 'narrow';
  /**
   * The page's own head — its way back and its title — drawn at the top of the form's column, so
   * the head and the fields stand on one measure. A page whose frame holds the title passes none.
   */
  readonly head?: ReactNode;
  readonly form: SiteForm;
  readonly areas: readonly SiteAreaOption[];
  /** The operators of the picked state, as the market's directory lists them. */
  readonly operators: readonly string[];
  readonly search: SitePlaceSearch;
  /** The pin stands apart from the place it was set at. */
  readonly pinMoved: boolean;
  /** The pin as one line — "16.83670, 74.59660"; `null` while none stands. */
  readonly pin: string | null;
  readonly map: SiteMapSlot;
  readonly saving: boolean;
  /** The save that came back undone, with the sentence saying why. */
  readonly failure: TranslatedText | null;
  readonly acts: SiteDetailsActs;
  readonly words: SiteDetailsWords;
}
