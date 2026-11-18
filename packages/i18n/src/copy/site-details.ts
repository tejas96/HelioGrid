import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { mapSurfaceWords } from './map-surface';

type T = Translator['t'];

const SITE = {
  title: /*i18n*/ { id: 'Site details' },
  forWho: /*i18n*/ { id: 'For {name} · {phone}' },
  name: /*i18n*/ { id: 'Site name' },
  mount: /*i18n*/ { id: 'Where do the panels go?' },
  roof: /*i18n*/ { id: 'Roof' },
  ground: /*i18n*/ { id: 'Ground' },
  roofHelp: /*i18n*/ { id: 'A house, a shed or a building.' },
  groundHelp: /*i18n*/ { id: 'Open land, any size.' },
  location: /*i18n*/ { id: 'Location' },
  modeLabel: /*i18n*/ { id: 'Find the place by' },
  byAddress: /*i18n*/ { id: 'Address' },
  byCoordinates: /*i18n*/ { id: 'Coordinates' },
  addressPlaceholder: /*i18n*/ { id: 'Type the address' },
  latitude: /*i18n*/ { id: 'Latitude' },
  longitude: /*i18n*/ { id: 'Longitude' },
  pickPlace: /*i18n*/ { id: 'Pick a place from the list.' },
  typeNumbers: /*i18n*/ { id: 'Type or paste the two numbers.' },
  found: /*i18n*/ { id: 'Found. Check the pin on the map.' },
  pointNoAddress: /*i18n*/ { id: 'Point set. This point has no address yet.' },
  pointSet: /*i18n*/ { id: 'Point set. Check the pin on the map.' },
  faultIncomplete: /*i18n*/ { id: 'Type both numbers: the latitude and the longitude.' },
  faultNotPlace: /*i18n*/ {
    id: 'These are not coordinates. The latitude is from −90 to 90. The longitude is from −180 to 180.',
  },
  faultOutside: /*i18n*/ { id: 'This place is in another country. Pick a place in your own.' },
  searching: /*i18n*/ { id: 'Searching' },
  noPlace: /*i18n*/ { id: 'No place found. Check the spelling, or use Coordinates.' },
  searchUnavailable: /*i18n*/ { id: 'Search is not available now. Use Coordinates.' },
  placesLabel: /*i18n*/ { id: 'Places that match' },
  pinRoof: /*i18n*/ { id: 'Pin the roof on the map' },
  pinLand: /*i18n*/ { id: 'Pin the land on the map' },
  mapWaits: /*i18n*/ { id: 'The map shows here when the location is set' },
  pinAt: /*i18n*/ { id: 'Pin: {pin}' },
  pinHint: /*i18n*/ { id: 'Drag the map until the pin is on the right place.' },
  pinMoved: /*i18n*/ { id: 'Moved' },
  putBack: /*i18n*/ { id: 'Put it back' },
  biggerMap: /*i18n*/ { id: 'Open a bigger map' },
  closeMap: /*i18n*/ { id: 'Close the map' },
  usePoint: /*i18n*/ { id: 'Use this point' },
  connection: /*i18n*/ { id: 'Connection' },
  state: /*i18n*/ { id: 'State' },
  statePlaceholder: /*i18n*/ { id: 'Pick a state' },
  stateFromPlace: /*i18n*/ { id: 'Filled from the location.' },
  operator: /*i18n*/ { id: 'DISCOM' },
  operatorPlaceholder: /*i18n*/ { id: 'Pick one' },
  operatorNeedsState: /*i18n*/ { id: 'State first' },
  operatorOnly: /*i18n*/ { id: 'The only one in {state}. Picked for you.' },
  operatorNone: /*i18n*/ { id: 'No DISCOM is listed for {state}.' },
  closeList: /*i18n*/ { id: 'Close the list' },
  phase: /*i18n*/ { id: 'Supply phase' },
  single: /*i18n*/ { id: '1-phase' },
  three: /*i18n*/ { id: '3-phase' },
  load: /*i18n*/ { id: 'Sanctioned load' },
  loadUnit: /*i18n*/ { id: 'kW' },
  loadLater: /*i18n*/ { id: 'You can add it later. The Wiring step needs it.' },
  nextRoof: /*i18n*/ { id: 'Next: you draw the roof.' },
  nextLand: /*i18n*/ { id: 'Next: you draw the land boundary.' },
  needsLocation: /*i18n*/ { id: 'Set the location first.' },
  cancel: /*i18n*/ { id: 'Cancel' },
  start: /*i18n*/ { id: 'Start design' },
  saveFailed: /*i18n*/ { id: 'That did not save. Check the connection and try again.' },
  leadClosed: /*i18n*/ { id: 'This lead is closed. Reopen it to change its designs.' },
  notFoundTitle: /*i18n*/ { id: 'This design is not here' },
  notFoundLine: /*i18n*/ { id: 'It may have moved to someone else, or its link is wrong.' },
  failedTitle: /*i18n*/ { id: 'The design did not load' },
  failedLine: /*i18n*/ { id: 'Check the connection and try again.' },
  retry: /*i18n*/ { id: 'Try again' },
  loading: /*i18n*/ { id: 'Loading the design' },
  viewOnly: /*i18n*/ { id: 'You can view this design. You cannot change it.' },
  leaveTitle: /*i18n*/ { id: 'Leave without saving?' },
  leaveBody: /*i18n*/ { id: 'Your changes to the site details will be lost.' },
  leaveConfirm: /*i18n*/ { id: 'Discard and leave' },
  keepEditing: /*i18n*/ { id: 'Keep editing' },
  backToLeads: /*i18n*/ { id: 'Back to leads' },
  trail: /*i18n*/ { id: 'Breadcrumb' },
} as const;

/** Every word the Site details form says (`SCR-M05-01`). */
export function siteDetailsWords(t: T) {
  return {
    name: t(SITE.name),
    mount: t(SITE.mount),
    mounts: { roof: t(SITE.roof), ground: t(SITE.ground) },
    mountHelp: { roof: t(SITE.roofHelp), ground: t(SITE.groundHelp) },
    location: t(SITE.location),
    modeLabel: t(SITE.modeLabel),
    modes: { address: t(SITE.byAddress), coordinates: t(SITE.byCoordinates) },
    address: t(SITE.byAddress),
    addressPlaceholder: t(SITE.addressPlaceholder),
    latitude: t(SITE.latitude),
    longitude: t(SITE.longitude),
    pickPlace: t(SITE.pickPlace),
    typeNumbers: t(SITE.typeNumbers),
    found: t(SITE.found),
    pointNoAddress: t(SITE.pointNoAddress),
    pointSet: t(SITE.pointSet),
    fault: {
      incomplete: t(SITE.faultIncomplete),
      not_numbers: t(SITE.faultNotPlace),
      out_of_range: t(SITE.faultNotPlace),
      outside_market: t(SITE.faultOutside),
    },
    searching: t(SITE.searching),
    noPlace: t(SITE.noPlace),
    searchUnavailable: t(SITE.searchUnavailable),
    placesLabel: t(SITE.placesLabel),
    pinLabel: { roof: t(SITE.pinRoof), ground: t(SITE.pinLand) },
    mapWaits: t(SITE.mapWaits),
    pinAt: (pin: string) => t(SITE.pinAt, { pin }),
    pinHint: t(SITE.pinHint),
    pinMoved: t(SITE.pinMoved),
    putBack: t(SITE.putBack),
    biggerMap: t(SITE.biggerMap),
    closeMap: t(SITE.closeMap),
    usePoint: t(SITE.usePoint),
    map: mapSurfaceWords(t),
    connection: t(SITE.connection),
    state: t(SITE.state),
    statePlaceholder: t(SITE.statePlaceholder),
    stateFromPlace: t(SITE.stateFromPlace),
    operator: t(SITE.operator),
    operatorPlaceholder: t(SITE.operatorPlaceholder),
    operatorNeedsState: t(SITE.operatorNeedsState),
    operatorOnly: (state: string) => t(SITE.operatorOnly, { state }),
    operatorNone: (state: string) => t(SITE.operatorNone, { state }),
    closeList: t(SITE.closeList),
    phase: t(SITE.phase),
    phases: { single: t(SITE.single), three: t(SITE.three) },
    load: t(SITE.load),
    loadUnit: t(SITE.loadUnit),
    loadLater: t(SITE.loadLater),
    next: { roof: t(SITE.nextRoof), ground: t(SITE.nextLand) },
    needsLocation: t(SITE.needsLocation),
    cancel: t(SITE.cancel),
    start: t(SITE.start),
  };
}

const DESIGN = {
  named: /*i18n*/ { id: 'Design {number}' },
  holdingTitle: /*i18n*/ { id: 'The studio opens here' },
  holdingRoof: /*i18n*/ { id: 'The next step is to draw the roof. That step is being built.' },
  holdingLand: /*i18n*/ {
    id: 'The next step is to draw the land boundary. That step is being built.',
  },
  needsSite: /*i18n*/ { id: 'Set the location of the site first.' },
  editSite: /*i18n*/ { id: 'Site details' },
  backToLead: /*i18n*/ { id: 'Back to the lead' },
  leads: /*i18n*/ { id: 'Leads' },
  proposals: /*i18n*/ { id: 'Proposals' },
} as const;

/** One design's own page (`SCR-M05-02`): its name, and what stands where the studio will. */
export function designPageWords(t: T) {
  return {
    /** "Design 2". */
    named: (ordinal: number) => t(DESIGN.named, { number: ordinal }),
    holdingTitle: t(DESIGN.holdingTitle),
    /** What comes next for a design with a place — the roof, or the land — or that it needs one. */
    holdingLine: (mount: string, located: boolean) => {
      if (!located) return t(DESIGN.needsSite);
      return t(mount === 'ground' ? DESIGN.holdingLand : DESIGN.holdingRoof);
    },
    editSite: t(DESIGN.editSite),
    backToLead: t(DESIGN.backToLead),
  };
}

/** The page around the form: its title, who it is for, its read states and its leave ask. */
export function siteDetailsPageWords(t: T) {
  return {
    title: t(SITE.title),
    /** "For Anil Sharma · 98765 43210"; the name alone, or nothing, where a part is not known. */
    forWho: (name: string | null, phone: string | null): TranslatedText | null => {
      if (name !== null && phone !== null) return t(SITE.forWho, { name, phone });
      const known = name ?? phone;
      return known === null ? null : shownAsSent(known);
    },
    /** The page before its design is ready: still out, failed with its retry, or not the reader's. */
    states: {
      loading: t(SITE.loading),
      failedTitle: t(SITE.failedTitle),
      failedMessage: t(SITE.failedLine),
      retry: t(SITE.retry),
      goneTitle: t(SITE.notFoundTitle),
      goneMessage: t(SITE.notFoundLine),
      backToList: t(SITE.backToLeads),
    },
    /** The lead as the way back names it: its customer's name, else their number — a fact, shown as it is. */
    leadNamed: (name: string | null, phone: string | null): TranslatedText | null =>
      shownAsSent(name ?? phone ?? undefined) ?? null,
    /** The way-back row's name. */
    trail: t(SITE.trail),
    leads: t(DESIGN.leads),
    /** The trail's start when the Proposals page opened the design (`T-M05-001b`). */
    proposals: t(DESIGN.proposals),
    viewOnly: t(SITE.viewOnly),
    saveFailed: (refused: 'host_closed' | 'other') =>
      t(refused === 'host_closed' ? SITE.leadClosed : SITE.saveFailed),
    leaveTitle: t(SITE.leaveTitle),
    leaveBody: t(SITE.leaveBody),
    leaveConfirm: t(SITE.leaveConfirm),
    keepEditing: t(SITE.keepEditing),
  };
}
