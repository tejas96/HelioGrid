import type {
  Billed,
  BuildingAnswer,
  HeightMapAnswer,
  RoofDataPort,
  RoofFaceAnswer,
} from '@heliogrid/contracts';
import type { Coordinate, HeightDataQuality } from '@heliogrid/domain';
import { z } from 'zod';

const SOLAR = 'https://solar.googleapis.com/v1';
/** Google answers a house in about a second; past this the studio goes on without it. */
const TIMEOUT_MS = 8_000;
const NOT_FOUND = 404;
/** Google's own words for its sharpness, as ours. */
const QUALITIES: Record<string, HeightDataQuality> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  BASE: 'base',
};
/** At 0.1 m a 100 m call is 16 MB a layer; 0.25 m is a sixth of that and fitted Sangli to 6 cm. */
const SHARPEST_PIXEL_M = 0.1;
const PIXEL_M = 0.25;
const TURN = 360;

const dateSchema = z
  .object({ year: z.number().int(), month: z.number().int(), day: z.number().int() })
  .partial()
  .optional();
const pointSchema = z.object({ latitude: z.number(), longitude: z.number() });

/** The part of Building Insights' reply the studio reads; the whole reply is kept as it came. */
const buildingSchema = z.object({
  center: pointSchema,
  imageryDate: dateSchema,
  imageryQuality: z.string(),
  solarPotential: z
    .object({
      roofSegmentStats: z
        .array(
          z.object({
            pitchDegrees: z.number().default(0),
            azimuthDegrees: z.number().default(0),
            stats: z
              .object({ areaMeters2: z.number().default(0) })
              .partial()
              .default({}),
            center: pointSchema,
            planeHeightAtCenterMeters: z.number().default(0),
          }),
        )
        .default([]),
    })
    .partial()
    .default({}),
});

const layersSchema = z.object({
  imageryDate: dateSchema,
  imageryQuality: z.string(),
  dsmUrl: z.string().url(),
  maskUrl: z.string().url(),
  rgbUrl: z.string().url().optional(),
});

const TWO = 2;
/** `YYYY-MM-DD` of Google's date, or `null` where it is not whole. */
function dayOf(date: z.infer<typeof dateSchema>): string | null {
  if (date?.year === undefined || date.month === undefined || date.day === undefined) return null;
  const pad = (n: number) => String(n).padStart(TWO, '0');
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

/** Google's sharpness; a word it adds later, or leaves unspecified, reads as its lowest, BASE. */
function qualityOf(word: string): HeightDataQuality {
  return QUALITIES[word] ?? 'base';
}

/**
 * Google's Solar API on the api's server key (`07-integrations.md` §2): Building Insights for a
 * building's faces, Data Layers for its height map, building mask and straight-down picture
 * (`view=IMAGERY_LAYERS`, never the flux layers, §1). Asked at quality BASE, which brings HIGH or
 * MEDIUM where Google holds them; only after a not-found, once more with `EXPANDED_COVERAGE`, as
 * BASE is generally available only in parts of India and Pakistan. A not-found is not billed.
 * The key travels in the address, so no address is ever put in an error or a log.
 */
export class GoogleRoofData implements RoofDataPort {
  readonly setUp = true;

  constructor(private readonly key: string) {}

  /** Google's answer to a Solar ask, the wider coverage tried once on a not-found; `null` if none. */
  private async ask(
    path: string,
    query: Record<string, string>,
    billed: Billed,
  ): Promise<unknown | null> {
    for (const wider of [false, true]) {
      const params = new URLSearchParams({ ...query, requiredQuality: 'BASE', key: this.key });
      if (wider) params.set('experiments', 'EXPANDED_COVERAGE');
      // biome-ignore lint/style/noRestrictedGlobals: an outbound call to Google's Solar API, not our wire; no typed client exists for it
      const answer = await fetch(`${SOLAR}/${path}?${params}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (answer.status === NOT_FOUND) continue;
      if (!answer.ok) throw new Error(`Solar ${path} answered ${answer.status}`);
      billed();
      return answer.json();
    }
    return null;
  }

  /** A GeoTIFF Data Layers links to: the link takes the key; it lasts about an hour. */
  private async file(url: string): Promise<Uint8Array> {
    const address = new URL(url);
    address.searchParams.set('key', this.key);
    // biome-ignore lint/style/noRestrictedGlobals: an outbound call to Google's Solar API, not our wire; no typed client exists for it
    const answer = await fetch(address, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!answer.ok) throw new Error(`Solar geoTiff answered ${answer.status}`);
    return new Uint8Array(await answer.arrayBuffer());
  }

  async buildingAt(point: Coordinate, billed: Billed): Promise<BuildingAnswer | null> {
    const reply = await this.ask(
      'buildingInsights:findClosest',
      {
        'location.latitude': String(point.latitude),
        'location.longitude': String(point.longitude),
      },
      billed,
    );
    if (reply === null) return null;
    const read = buildingSchema.parse(reply);
    const faces: RoofFaceAnswer[] = (read.solarPotential.roofSegmentStats ?? []).map((face) => ({
      middle: face.center,
      slopeDeg: face.pitchDegrees,
      facingDeg: ((face.azimuthDegrees % TURN) + TURN) % TURN,
      areaM2: face.stats.areaMeters2 ?? 0,
      heightAboveSeaM: face.planeHeightAtCenterMeters,
    }));
    return {
      quality: qualityOf(read.imageryQuality),
      dataOn: dayOf(read.imageryDate),
      middle: read.center,
      faces,
      reply,
    };
  }

  async heightMapAt(
    point: Coordinate,
    radiusM: number,
    sharpest: boolean,
    billed: Billed,
  ): Promise<HeightMapAnswer | null> {
    // A link that ran out before it was fetched is asked for afresh, once.
    for (let attempt = 0; attempt < TWO; attempt += 1) {
      const reply = await this.ask(
        'dataLayers:get',
        {
          'location.latitude': String(point.latitude),
          'location.longitude': String(point.longitude),
          radiusMeters: String(Math.round(radiusM)),
          view: 'IMAGERY_LAYERS',
          pixelSizeMeters: String(sharpest ? SHARPEST_PIXEL_M : PIXEL_M),
        },
        billed,
      );
      if (reply === null) return null;
      const layers = layersSchema.parse(reply);
      try {
        const [surface, buildings, picture] = await Promise.all([
          this.file(layers.dsmUrl),
          this.file(layers.maskUrl),
          layers.rgbUrl === undefined ? Promise.resolve(null) : this.file(layers.rgbUrl),
        ]);
        return {
          quality: qualityOf(layers.imageryQuality),
          dataOn: dayOf(layers.imageryDate),
          surface,
          buildings,
          picture,
        };
      } catch (error) {
        if (attempt === TWO - 1) throw error;
      }
    }
    return null;
  }
}
