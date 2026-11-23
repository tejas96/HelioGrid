import type { Roof, StudioDocument } from './document';
import { belongsTo, roofKindOf, standsOn } from './roof-kind';
import { type RoofFacts, roofOwnHeightM } from './roof-levels';
import { firstSheetMaterial } from './roof-material';
import type { RoofMeeting } from './roof-meeting';
import { roofNameOf } from './roof-names';
import type { RoofKind, RoofMaterialSet } from './roof-parts';
import type { RoofBecame, RoofPlacing } from './roof-step-state';

/**
 * A roof takes its place among the others (`T-M05-002`, part e): what it is, the roof it stands on
 * and the one it belongs to, and what it starts as — from how it meets them when it closes, or from
 * the kind a person picks after. Only this roof changes: a roof already standing never changes what
 * it is because another was drawn.
 */

/** The kinds that stand on another roof and count their height from it. */
const STANDING: readonly RoofKind[] = ['stair_room', 'upper_floor', 'open_shed', 'dormer'];
/** The kinds that are part of another roof and stand on none: cut in it, or carved out of it. */
const PART: readonly RoofKind[] = ['hole', 'separate_part'];

/** A roof's links for its kind: `under` is the roof it lies on, `most` the one it covers most. */
function linksFor(
  kind: RoofKind,
  under: string | undefined,
  most: string | undefined,
): Pick<Roof, 'on' | 'partOf'> {
  if (under === undefined) return {};
  if (PART.includes(kind)) return { partOf: under };
  if (!STANDING.includes(kind)) return {};
  return most === undefined || most === under ? { on: under } : { on: under, partOf: most };
}

/** What a roof starts as: what the roof it starts like is made of, still to be confirmed. */
function materialLike(like: Roof | undefined): RoofMaterialSet | undefined {
  const material = like?.material;
  if (material === undefined) return undefined;
  const { type, name, fixedLike } = material;
  return {
    type,
    ...(name === undefined ? {} : { name }),
    ...(fixedLike === undefined ? {} : { fixedLike }),
    setBy: 'system',
    confirmed: false,
  };
}

/** The material a roof of a kind starts with: an open shed's is the market's first sheet. */
function startMaterial(
  kind: RoofKind,
  like: Roof | undefined,
  facts: RoofFacts,
): RoofMaterialSet | undefined {
  if (kind !== 'open_shed') return materialLike(like);
  return { type: firstSheetMaterial(facts), setBy: 'system', confirmed: false };
}

/** A roof without what its place gave it: its kind, its links and a material no person set. */
function unplaced(roof: Roof): Roof {
  const { kind: _kind, on: _on, partOf: _partOf, material, ...rest } = roof;
  return material?.setBy === 'person' ? { ...rest, material } : rest;
}

/**
 * A roof just closed, placed by how it meets the others: it is what the studio guessed, stands on
 * the highest roof under it, belongs to the one it covers most, and is made of what the roof it
 * starts like is. Its corners are the meeting's: moved onto the roofs they were drawn to meet.
 */
export function roofPlaced(
  document: StudioDocument,
  roof: Roof,
  meeting: RoofMeeting,
  facts: RoofFacts,
): Roof {
  const idOf = (index: number | null) => (index === null ? undefined : document.roofs[index]?.id);
  const like = meeting.startsLike === null ? undefined : document.roofs[meeting.startsLike];
  const material = startMaterial(meeting.kind, like, facts);
  // A drawn roof's corners may have been moved onto a neighbour, and two of them made one.
  const corners = roof.edges.every((trust) => trust === 'traced') ? meeting.corners : roof.corners;
  return {
    ...unplaced(roof),
    corners,
    edges: corners.length === roof.corners.length ? roof.edges : corners.map(() => 'traced'),
    ...(meeting.kind === 'building' ? {} : { kind: { is: meeting.kind, setBy: 'system' } }),
    ...linksFor(meeting.kind, idOf(meeting.on), idOf(meeting.partOf ?? meeting.on)),
    ...(material === undefined ? {} : { material }),
  };
}

/**
 * A roof made into another kind by a person — a chip on the line after it closes, or the What it
 * is row of its sheet. It keeps the roof it lay on: a stair room made a hole is cut in that roof,
 * a hole made a stair room stands on it, and a building stands on the ground. A height and a
 * material the studio gave go back to the new kind's own; a person's stay.
 */
export function roofMadeInto(
  document: StudioDocument,
  index: number,
  kind: RoofKind,
  facts: RoofFacts,
): StudioDocument {
  const roof = document.roofs[index];
  if (roof === undefined || roofKindOf(roof) === kind) return document;
  const under = roof.on ?? roof.partOf;
  const like = document.roofs.find((other) => other.id === under);
  const kept = unplaced(roof);
  const material = kept.material ?? startMaterial(kind, like, facts);
  const made: Roof = {
    ...kept,
    height: roof.height?.setBy === 'person' ? roof.height : null,
    kind: { is: kind, setBy: 'person' },
    ...linksFor(kind, under, roof.on === undefined ? under : roof.partOf),
    ...(material === undefined ? {} : { material }),
  };
  return { ...document, roofs: document.roofs.map((each, i) => (i === index ? made : each)) };
}

/** The kinds whose height is counted from the roof they stand on, and said on the line. */
const SAID_ABOVE: readonly RoofKind[] = ['stair_room', 'upper_floor', 'open_shed'];

/**
 * What the line says of a roof in its place: what it is called, the roof it goes with or meets,
 * and how high it stands on that roof. `meets` is the roof it meets where it stands on none.
 */
export function becameFacts(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  meets: number | null = null,
): Pick<RoofBecame, 'name' | 'beside' | 'aboveM' | 'is'> {
  const roof = document.roofs[index] as Roof;
  const kind = roofKindOf(roof);
  const owner = belongsTo(document, roof) ?? meets;
  const stands = SAID_ABOVE.includes(kind) && standsOn(document, roof) !== null;
  return {
    is: kind,
    name: roofNameOf(document, index) ?? { kind: 'roof', number: index + 1 },
    beside: owner === null ? null : roofNameOf(document, owner),
    aboveM: stands ? roofOwnHeightM(document, roof, facts) : null,
  };
}

/** A roof as it stands once placed, and what the line says it became. */
export function placedAt(
  document: StudioDocument,
  roof: Roof,
  index: number,
  placing: RoofPlacing,
): { readonly roof: Roof; readonly became: RoofBecame } {
  const { meeting, facts } = placing;
  const { place, on, choices, joinWith, toCheck } = meeting;
  const placed = roofPlaced(document, roof, meeting, facts);
  // The roof stands at `index` among the others: the line reads it there.
  const roofs = [...document.roofs];
  roofs[index] = placed;
  const said = becameFacts({ ...document, roofs }, index, facts, joinWith ?? meeting.startsLike);
  return { roof: placed, became: { roof: index, place, on, choices, joinWith, toCheck, ...said } };
}
