import type { PackLabel } from './languages';

/**
 * `F1-22`, `M06-09` — the market's administrative areas: the regions a site sits in (India's states
 * and union territories), each with its districts and a representative coordinate. Step 3 offers
 * them, the energy estimate is asked for the coordinate (`F8-08`), and the tax and incentive rules
 * read the region's code (`tax/pack.ts`, `subsidy/pack.ts`).
 *
 * A region's `code` is its ISO 3166-2 code (`IN-MH`): stable, never translated, never shown. Its
 * name is a label per language; a district's name is one string, as its own state writes it in
 * English (`F3-08`: a place name is never translated here, as an operator's is not).
 */

/** Decimal degrees, WGS 84. */
export interface Coordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface AdministrativeDistrict {
  readonly name: string;
  readonly coordinate: Coordinate;
}

export interface AdministrativeArea {
  /** ISO 3166-2 — `IN-MH`. */
  readonly code: string;
  readonly name: PackLabel;
  /** Its district nearest the region's mean point — always on land, never a centroid at sea. */
  readonly coordinate: Coordinate;
  readonly districts: readonly AdministrativeDistrict[];
}

/** What a site names: its region, and its district where the person picked one (`T-M06-033`). */
export interface AreaRef {
  readonly area: string;
  readonly district: string | null;
}

/** How exact a located point is: the district's own, or the coarser one of its region alone. */
export const AREA_GRAINS = ['district', 'area'] as const;
export type AreaGrain = (typeof AREA_GRAINS)[number];

export interface LocatedArea {
  readonly coordinate: Coordinate;
  readonly grain: AreaGrain;
}

/** The market's declaration for a region code, or `null` where it declares none (`F1-09`). */
export function areaOf(
  areas: readonly AdministrativeArea[],
  code: string,
): AdministrativeArea | null {
  return areas.find((area) => area.code === code) ?? null;
}

/**
 * The point an estimate is asked for (`T-M06-033`): the district's where the pack holds that
 * district, else the region's own — the coarser point, which the caller labels as such — and `null`
 * for a region the market never declared.
 */
export function locateArea(areas: readonly AdministrativeArea[], ref: AreaRef): LocatedArea | null {
  const area = areaOf(areas, ref.area);
  if (area === null) return null;
  const district = area.districts.find((declared) => declared.name === ref.district);
  return district === undefined
    ? { coordinate: area.coordinate, grain: 'area' }
    : { coordinate: district.coordinate, grain: 'district' };
}
