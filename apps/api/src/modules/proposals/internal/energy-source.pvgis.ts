import type { EnergyAnswer, EnergySourceOfRecord } from '@heliogrid/contracts';
import { type Coordinate, ENERGY_DATABASES, type EnergyDatabase } from '@heliogrid/domain';
import { z } from 'zod';

/**
 * PVGIS, the energy source of record (`F8-08`, `T-M06-033`): the European Commission's free
 * public service, asked with no account and no key. One point in; what 1 kWp of crystalline
 * silicon generates there each month, facing the equator at the optimal tilt, at ZERO system loss —
 * step 4's efficiency is applied once, by domain, so losses are never taken twice.
 *
 * A fixed timeout and no retry: a source that does not answer in time is not waited for, and the
 * step fills from the built-in estimate with its own label (`F8-10`).
 */
const ENDPOINT = 'https://re.jrc.ec.europa.eu/api/v5_3/PVcalc';

/** A person is waiting on step 4: past this the built-in estimate fills it. */
const ANSWER_TIMEOUT_MS = 6_000;

const answerSchema = z.object({
  inputs: z.object({ meteo_data: z.object({ radiation_db: z.string() }) }),
  outputs: z.object({
    monthly: z.object({
      fixed: z.array(z.object({ month: z.number().int(), E_m: z.number().nonnegative() })),
    }),
  }),
});

const MONTHS = 12;

/** `PVGIS-ERA5` names the database `ERA5`; one this product does not know is no answer it can label. */
function databaseOf(named: string): EnergyDatabase {
  const database = ENERGY_DATABASES.find((known) => named.toUpperCase().endsWith(known));
  if (database === undefined)
    throw new Error(`PVGIS answered from a database unknown here: ${named}`);
  return database;
}

export class PvgisEnergySource implements EnergySourceOfRecord {
  async monthlyYield(point: Coordinate): Promise<EnergyAnswer> {
    const query = new URLSearchParams({
      lat: String(point.latitude),
      lon: String(point.longitude),
      peakpower: '1',
      loss: '0',
      optimalinclination: '1',
      aspect: '0',
      outputformat: 'json',
    });
    // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is an outbound call to a public service and no typed client exists for it
    const response = await fetch(`${ENDPOINT}?${query.toString()}`, {
      signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`PVGIS answered ${response.status}`);
    const answer = answerSchema.parse(await response.json());
    const months = [...answer.outputs.monthly.fixed].sort((a, b) => a.month - b.month);
    if (months.length !== MONTHS) throw new Error(`PVGIS answered ${months.length} months`);
    return {
      database: databaseOf(answer.inputs.meteo_data.radiation_db),
      yieldPerKwp: months.map((month) => month.E_m),
    };
  }
}
