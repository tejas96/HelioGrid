import type { TranslatedText } from '@heliogrid/contracts';
import type { OwnPictureRefusal, OwnPictureSay, PlanUnit } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/**
 * Your picture's words (`T-M05-002d`): the reading pill, the refusals, the North, plan and unit
 * cards, the plan's row in the picture menu, and what the bar says about a picture of your own.
 * Units (mm, cm, m, in, ft) are never translated.
 */
const PICTURE = {
  yourPhoto: /*i18n*/ { id: 'Your photo' },
  yourDroneMap: /*i18n*/ { id: 'Your drone map' },
  ownCredit: /*i18n*/ { id: '{name} · yours' },
  ownDronePlaceless: /*i18n*/ { id: '{sharpness} · place not read' },
  reading: /*i18n*/ { id: 'Reading {name}…' },
  stopReading: /*i18n*/ { id: 'Stop reading' },
  pickAnother: /*i18n*/ { id: 'Pick another' },
  pickFile: /*i18n*/ { id: 'Pick a photo, a drone map or a plan' },
  refusedNotPicture: /*i18n*/ { id: 'This is not a picture or a plan.' },
  refusedBroken: /*i18n*/ { id: 'This file is broken.' },
  refusedPassword: /*i18n*/ { id: 'This PDF has a password.' },
  refusedTooLarge: /*i18n*/ { id: 'This plan is over 20 MB.' },
  refusedTooManyLines: /*i18n*/ {
    id: 'This plan has too many lines. Save its roof floor alone and pick it again.',
  },
  refusedElsewhere: /*i18n*/ { id: 'This map is {distance} km from the pin.' },
  refusedNoPlan: /*i18n*/ { id: 'This file has no plan in it.' },
  refusedNoConnection: /*i18n*/ { id: 'No connection. The file was not kept.' },
  northTitle: /*i18n*/ { id: 'North' },
  turn: /*i18n*/ { id: 'Turn' },
  closeCard: /*i18n*/ { id: 'Close' },
  planTitle: /*i18n*/ { id: 'Plan' },
  seeThrough: /*i18n*/ { id: 'See-through' },
  lockPlan: /*i18n*/ { id: 'Lock the plan' },
  unlockPlan: /*i18n*/ { id: 'Unlock the plan' },
  hidePlan: /*i18n*/ { id: 'Hide the plan' },
  showPlan: /*i18n*/ { id: 'Show the plan' },
  removePlan: /*i18n*/ { id: 'Remove the plan' },
  removePicture: /*i18n*/ { id: 'Remove your picture' },
  planPage: /*i18n*/ { id: 'Page {page} of {pages}' },
  pageBefore: /*i18n*/ { id: 'The page before' },
  pageAfter: /*i18n*/ { id: 'The next page' },
  wrongPage: /*i18n*/ { id: 'Wrong page? Tap › to see the next one.' },
  unitTitle: /*i18n*/ { id: 'The plan’s unit' },
  unitLine: /*i18n*/ { id: 'In {unit} the plan is {long} × {short}.' },
  dragOntoHouse: /*i18n*/ { id: 'Drag it onto the house' },
  movePlan: /*i18n*/ { id: 'Move the plan' },
  turnPlan: /*i18n*/ { id: 'Turn the plan' },
  tapOutline: /*i18n*/ { id: 'Tap an outline to make the roof' },
  tapOutlineOrDraw: /*i18n*/ { id: 'Tap an outline, or draw on the plan with the pencil.' },
  madeFromPlan: /*i18n*/ { id: 'Made from the plan. Every length is the plan’s.' },
  planToSize: /*i18n*/ { id: 'Set one length. It sizes the plan and the roof.' },
  droneInPlace: /*i18n*/ { id: 'Your drone map is in its place. Draw the roof with the pencil.' },
  setOneLength: /*i18n*/ { id: 'Set one length. It sizes the photo and the roof.' },
  photoToSize: /*i18n*/ { id: 'The photo is to size. Drag a corner to fix it.' },
  planLocked: /*i18n*/ { id: 'The plan is locked.' },
  planRemoved: /*i18n*/ { id: 'The plan is removed. Undo brings it back.' },
  onPlanCorner: /*i18n*/ { id: 'On the plan’s corner' },
  onPlanLine: /*i18n*/ { id: 'On the plan’s line' },
  outlineRefused: /*i18n*/ { id: 'That outline is not a roof’s shape.' },
} as const;

const REFUSED: Readonly<Record<Exclude<OwnPictureRefusal, 'elsewhere'>, { readonly id: string }>> =
  {
    not_a_picture: PICTURE.refusedNotPicture,
    broken: PICTURE.refusedBroken,
    password: PICTURE.refusedPassword,
    too_large: PICTURE.refusedTooLarge,
    too_many_lines: PICTURE.refusedTooManyLines,
    no_plan: PICTURE.refusedNoPlan,
    no_connection: PICTURE.refusedNoConnection,
  };

const SAY: Readonly<Record<OwnPictureSay, { readonly id: string }>> = {
  tap_outline: PICTURE.tapOutlineOrDraw,
  made_from_plan: PICTURE.madeFromPlan,
  plan_to_size: PICTURE.planToSize,
  drone_in_place: PICTURE.droneInPlace,
  set_one_length: PICTURE.setOneLength,
  photo_to_size: PICTURE.photoToSize,
  plan_locked: PICTURE.planLocked,
  plan_removed: PICTURE.planRemoved,
};

/** Your picture's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioPictureWords(t: T) {
  return {
    /** The chip's title for a picture of your own: what it is (board 2.1, 3.1). */
    ownTitle: (kind: 'photo' | 'drone') =>
      t(kind === 'photo' ? PICTURE.yourPhoto : PICTURE.yourDroneMap),
    /** Your picture's credit line: its file's name, and whose it is. */
    ownCredit: (name: string) => t(PICTURE.ownCredit, { name }),
    /** A drone map's line when its place was not read; else its sharpness and day are values. */
    ownDronePlaceless: (sharpness: string) => t(PICTURE.ownDronePlaceless, { sharpness }),
    reading: (name: string) => t(PICTURE.reading, { name }),
    stopReading: t(PICTURE.stopReading),
    pickAnother: t(PICTURE.pickAnother),
    pickFile: t(PICTURE.pickFile),
    /** Why a file is not laid; a map of another place says how far, already formatted. */
    pictureRefused: (refusal: OwnPictureRefusal, distanceKm: string | null): TranslatedText =>
      refusal === 'elsewhere'
        ? t(PICTURE.refusedElsewhere, { distance: distanceKm ?? '' })
        : t(REFUSED[refusal]),
    northTitle: t(PICTURE.northTitle),
    turn: t(PICTURE.turn),
    closeCard: t(PICTURE.closeCard),
    planTitle: t(PICTURE.planTitle),
    seeThrough: t(PICTURE.seeThrough),
    lockPlan: (locked: boolean) => (locked ? t(PICTURE.unlockPlan) : t(PICTURE.lockPlan)),
    hidePlan: (hidden: boolean) => (hidden ? t(PICTURE.showPlan) : t(PICTURE.hidePlan)),
    removePlan: t(PICTURE.removePlan),
    removePicture: t(PICTURE.removePicture),
    planPage: (page: number, pages: number) => t(PICTURE.planPage, { page, pages }),
    pageBefore: t(PICTURE.pageBefore),
    pageAfter: t(PICTURE.pageAfter),
    wrongPage: t(PICTURE.wrongPage),
    unitTitle: t(PICTURE.unitTitle),
    /** A unit's own short name, never translated: mm, cm, m, in, ft. */
    unitLabel: (unit: PlanUnit) => shownAsSent(unit),
    /** "In mm the plan is 7.79 × 7.60 m." — the two sizes already in the reader's unit. */
    unitLine: (unit: PlanUnit, long: string, short: string) =>
      t(PICTURE.unitLine, { unit, long, short }),
    dragOntoHouse: t(PICTURE.dragOntoHouse),
    movePlan: t(PICTURE.movePlan),
    turnPlan: t(PICTURE.turnPlan),
    tapOutline: t(PICTURE.tapOutline),
    tapOutlineOrDraw: t(PICTURE.tapOutlineOrDraw),
    madeFromPlan: t(PICTURE.madeFromPlan),
    droneInPlace: t(PICTURE.droneInPlace),
    setOneLength: t(PICTURE.setOneLength),
    photoToSize: t(PICTURE.photoToSize),
    planLocked: t(PICTURE.planLocked),
    planRemoved: t(PICTURE.planRemoved),
    onPlanCorner: t(PICTURE.onPlanCorner),
    onPlanLine: t(PICTURE.onPlanLine),
    outlineRefused: t(PICTURE.outlineRefused),
    /** The bar's line about your picture, by what the studio says now. */
    ownSay: (say: OwnPictureSay): TranslatedText => t(SAY[say]),
  };
}

export type StudioPictureWords = ReturnType<typeof studioPictureWords>;
