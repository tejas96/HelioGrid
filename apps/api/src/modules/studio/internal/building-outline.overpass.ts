import type { Coordinate } from '@heliogrid/domain';
import { z } from 'zod';
import type { BuildingOutlineSource, MappedBuilding } from './site-surrounds';

/** Past this the studio goes on without the outlines and says so. */
const TIMEOUT_MS = 6_000;
/** A ring of fewer corners, or more, is no building outline worth drawing. */
const RING_MIN = 4;
const RING_MAX = 400;
/** Six decimals of a degree: a tenth of a metre. */
const DEGREE_DIGITS = 6;
/** The public server answers 406 to a client that names no one, as Node's own fetch does. */
const CLIENT_NAME = 'HelioGrid-studio/1.0';

const answerSchema = z.object({
  elements: z.array(
    z.object({
      type: z.string(),
      geometry: z.array(z.object({ lat: z.number(), lon: z.number() })).optional(),
      tags: z.record(z.string()).optional(),
    }),
  ),
});

/** A tag's number of metres or floors: `"12"`, `"12 m"`, `"12.5"`; `null` for anything else. */
function numberOf(text: string | undefined): number | null {
  if (text === undefined) return null;
  const match = /^\s*(\d+(?:\.\d+)?)\s*(m)?\s*$/.exec(text);
  return match === null ? null : Number(match[1]);
}

/** The heights a building's tags give (OpenStreetMap's Simple 3D Buildings). */
export function heightsOfTags(tags: Readonly<Record<string, string>>): {
  heightM: number | null;
  floorsAbove: number | null;
} {
  const height = numberOf(tags.height);
  const lifted = numberOf(tags.min_height) ?? 0;
  const levels = numberOf(tags['building:levels']);
  const roofLevels = numberOf(tags['roof:levels']) ?? 0;
  return {
    heightM: height === null ? null : Math.max(0, height - lifted),
    floorsAbove: levels === null ? null : Math.max(0, Math.round(levels + roofLevels) - 1),
  };
}

/**
 * OpenStreetMap's building outlines round a point, from an Overpass server (`07-integrations.md`
 * §2): the public one in development, a paid host before launch — its address is the setting
 * `OVERPASS_URL`. The public server is not for commercial use; production without a host has
 * none. "© OpenStreetMap contributors" shows wherever its outlines do.
 */
export class OverpassBuildingOutlines implements BuildingOutlineSource {
  readonly setUp = true;

  constructor(private readonly address: string) {}

  async outlinesNear(point: Coordinate, radiusM: number): Promise<readonly MappedBuilding[]> {
    const around = `around:${Math.round(radiusM)},${point.latitude.toFixed(DEGREE_DIGITS)},${point.longitude.toFixed(DEGREE_DIGITS)}`;
    const query = `[out:json][timeout:5];way["building"](${around});out geom tags;`;
    // biome-ignore lint/style/noRestrictedGlobals: an outbound call to an Overpass server, not our wire; no typed client exists for it
    const answer = await fetch(this.address, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': CLIENT_NAME },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!answer.ok) throw new Error(`Overpass answered ${answer.status}`);
    const read = answerSchema.parse(await answer.json());
    return read.elements
      .filter((element) => element.type === 'way' && element.geometry !== undefined)
      .map((element) => {
        const geometry = element.geometry ?? [];
        const ring = geometry.map((corner) => ({ latitude: corner.lat, longitude: corner.lon }));
        // OpenStreetMap closes a ring on its first corner.
        const open = ring.slice(0, -1);
        return { ring: open, ...heightsOfTags(element.tags ?? {}) };
      })
      .filter(
        (building) => building.ring.length >= RING_MIN - 1 && building.ring.length <= RING_MAX,
      );
  }
}

/** Where no Overpass host is set (production before one is bought): no outlines, said plainly. */
export class AbsentBuildingOutlines implements BuildingOutlineSource {
  readonly setUp = false;

  async outlinesNear(): Promise<readonly MappedBuilding[]> {
    return [];
  }
}
