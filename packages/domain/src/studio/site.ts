import type { AdministrativeArea, AreaRef, Coordinate } from '../format/areas';
import type { SupplyPhase } from '../format/supply-phase';
import { operatorsForArea, type UtilityDirectory } from '../format/utility';

/**
 * The site a design is made for, as the studio reads it. The host gives it: the studio never
 * knows where a host keeps these facts, only their shape.
 */
export interface StudioSite {
  readonly name: string | null;
  readonly address: string | null;
  /** The exact point of the roof or the land — the one fact a design cannot start without. */
  readonly pin: Coordinate | null;
  readonly area: AreaRef | null;
  /** The network operator the site is connected to, as the market's directory spells it. */
  readonly utilityOperator: string | null;
  readonly supplyPhase: SupplyPhase | null;
  readonly sanctionedLoadKw: number | null;
}

/** Why a design cannot start yet. One reason today; a later step adds its own. */
export const SITE_START_BLOCKS = ['no_location'] as const;
export type SiteStartBlock = (typeof SITE_START_BLOCKS)[number];

/** Only the location is asked for: every other fact can be given later, where a step needs it. */
export function siteStartBlock(site: Pick<StudioSite, 'pin'>): SiteStartBlock | null {
  return site.pin === null ? 'no_location' : null;
}

/**
 * The operator that stands after the area changes: the one already picked where the new area lists
 * it, the only one where the area lists exactly one, and none otherwise — a person picks among
 * several, the system never guesses.
 */
export function operatorAfterArea(
  directory: UtilityDirectory,
  area: string | null,
  current: string | null,
): string | null {
  if (area === null) return null;
  const operators = operatorsForArea(directory, area);
  if (current !== null && operators.includes(current)) return current;
  const [only, ...others] = operators;
  return only !== undefined && others.length === 0 ? only : null;
}

/** What a map service says of a point's first-level region: its short code and its name. */
export interface PlaceRegion {
  readonly code: string | null;
  readonly name: string | null;
}

const sameWords = (left: string, right: string): boolean =>
  left.trim().toLowerCase() === right.trim().toLowerCase();

/**
 * The market's area a found place lies in, or `null` when nothing matches — the person then picks
 * the state, because a wrong state would put the wrong tax and operator on the site. Three reads,
 * the surest first: the region's code as the area's own code ends (`MH` in `IN-MH`), the area's
 * name, then the utility directory's name for it (`Delhi`).
 */
export function areaOfPlace(
  areas: readonly AdministrativeArea[],
  directory: UtilityDirectory,
  region: PlaceRegion,
): string | null {
  const { code, name } = region;
  if (code !== null) {
    const byCode = areas.find((area) => sameWords(area.code.split('-')[1] ?? '', code));
    if (byCode !== undefined) return byCode.code;
  }
  if (name === null) return null;
  const byName = areas.find((area) => sameWords(area.name.en, name));
  if (byName !== undefined) return byName.code;
  const listed = directory.regions.find((declared) => sameWords(declared.region, name));
  return listed?.area ?? null;
}
