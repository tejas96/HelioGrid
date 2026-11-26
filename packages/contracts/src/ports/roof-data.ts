import type { Coordinate, HeightDataQuality } from '@heliogrid/domain';

/**
 * The port a site's heights and roof faces come through (`docs/engineering/07-integrations.md` §2,
 * `T-M05-002` part g). The v1 adapter is Google's Solar API on the server key; under test a memory
 * binding stands in, and where no key is set an absent one says so.
 *
 * Each call REJECTS when the service does not answer in time or answers what cannot be read, and
 * answers `null` when it holds nothing for the place — a not-found Google does not bill. The answers
 * are kept whole for up to 30 days (owner ruling 2026-11-26; Solar terms §21.2), so a place is asked
 * once a month whoever designs there.
 */

/** One roof face of a building, as the service measured it. */
export interface RoofFaceAnswer {
  readonly middle: Coordinate;
  readonly slopeDeg: number;
  /** The compass bearing the face slopes down toward. */
  readonly facingDeg: number;
  readonly areaM2: number;
  /** The face's plane at its middle, metres above sea level. */
  readonly heightAboveSeaM: number;
}

/** The building nearest a point: its faces, and the service's whole reply for later steps. */
export interface BuildingAnswer {
  readonly quality: HeightDataQuality;
  /** `YYYY-MM-DD`, or `null` when the service does not say. */
  readonly dataOn: string | null;
  /** The building's middle: two answers with the same middle are the same building. */
  readonly middle: Coordinate;
  readonly faces: readonly RoofFaceAnswer[];
  /** The service's reply as it came — the panels step reads its layout from it, with no new call. */
  readonly reply: unknown;
}

/** The height map round a point: GeoTIFFs as the service sends them, on a UTM grid. */
export interface HeightMapAnswer {
  readonly quality: HeightDataQuality;
  readonly dataOn: string | null;
  /** Metres above sea level, one band of 32-bit floats. */
  readonly surface: Uint8Array;
  /** 1 where a building stands. */
  readonly buildings: Uint8Array;
  /** The straight-down picture, three bands; `null` where none came. */
  readonly picture: Uint8Array | null;
}

/**
 * Called once for each call the service bills, as it answers and before its answer is read — so a
 * billed answer that then cannot be read, or a call asked again, is still counted.
 */
export type Billed = () => void;

export interface RoofDataPort {
  /** False where no service is set up: the studio says so and the roofs stand at their floors. */
  readonly setUp: boolean;
  buildingAt(point: Coordinate, billed: Billed): Promise<BuildingAnswer | null>;
  /** The height map within `radiusM` of the point, at the sharpest the service holds there. */
  heightMapAt(
    point: Coordinate,
    radiusM: number,
    sharpest: boolean,
    billed: Billed,
  ): Promise<HeightMapAnswer | null>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const ROOF_DATA_PORT = Symbol.for('heliogrid.RoofDataPort');
