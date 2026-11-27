import type { Roof, StudioDocument } from './document';
import type { History } from './history';
import { ROOF_HEIGHT_STEP_M } from './roof-height';
import { roofKindOf, standsOn } from './roof-kind';
import { type RoofFacts, roofFloorM } from './roof-levels';
import type { RoofHeight } from './roof-parts';
import { sameCorners } from './roof-scene-motion';
import { dataHeightsApply, type SiteDataStamp } from './site-data';

/**
 * A drawn roof stands at its real height (`T-M05-002`, part g): what the height map read inside
 * it — its top above its building's ground — set as the system's value, `derived`. A person's
 * value is never replaced; a reset hands the roof back to the data. A roof on a roof stands its
 * top less the roof under it. The data's heights stand aside where a person said the building
 * changed since that data.
 */

/** What the height map read inside one roof (the kernel's `RoofFit`, as the studio keeps it). */
export type RoofDataRead =
  | {
      readonly kind: 'roof';
      /** Its top — a sloped roof's eave — above its building's ground, in metres. */
      readonly heightM: number;
      readonly slopeDeg: number;
      readonly facingDeg: number | null;
      readonly clear: boolean;
    }
  | { readonly kind: 'no_building' };

/**
 * The height map's reads of a design's roofs, by roof id, the corners each was read at, and the
 * data they came from. A read stands only for a roof at those corners: a roof since moved, or one
 * an Undo put back, is not where it was read.
 */
export interface SiteReads {
  readonly stamp: SiteDataStamp;
  readonly roofs: Readonly<Record<string, RoofDataRead>>;
  /** The roofs as they stood when read. */
  readonly shape: readonly Pick<Roof, 'id' | 'corners'>[];
}

/** The read of a roof as it stands; `undefined` with none, or one made at other corners. */
function readOf(roof: Roof, reads: SiteReads): RoofDataRead | undefined {
  const at = reads.shape.find((one) => one.id === roof.id);
  return at !== undefined && sameCorners(at, roof) ? reads.roofs[roof.id] : undefined;
}

/** A roof's own height under this is a stair room the map read at its deck: it keeps its own. */
const OWN_HEIGHT_MIN_M = 0.3;
const CM = 100;
const toCm = (metres: number) => Math.round(metres * CM) / CM;
/**
 * A height read from the map is kept to the height slider's step: the map is good to about half
 * a metre, and a value off the step could never be stepped back to.
 */
const toStep = (metres: number) =>
  toCm(Math.round(metres / ROOF_HEIGHT_STEP_M) * ROOF_HEIGHT_STEP_M);

const sameStamp = (a: SiteDataStamp | undefined, b: SiteDataStamp) =>
  a !== undefined && a.source === b.source && a.quality === b.quality && a.dataOn === b.dataOn;

/** The design with the data's heights set on every roof whose height is the system's. */
export function withSiteHeights(
  document: StudioDocument,
  reads: SiteReads | null,
  facts: RoofFacts,
): StudioDocument {
  if (reads === null || !dataHeightsApply(document.site, reads.stamp.dataOn)) return document;
  let working = document;
  let changed = false;
  // Roofs a roof stands on first, so a stair room counts from its roof's new height.
  const order = [...document.roofs.keys()].sort(
    (a, b) => depthOf(document, a) - depthOf(document, b),
  );
  for (const index of order) {
    const height = dataHeightOf(working, index, reads, facts);
    if (height === 'keep') continue;
    const roofs = [...working.roofs];
    roofs[index] = { ...(working.roofs[index] as Roof), height };
    working = { ...working, roofs };
    changed = true;
  }
  if (!changed && sameStamp(document.site?.dataStamp, reads.stamp)) return document;
  return { ...working, site: { ...working.site, dataStamp: reads.stamp } };
}

/**
 * The data's height for one roof — `null` where the map reads no building under it, so a height
 * the data set there before stands down — or `'keep'` where it keeps the one it has.
 */
function dataHeightOf(
  document: StudioDocument,
  index: number,
  reads: SiteReads,
  facts: RoofFacts,
): RoofHeight | null | 'keep' {
  const roof = document.roofs[index];
  if (roof === undefined || roof.height?.setBy === 'person') return 'keep';
  if (readOf(roof, reads)?.kind === 'no_building') {
    const fromData = roof.height?.setBy === 'system' && roof.height.tier === 'derived';
    return fromData ? null : 'keep';
  }
  const own = readHeightOf(document, index, reads, facts);
  if (own === null) return 'keep';
  if (roof.height?.metres === own && roof.height.tier === 'derived') return 'keep';
  return { metres: own, setBy: 'system', tier: 'derived' };
}

/** What the map read for one roof, as its own height — whoever set the height it stands at. */
function readHeightOf(
  document: StudioDocument,
  index: number,
  reads: SiteReads,
  facts: RoofFacts,
): number | null {
  const roof = document.roofs[index];
  const read = roof === undefined ? undefined : readOf(roof, reads);
  if (roof === undefined || read === undefined || read.kind !== 'roof') return null;
  const kind = roofKindOf(roof);
  if (kind === 'hole' || kind === 'dormer') return null;
  const under = standsOn(document, roof);
  const floor = under === null ? 0 : roofFloorM(document, under, facts);
  const own = toStep(read.heightM - floor);
  return own < OWN_HEIGHT_MIN_M ? null : own;
}

/**
 * The data's own height for roof `index`, which Reset brings back: `null` with no read of it, for
 * a hole or a dormer, or where a person said the building changed since the data.
 */
export function siteHeightOf(
  document: StudioDocument,
  index: number,
  reads: SiteReads | null,
  facts: RoofFacts,
): number | null {
  if (reads === null || !dataHeightsApply(document.site, reads.stamp.dataOn)) return null;
  return readHeightOf(document, index, reads, facts);
}

/** How the height map sits against a roof's height (board G22), and whether its read was clear. */
export interface SiteFit {
  /** The map's height for the roof, as its own height. */
  readonly mapM: number;
  /** The map above the roof, in metres; below it when negative. */
  readonly byM: number;
  /** The map's read fit the roof well; else the sheet says it is unclear there. */
  readonly clear: boolean;
}

/** The fit of the map against roof `index` standing at `metres`; `null` with no read of it. */
export function siteFitOf(
  document: StudioDocument,
  index: number,
  metres: number,
  reads: SiteReads | null,
  facts: RoofFacts,
): SiteFit | null {
  const mapM = siteHeightOf(document, index, reads, facts);
  const roof = document.roofs[index];
  const read = roof === undefined || reads === null ? undefined : readOf(roof, reads);
  if (mapM === null || read?.kind !== 'roof') return null;
  return { mapM, byM: toCm(mapM - metres), clear: read.clear };
}

/** How many roofs a roof stands on, down to the ground. */
function depthOf(document: StudioDocument, index: number): number {
  let depth = 0;
  let roof = document.roofs[index];
  const seen = new Set<number>([index]);
  while (roof !== undefined) {
    const under = standsOn(document, roof);
    if (under === null || seen.has(under)) break;
    seen.add(under);
    depth += 1;
    roof = document.roofs[under];
  }
  return depth;
}

/**
 * Every state of the history with the data's heights: Undo and Redo move between a person's
 * changes, never back to before the data arrived. Each roof takes only a read made at its own
 * corners, so a state with the roof elsewhere keeps the height it had there. The history is handed
 * back as it was when no state changes, so nothing is saved for a read alone.
 */
export function historyWithSiteHeights(
  history: History<StudioDocument>,
  reads: SiteReads | null,
  facts: RoofFacts,
): History<StudioDocument> {
  const present = withSiteHeights(history.present, reads, facts);
  const past = history.past.map((state) => withSiteHeights(state, reads, facts));
  const future = history.future.map((state) => withSiteHeights(state, reads, facts));
  const same =
    present === history.present &&
    past.every((state, i) => state === history.past[i]) &&
    future.every((state, i) => state === history.future[i]);
  return same ? history : { ...history, past, present, future };
}

/** The one line the roof's sheet says of the map (board G21). */
export type SiteFitLine = 'unclear';

/**
 * An unclear read is said. How far the scan sits from a roof is LiDAR's to show, where the two
 * stand together (`T-M05-002g`).
 */
export function siteFitLineOf(fit: SiteFit | null): SiteFitLine | null {
  return fit !== null && !fit.clear ? 'unclear' : null;
}
