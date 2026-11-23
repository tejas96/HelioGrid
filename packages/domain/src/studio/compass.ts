/**
 * The compass a roof's slope and a side are named by (`T-M05-002`, part e): eight ways. A side or
 * a face is said to face one of them; its exact bearing is stored and shown beside the word.
 */

const FULL_TURN = 360;

/** The compass's eight ways, clockwise from north. */
export const COMPASS_WAYS = [
  'north',
  'north_east',
  'east',
  'south_east',
  'south',
  'south_west',
  'west',
  'north_west',
] as const;
export type CompassWay = (typeof COMPASS_WAYS)[number];

/** The compass way nearest a bearing in degrees clockwise from north. */
export function compassOf(bearingDeg: number): CompassWay {
  const step = FULL_TURN / COMPASS_WAYS.length;
  const turned = ((bearingDeg % FULL_TURN) + FULL_TURN) % FULL_TURN;
  return COMPASS_WAYS[Math.round(turned / step) % COMPASS_WAYS.length] as CompassWay;
}
