import type { Coordinate } from '@heliogrid/domain';
import { z } from 'zod';
import type { FarHorizonPoint, FarHorizonSource } from './site-surrounds';

const PRINT_HORIZON = 'https://re.jrc.ec.europa.eu/api/v5_3/printhorizon';
/** As the energy source's: PVGIS answers in about a second; past this there is no far line. */
const TIMEOUT_MS = 6_000;
const BAD_REQUEST = 400;
/** Four decimals of a degree, about 10 m: finer than PVGIS's 90 m terrain. */
const DEGREE_DIGITS = 4;

const answerSchema = z.object({
  outputs: z.object({
    horizon_profile: z.array(z.object({ A: z.number(), H_hor: z.number() })),
  }),
});

/**
 * The far hills round a site from PVGIS's `printhorizon` (the EU's Joint Research Centre; free,
 * no key, worldwide from a terrain model), the same service the energy figures come from (§1).
 * A point over the sea is refused with a 400 that says so; any other refusal rejects.
 */
export class PvgisFarHorizon implements FarHorizonSource {
  async horizonAt(point: Coordinate): Promise<readonly FarHorizonPoint[] | null> {
    const query = new URLSearchParams({
      lat: point.latitude.toFixed(DEGREE_DIGITS),
      lon: point.longitude.toFixed(DEGREE_DIGITS),
      outputformat: 'json',
    });
    // biome-ignore lint/style/noRestrictedGlobals: an outbound call to PVGIS, not our wire; no typed client exists for it
    const answer = await fetch(`${PRINT_HORIZON}?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (answer.status === BAD_REQUEST) {
      const body = (await answer.json().catch(() => ({}))) as { message?: string };
      if (body.message?.toLowerCase().includes('sea') === true) return null;
    }
    if (!answer.ok) throw new Error(`PVGIS printhorizon answered ${answer.status}`);
    const read = answerSchema.parse(await answer.json());
    return read.outputs.horizon_profile.map((point) => ({
      bearingFromSouthDeg: point.A,
      elevationDeg: point.H_hor,
    }));
  }
}
