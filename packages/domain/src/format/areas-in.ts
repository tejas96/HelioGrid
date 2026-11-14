import type { AdministrativeArea } from './areas';
import areas from './areas-in.json';

/**
 * India's 36 states and union territories with their 783 districts (`M06-09`), each with a
 * representative point. DATA ONLY, in `areas-in.json`: district points are Wikidata's (CC0), read
 * 2026-11-13 — a district it gives no point takes its headquarters town's — and a region's point is
 * its district nearest the region's mean point. A district missing here is picked by its region
 * alone (`T-M06-033`). `proposals/built-in-yield-in.json` holds one row per row here: change both.
 */
export const IN_AREAS: readonly AdministrativeArea[] = areas;
