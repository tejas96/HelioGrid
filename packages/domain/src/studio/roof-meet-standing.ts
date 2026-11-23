import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofWithItsParts } from './roof-kind';
import type { RoofFacts } from './roof-levels';
import { cutToEdge, meetingOf } from './roof-meet';
import type { RoofMeeting } from './roof-meeting';

/**
 * How a roof already in the design meets the others (`T-M05-002`, part e): after Cut to edge, or
 * once it is dragged off the roof it stood on. The roof itself and what goes with it are left out
 * of the count, and every roof the answer names is named by its place in the whole design.
 */

/** The design's other roofs, and each one's place in the whole design. */
function othersOf(document: StudioDocument, index: number) {
  const own = new Set(roofWithItsParts(document, index));
  const places = document.roofs.map((_, place) => place).filter((place) => !own.has(place));
  return { places, design: { ...document, roofs: places.map((p) => document.roofs[p] as Roof) } };
}

/** How the roof at `index` meets the others, were it on `corners`. */
export function meetingOfRoof(
  document: StudioDocument,
  index: number,
  corners: readonly GroundPoint[],
  facts: RoofFacts,
): RoofMeeting {
  const { places, design } = othersOf(document, index);
  const meeting = meetingOf(design, corners, facts, document.roofs[index]);
  const placeOf = (among: number | null) => (among === null ? null : (places[among] ?? null));
  return {
    ...meeting,
    on: placeOf(meeting.on),
    partOf: placeOf(meeting.partOf),
    joinWith: placeOf(meeting.joinWith),
    startsLike: placeOf(meeting.startsLike),
  };
}

/** The roof at `index` cut back to the edge of the others it lies over; `null` where that leaves no one piece. */
export function roofCutToEdge(
  document: StudioDocument,
  index: number,
): readonly GroundPoint[] | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  return cutToEdge(othersOf(document, index).design, roof.corners);
}
