import {
  type LidarStatus,
  type LidarView,
  lidarStatusOf,
  type RoofFacts,
  type RoofName,
  roofHeightSlide,
  roofNameOf,
  type StudioDocument,
} from '@heliogrid/domain';
import {
  type BuildingScanFit,
  type DrawnBuilding,
  roofIsFlat,
  SCAN_REACH_M,
} from '@heliogrid/domain/studio-kernel';
import type { LidarScreen } from './lidar-view';

/**
 * What Move has picked (`T-M05-002g`) and where it stands against the scan: the picked roofs and
 * whole buildings, the roof the height slider sets, and the buildings the scan sees elsewhere.
 */

/** Heights this close agree. */
const SAME_HEIGHT_M = 0.05;

/** The scan's top for a roof, as the fit read it; `null` where it reads no roof. */
export function scanTopOf(fit: BuildingScanFit | null, id: string | undefined): number | null {
  const read = id === undefined ? undefined : fit?.reads[id];
  return read?.kind === 'roof' ? read.heightM : null;
}

export interface LidarPicks {
  /** The picked roofs, by index. */
  readonly picked: readonly number[];
  /** The buildings every roof of which is picked. */
  readonly pickedBuildings: readonly DrawnBuilding[];
  readonly fitOf: (building: DrawnBuilding) => BuildingScanFit | null;
  readonly flat: (index: number) => boolean;
  /** The one building picked, and its fit; `undefined` and `null` otherwise. */
  readonly one: DrawnBuilding | undefined;
  readonly oneFit: BuildingScanFit | null;
  /** The roof the height slider sets; `null` unless one building is picked. */
  readonly heightIndex: number | null;
  readonly status: LidarStatus | null;
  /** A picked building sits off the scan, or a picked flat roof at another height. */
  readonly canMatch: boolean;
  /** Buildings drawn on the leaning sky picture that the scan sees elsewhere (board frame 20). */
  readonly offBuildings: readonly DrawnBuilding[];
  readonly heightRoof: LidarScreen['heightRoof'];
}

/** Whether a picked flat roof stands at another height than the scan reads. */
function heightOffOf(
  buildings: readonly DrawnBuilding[],
  fitOf: LidarPicks['fitOf'],
  flat: LidarPicks['flat'],
  roofs: StudioDocument['roofs'],
  heightOf: (index: number) => number,
): boolean {
  return buildings.some((building) =>
    building.roofs.some((index) => {
      const scanM = flat(index) ? scanTopOf(fitOf(building), roofs[index]?.id) : null;
      return scanM !== null && Math.abs(scanM - heightOf(index)) >= SAME_HEIGHT_M;
    }),
  );
}

/** The roof the height slider sets, with its building's roofs to choose from. */
function heightRoofOf(
  one: DrawnBuilding | undefined,
  fit: BuildingScanFit | null,
  index: number | null,
  flat: (index: number) => boolean,
  heightOf: (index: number) => number,
  roofs: StudioDocument['roofs'],
  nameOf: (index: number) => RoofName,
  facts: RoofFacts,
): LidarScreen['heightRoof'] {
  if (index === null || one === undefined) return null;
  // A building past the scan's reach was read where it stands, not on its own roof: no range.
  const range = fit?.beyondReach === true ? null : (fit?.ranges[roofs[index]?.id ?? ''] ?? null);
  const choices = one.roofs.map((at) => ({ index: at, name: nameOf(at) }));
  const heightM = heightOf(index);
  // The studio's own slider: its ends set by the height stored, never the one in hand.
  const slide = roofHeightSlide(roofs[index]?.height?.metres ?? heightM, facts);
  return { index, choices, flat: flat(index), heightM, range, slide };
}

export function lidarPicksOf(input: {
  readonly document: StudioDocument | null;
  readonly view: LidarView;
  readonly buildings: readonly DrawnBuilding[];
  readonly fits: readonly BuildingScanFit[] | null;
  /** The fits last answered, perhaps for the roofs before an edit: the off-spot check reads them. */
  readonly lastFits: readonly BuildingScanFit[] | null;
  readonly facts: RoofFacts;
  /** Which roof of the one picked building the slider sets, by its place among its roofs. */
  readonly heightPick: number;
  readonly heightOf: (index: number) => number;
}): LidarPicks {
  const { document, view, buildings, fits } = input;
  const nameOf = (index: number): RoofName =>
    (document === null ? null : roofNameOf(document, index)) ?? { kind: 'roof', number: index + 1 };
  const roofs = document?.roofs ?? [];
  const picked = (view.move?.picked ?? [])
    .map((id) => roofs.findIndex((roof) => roof.id === id))
    .filter((i) => i >= 0);
  const pickedBuildings = buildings.filter((b) => b.members.every((i) => picked.includes(i)));
  const fitOf = (building: DrawnBuilding) => fits?.[buildings.indexOf(building)] ?? null;
  const flat = (index: number) => {
    const roof = roofs[index];
    return roof !== undefined && roofIsFlat(roof, input.facts);
  };
  const one = pickedBuildings.length === 1 ? pickedBuildings[0] : undefined;
  const oneFit = one === undefined ? null : fitOf(one);
  const last = (one?.roofs.length ?? 1) - 1;
  const heightIndex = one?.roofs[Math.min(input.heightPick, last)] ?? null;
  const away = pickedBuildings.some((building) => fitOf(building)?.shift != null);
  // A building the scan sees past Match's reach: its reads where it stands are not of it.
  const beyond = pickedBuildings.some((building) => fitOf(building)?.beyondReach === true);
  const inReach = pickedBuildings.filter((building) => fitOf(building)?.beyondReach !== true);
  const heightOff = heightOffOf(inReach, fitOf, flat, roofs, input.heightOf);
  const flatPick = heightIndex !== null && flat(heightIndex);
  const status = lidarStatusOf({
    picked: picked.length,
    fitsIn: fits !== null,
    away,
    heightOff,
    beyondM: beyond ? SCAN_REACH_M : null,
    shift: oneFit?.shift ?? null,
    scanHeightM: flatPick ? scanTopOf(oneFit, roofs[heightIndex]?.id) : null,
  });
  const drawnOnSky = document?.drawnOn?.source !== 'google_solar';
  // The last fits answered, for as many buildings as stand: steady while new ones are worked out.
  const lastAnswered = input.lastFits;
  const offBuildings =
    drawnOnSky && lastAnswered !== null && lastAnswered.length === buildings.length
      ? buildings.filter((_, i) => lastAnswered[i]?.shift != null)
      : [];
  return {
    heightRoof: heightRoofOf(
      one,
      oneFit,
      heightIndex,
      flat,
      input.heightOf,
      roofs,
      nameOf,
      input.facts,
    ),
    picked,
    pickedBuildings,
    fitOf,
    flat,
    one,
    oneFit,
    heightIndex,
    status,
    canMatch: away || heightOff,
    offBuildings,
  };
}
