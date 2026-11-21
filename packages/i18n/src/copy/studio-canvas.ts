import type { TranslatedText } from '@heliogrid/contracts';
import type { NoPictureReason, StepLock, StudioStep } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { MAP_SURFACE } from './map-surface';
import { designPageWords } from './site-details';
import { studioLengthWords } from './studio-length';
import { studioRoofWords } from './studio-roof';

type T = Translator['t'];

const CANVAS = {
  back: /*i18n*/ { id: 'Back' },
  saved: /*i18n*/ { id: 'Saved' },
  saving: /*i18n*/ { id: 'Saving' },
  offline: /*i18n*/ { id: 'No connection · not saved' },
  failed: /*i18n*/ { id: 'Not saved' },
  tryAgain: /*i18n*/ { id: 'Try again' },
  viewOnly: /*i18n*/ { id: 'View only' },
  editingNow: /*i18n*/ { id: 'View only · {name} is editing' },
  savedFirst: /*i18n*/ { id: '{name} saved this design at {time}. Your last change is not saved.' },
  savedFirstUnknown: /*i18n*/ {
    id: 'Someone saved this design at {time}. Your last change is not saved.',
  },
  openTheirs: /*i18n*/ { id: 'Open their version' },
  closed: /*i18n*/ { id: 'This lead is closed. Changes are not saved.' },
  opening: /*i18n*/ { id: 'Opening the studio' },

  site: /*i18n*/ { id: 'Site' },
  changeSite: /*i18n*/ { id: 'Site: change the place and details' },
  siteWaitsForSave: /*i18n*/ {
    id: 'Your last change is not saved yet. Site details open once it is.',
  },
  roof: /*i18n*/ { id: 'Roof' },
  objects: /*i18n*/ { id: 'Objects' },
  panels: /*i18n*/ { id: 'Panels' },
  wiring: /*i18n*/ { id: 'Wiring' },
  result: /*i18n*/ { id: 'Result' },
  steps: /*i18n*/ { id: 'Steps' },
  stepNumbered: /*i18n*/ { id: '{number} · {step}' },
  nextStep: /*i18n*/ { id: 'Next step: {step}' },
  previousStep: /*i18n*/ { id: 'Back to {step}' },
  stepDone: /*i18n*/ { id: 'Done' },
  stepsSoFar: /*i18n*/ { id: 'Step {number} of {total}' },
  needsRoof: /*i18n*/ { id: 'Draw a roof first' },
  needsEarlierStep: /*i18n*/ { id: 'Finish the step before first' },

  skyPicture: /*i18n*/ { id: 'Sky picture' },
  yourPicture: /*i18n*/ { id: 'Your picture' },
  noPicture: /*i18n*/ { id: 'No picture' },
  pictureLabel: /*i18n*/ { id: 'Picture: {name}' },
  fromGoogle: /*i18n*/ { id: 'Google' },
  skyLine: /*i18n*/ { id: 'Satellite · {sharpness} a pixel' },
  skyLineTaken: /*i18n*/ { id: 'Satellite · {sharpness} a pixel · taken {date}' },
  skyLoading: /*i18n*/ { id: 'Loading the sky picture' },
  yourLine: /*i18n*/ { id: 'Photo, drone map or plan, from above' },
  yourComing: /*i18n*/ { id: 'Adding your own picture is coming soon' },
  noLine: /*i18n*/ { id: 'Type the size instead' },
  pictureGuide: /*i18n*/ { id: 'The picture is a guide. Lengths you set are the true size.' },
  pickedNone: /*i18n*/ { id: 'No picture: draw the roof on the grid.' },
  notSetUp: /*i18n*/ { id: 'No sky picture is set up yet. Draw the roof on the grid.' },
  notAnswered: /*i18n*/ { id: 'The sky picture did not load. Draw the roof on the grid.' },
  notCovered: /*i18n*/ { id: 'There is no sky picture of this place. Draw the roof on the grid.' },
  pictureUpdated: /*i18n*/ { id: 'Picture updated · check the outline' },
  pictureChecked: /*i18n*/ { id: 'Checked' },

  view: /*i18n*/ { id: 'View' },
  topView: /*i18n*/ { id: 'Top view' },
  threeDView: /*i18n*/ { id: '3D view' },
  fromNorth: /*i18n*/ { id: 'From the north' },
  fromEast: /*i18n*/ { id: 'From the east' },
  fromSouth: /*i18n*/ { id: 'From the south' },
  fromWest: /*i18n*/ { id: 'From the west' },
  lengths: /*i18n*/ { id: 'Lengths' },
  metres: /*i18n*/ { id: 'Metres' },
  feet: /*i18n*/ { id: 'Feet' },
  undo: /*i18n*/ { id: 'Undo' },
  redo: /*i18n*/ { id: 'Redo' },
  pin: /*i18n*/ { id: 'Pin' },
  backToPin: /*i18n*/ { id: 'Back to the pin' },
  north: /*i18n*/ { id: 'North' },
  // The north arrow on a map: the one letter for North.
  northLetter: /*i18n*/ { id: 'N' },
  mapKeys: /*i18n*/ {
    id: 'Map. Arrow keys move it, plus and minus zoom, and 0 goes back to the pin.',
  },

  drawMyself: /*i18n*/ { id: 'Draw myself' },
  drawOnGrid: /*i18n*/ { id: 'Draw on the grid' },
  drawRoof: /*i18n*/ { id: 'Draw a roof' },
  roofNotSetUp: /*i18n*/ { id: '{place} · roof not set up yet' },
  roofNotSetUpNoPlace: /*i18n*/ { id: 'Roof not set up yet' },
  addObjects: /*i18n*/ { id: 'Add roof objects' },
  objectsComing: /*i18n*/ { id: 'Adding roof objects is the next step. It is coming soon.' },
  noScene: /*i18n*/ { id: 'The 3D view cannot start on this device. Try another browser.' },
} as const;

const STEP_NAME = {
  site: CANVAS.site,
  roof: CANVAS.roof,
  objects: CANVAS.objects,
  panels: CANVAS.panels,
  wiring: CANVAS.wiring,
  result: CANVAS.result,
} as const satisfies Record<StudioStep, unknown>;

const STEP_LOCK = {
  needs_roof: CANVAS.needsRoof,
  needs_earlier_step: CANVAS.needsEarlierStep,
} as const satisfies Record<StepLock, unknown>;

const NO_PICTURE = {
  picked: CANVAS.pickedNone,
  not_set_up: CANVAS.notSetUp,
  not_answered: CANVAS.notAnswered,
  not_covered: CANVAS.notCovered,
} as const satisfies Record<NoPictureReason, unknown>;

/** The studio's canvas (`T-M05-002a`): its bar, step rail, picture chip, tools and states. */
export function studioCanvasWords(t: T) {
  return {
    /** The studio's title: the site's own name as the company wrote it, else "Design 2". */
    designName: (siteName: string | null, ordinal: number): TranslatedText =>
      siteName === null ? designPageWords(t).named(ordinal) : shownAsSent(siteName),
    back: t(CANVAS.back),
    saved: t(CANVAS.saved),
    saving: t(CANVAS.saving),
    offline: t(CANVAS.offline),
    failed: t(CANVAS.failed),
    tryAgain: t(CANVAS.tryAgain),
    viewOnly: t(CANVAS.viewOnly),
    /** "View only · Priya is editing". */
    editingNow: (name: string) => t(CANVAS.editingNow, { name }),
    /** Who saved first, and when: a name and a time already in the company's own format. */
    savedFirst: (name: string | null, time: string) =>
      name === null || name === ''
        ? t(CANVAS.savedFirstUnknown, { time })
        : t(CANVAS.savedFirst, { name, time }),
    openTheirs: t(CANVAS.openTheirs),
    closed: t(CANVAS.closed),
    opening: t(CANVAS.opening),
    steps: t(CANVAS.steps),
    step: (step: StudioStep): TranslatedText => t(STEP_NAME[step]),
    /** "2 · Roof": a step with its number on the switcher and in its list. */
    stepNumbered: (number: number, step: StudioStep): TranslatedText =>
      t(CANVAS.stepNumbered, { number, step: t(STEP_NAME[step]) }),
    nextStep: (step: StudioStep): TranslatedText =>
      t(CANVAS.nextStep, { step: t(STEP_NAME[step]) }),
    previousStep: (step: StudioStep): TranslatedText =>
      t(CANVAS.previousStep, { step: t(STEP_NAME[step]) }),
    stepDone: t(CANVAS.stepDone),
    /** "Step 2 of 6": how far the design has come, in words beside the switcher's border. */
    stepsSoFar: (number: number, total: number): TranslatedText =>
      t(CANVAS.stepsSoFar, { number, total }),
    stepLock: (lock: StepLock): TranslatedText => t(STEP_LOCK[lock]),
    /** What a screen reader says for the site step: its word first, then that a press changes it. */
    changeSite: t(CANVAS.changeSite),
    /** Why the site step waits: leaving now would lose a change still on its way. */
    siteWaitsForSave: t(CANVAS.siteWaitsForSave),
    skyPicture: t(CANVAS.skyPicture),
    yourPicture: t(CANVAS.yourPicture),
    noPicture: t(CANVAS.noPicture),
    pictureLabel: (name: string) => t(CANVAS.pictureLabel, { name }),
    /** The provider's name on the chip; one a newer api learned shows as sent. */
    source: (source: string) => (source === 'google' ? t(CANVAS.fromGoogle) : shownAsSent(source)),
    /** "Satellite · 14 cm a pixel · taken Oct 2025" — the sharpness and date already formatted. */
    skyLine: (sharpness: string, date: string | null) =>
      date === null
        ? t(CANVAS.skyLine, { sharpness })
        : t(CANVAS.skyLineTaken, { sharpness, date }),
    skyLoading: t(CANVAS.skyLoading),
    yourLine: t(CANVAS.yourLine),
    yourComing: t(CANVAS.yourComing),
    noLine: t(CANVAS.noLine),
    pictureGuide: t(CANVAS.pictureGuide),
    noPictureWhy: (reason: NoPictureReason): TranslatedText => t(NO_PICTURE[reason]),
    pictureUpdated: t(CANVAS.pictureUpdated),
    pictureChecked: t(CANVAS.pictureChecked),
    view: t(CANVAS.view),
    topView: t(CANVAS.topView),
    threeDView: t(CANVAS.threeDView),
    fromNorth: t(CANVAS.fromNorth),
    fromEast: t(CANVAS.fromEast),
    fromSouth: t(CANVAS.fromSouth),
    fromWest: t(CANVAS.fromWest),
    lengths: t(CANVAS.lengths),
    metres: t(CANVAS.metres),
    feet: t(CANVAS.feet),
    undo: t(CANVAS.undo),
    redo: t(CANVAS.redo),
    pin: t(CANVAS.pin),
    zoomIn: t(MAP_SURFACE.zoomIn),
    zoomOut: t(MAP_SURFACE.zoomOut),
    backToPin: t(CANVAS.backToPin),
    north: t(CANVAS.north),
    /** The north arrow's one letter. */
    northLetter: t(CANVAS.northLetter),
    /** The map's own name for a screen reader, with the keys that move it. */
    mapKeys: t(CANVAS.mapKeys),
    drawMyself: t(CANVAS.drawMyself),
    drawOnGrid: t(CANVAS.drawOnGrid),
    drawRoof: t(CANVAS.drawRoof),
    /** "Vishrambag, Sangli · roof not set up yet". */
    roofNotSetUp: (place: string | null) =>
      place === null ? t(CANVAS.roofNotSetUpNoPlace) : t(CANVAS.roofNotSetUp, { place }),
    addObjects: t(CANVAS.addObjects),
    objectsComing: t(CANVAS.objectsComing),
    ...studioRoofWords(t),
    ...studioLengthWords(t),
    noScene: t(CANVAS.noScene),
  };
}

export type StudioCanvasWords = ReturnType<typeof studioCanvasWords>;
