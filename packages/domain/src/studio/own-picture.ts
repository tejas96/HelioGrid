import type { GroundPoint } from './ground';

/**
 * A picture of the company's own (`T-M05-002d`): a photo or a drone map the roof is drawn on, or a
 * plan — a DWG, DXF or PDF — laid over the ground as lines. The file decides which; the person never
 * says. A PDF whose plan page is itself a picture is laid as a photo.
 */
export const DESIGN_PICTURE_KINDS = ['photo', 'drone', 'plan'] as const;
export type DesignPictureKind = (typeof DESIGN_PICTURE_KINDS)[number];

/**
 * Where a picture stands: read on the device, it is `ready` when it is added; a DWG or a binary DXF
 * is `reading` until our server has turned it into lines, then `ready` or `refused`.
 */
export const DESIGN_PICTURE_STATES = ['reading', 'ready', 'refused'] as const;
export type DesignPictureState = (typeof DESIGN_PICTURE_STATES)[number];

/** Why our server could not read a plan: the file is broken, or it holds no line to draw. */
export const DESIGN_PICTURE_REFUSALS = ['broken', 'no_lines'] as const;
export type DesignPictureRefusal = (typeof DESIGN_PICTURE_REFUSALS)[number];

/** A stored part of a picture: a piece of picture with the box it covers, or one page's lines. */
export const DESIGN_PICTURE_FILE_ROLES = ['piece', 'lines'] as const;
export type DesignPictureFileRole = (typeof DESIGN_PICTURE_FILE_ROLES)[number];

/** The units a CAD plan is drawn in, and the metres one of each is. */
export const PLAN_UNITS = ['mm', 'cm', 'm', 'in', 'ft'] as const;
export type PlanUnit = (typeof PLAN_UNITS)[number];
export const METRES_PER_PLAN_UNIT: Readonly<Record<PlanUnit, number>> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
  ft: 0.3048,
};

/**
 * Where a laid picture's scale came from: read from the file (a drone map, a CAD plan with its
 * unit), our guess (a photo, a PDF, until a length is set), or a person (a unit picked, a length
 * set). A guessed scale's lengths are `assumed`.
 */
export const PICTURE_SCALE_SOURCES = ['file', 'guess', 'person'] as const;
export type PictureScaleSource = (typeof PICTURE_SCALE_SOURCES)[number];

/** A picture's or a plan's turn and see-through move in these steps. */
export const PICTURE_TURN_STEP_DEG = 5;
export const PLAN_SEE_THROUGH_MIN = 10;
export const PLAN_SEE_THROUGH_MAX = 100;
export const PLAN_SEE_THROUGH_STEP = 5;
export const PLAN_SEE_THROUGH_START = 80;

/**
 * The widest scale a laid picture may carry, in metres per picture unit: from a PDF point of a
 * 1:5000 site plan's tenth down to a millimetre's thousandth, both far past any real file.
 */
export const PICTURE_METRES_PER_UNIT_MIN = 1e-6;
export const PICTURE_METRES_PER_UNIT_MAX = 100;

/**
 * A picture of the company's own as it lies on the site's ground. Its own units — a pixel, a
 * drawing unit, a PDF point — are turned into metres by `metresPerUnit`; the picture's origin
 * lies at `at`, and its up turns `turnDeg` clockwise from north. Laying it changes none of its
 * stored files (`design_picture` never changes).
 */
export interface LaidPicture {
  /** The `design_picture` row it shows. */
  readonly pictureId: string;
  readonly at: GroundPoint;
  /** Degrees clockwise, in (−180, 180]. */
  readonly turnDeg: number;
  readonly metresPerUnit: number;
  readonly scaleFrom: PictureScaleSource;
}

/** A plan laid over the ground: a drawing aid, never in 3D. */
export interface LaidPlan extends LaidPicture {
  /** How much of it shows, in percent: `PLAN_SEE_THROUGH_MIN` to 100. */
  readonly seeThrough: number;
  /** Locked, it cannot move, and taps pass through it to the roof. */
  readonly locked: boolean;
  readonly hidden: boolean;
  /** The PDF page laid, from 1; a DWG or DXF has one. */
  readonly page: number;
}

/**
 * Why a file picked as Your picture is not laid (board 1.4, 3.2): it is no picture or plan, it is
 * broken, its PDF is locked by a password, a CAD plan past its limit or with more lines than one
 * stored file holds, a drone map of another place,
 * a PDF with no plan in it, or the file could not reach our server.
 */
export const OWN_PICTURE_REFUSALS = [
  'not_a_picture',
  'broken',
  'password',
  'too_large',
  'too_many_lines',
  'elsewhere',
  'no_plan',
  'no_connection',
] as const;
export type OwnPictureRefusal = (typeof OWN_PICTURE_REFUSALS)[number];

/** The files the picker offers, by the name's end: what the device reads, and what our server does. */
export const OWN_PICTURE_FILE_ENDS = {
  photo: ['jpg', 'jpeg', 'png', 'webp'],
  drone: ['tif', 'tiff'],
  plan: ['pdf', 'dxf'],
  cad: ['dwg'],
} as const;

/**
 * What the bar says about your picture (board 2.3, 2.4, 3.1, 4.3–5.5): what to do next with it, or
 * what an act just did, until the next change.
 */
export const OWN_PICTURE_SAYS = [
  'tap_outline',
  'made_from_plan',
  'plan_to_size',
  'drone_in_place',
  'set_one_length',
  'photo_to_size',
  'plan_locked',
  'plan_removed',
] as const;
export type OwnPictureSay = (typeof OWN_PICTURE_SAYS)[number];
