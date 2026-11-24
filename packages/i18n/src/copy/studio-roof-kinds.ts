import type { TranslatedText } from '@heliogrid/contracts';
import type {
  HeightLevel,
  KindLine,
  MeetChoice,
  NoWallWhy,
  RoofBecame,
  RoofKind,
  RoofName,
  RoofSaid,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/**
 * The words for many roofs (`T-M05-002`, part e): what each roof is called, what the line says a
 * new roof became, and the chips that fix a wrong guess. "Roof n" names only a roof on the ground;
 * a roof on another is named by its kind.
 */
const KIND = {
  roofNumbered: /*i18n*/ { id: 'Roof {number}' },
  building: /*i18n*/ { id: 'Building' },
  stairRoom: /*i18n*/ { id: 'Stair room' },
  upperFloor: /*i18n*/ { id: 'Upper floor' },
  openShed: /*i18n*/ { id: 'Open shed' },
  hole: /*i18n*/ { id: 'Hole' },
  dormer: /*i18n*/ { id: 'Dormer' },
  separatePart: /*i18n*/ { id: 'Separate part' },
  joinWith: /*i18n*/ { id: 'Join with {roof}' },
  cutToEdge: /*i18n*/ { id: 'Cut to edge' },
  whatItIs: /*i18n*/ { id: 'What it is' },

  onRoof: /*i18n*/ { id: '{name} on {roof}' },
  overRoof: /*i18n*/ { id: '{name} over {roof}' },
  inRoof: /*i18n*/ { id: '{name} in {roof}' },
  partOfRoof: /*i18n*/ { id: '{name} of {roof}' },
  besideRoof: /*i18n*/ { id: '{name} beside {roof}' },

  above: /*i18n*/ { id: '{height} above {roof} · to check' },
  aboveOnPosts: /*i18n*/ { id: '{height} above {roof} · on posts · to check' },
  openBelow: /*i18n*/ { id: 'Open down to the floor below' },
  partlyOver: /*i18n*/ { id: 'Partly over {roof} · to check' },
  overBothArms: /*i18n*/ { id: 'Over both arms · to check' },
  storeyAbove: /*i18n*/ { id: 'A storey above · to check' },
  sharesEdge: /*i18n*/ { id: 'Shares {roof}’s edge' },
  ownType: /*i18n*/ { id: 'Its own roof type · same building' },
  toCheck: /*i18n*/ { id: 'Check it on site.' },

  madeInto: /*i18n*/ { id: 'Changed to {name}. Undo puts it back.' },
  joinedWith: /*i18n*/ { id: 'Joined with {roof}' },
  oneOutline: /*i18n*/ { id: 'One roof, one outline' },
  copied: /*i18n*/ { id: 'Copy of {roof} · drag it onto its house' },
  deleted: /*i18n*/ { id: '{name} deleted · Undo brings it back' },
  sticksOut: /*i18n*/ { id: '{name} sticks out · to check' },
  sticksOutBy: /*i18n*/ { id: 'Sticks out {length} · to check' },
  wallsOn: /*i18n*/ {
    id: '{count, plural, one {Parapet on # side} other {Parapet on # sides}}',
  },
  wallsAllRound: /*i18n*/ { id: 'Parapet all round' },
  levelTop: /*i18n*/ { id: 'Level with {roof}’s top · {height}' },
  levelParapet: /*i18n*/ { id: 'Level with {roof}’s parapet top · {height}' },
  levelFloor: /*i18n*/ { id: 'Floor {floor} · {height}' },
  levelSides: /*i18n*/ { id: 'Same as the other sides · {height}' },
  levelRidge: /*i18n*/ { id: 'Level with {roof}’s ridge · {height}' },
  wallsNone: /*i18n*/ { id: 'No parapet on this roof' },
  noWallOnSide: /*i18n*/ { id: 'No parapet on this side' },
  sideWallOff: /*i18n*/ { id: 'Side {number}: take its parapet off' },
  sideWallOn: /*i18n*/ { id: 'Side {number}: add a parapet' },
  sharedNoWall: /*i18n*/ { id: 'Shared with {roof} · no parapet' },
  noWallUnderStair: /*i18n*/ { id: 'No parapet where the stair room stands' },
  noWallUnderFloor: /*i18n*/ { id: 'No parapet where the upper floor stands' },
  noWallUnderWall: /*i18n*/ { id: 'No parapet where {roof}’s wall stands' },
  setFree: /*i18n*/ { id: '{name} is its own roof now · Undo puts it back' },
} as const;

const KIND_WORD: Record<RoofKind, (typeof KIND)[keyof typeof KIND]> = {
  building: KIND.building,
  stair_room: KIND.stairRoom,
  upper_floor: KIND.upperFloor,
  open_shed: KIND.openShed,
  hole: KIND.hole,
  dormer: KIND.dormer,
  separate_part: KIND.separatePart,
};

/** A kind's own word: "Stair room", "Open shed". */
export function roofKindWord(t: T, kind: RoofKind): TranslatedText {
  return t(KIND_WORD[kind]);
}

/** What a roof is called: "Roof 2", or its kind's word. */
export function roofNameWord(t: T, name: RoofName): TranslatedText {
  return name.kind === 'roof'
    ? t(KIND.roofNumbered, { number: name.number })
    : roofKindWord(t, name.kind);
}

/** A chip on the line after a roof closes: a kind, Join with the roof it meets, or Cut to edge. */
export function meetChoiceWord(
  t: T,
  choice: MeetChoice,
  joinWith: RoofName | null,
): TranslatedText {
  if (choice === 'cut_to_edge') return t(KIND.cutToEdge);
  if (choice !== 'join') return roofKindWord(t, choice);
  return t(KIND.joinWith, { roof: joinWith === null ? '' : roofNameWord(t, joinWith) });
}

/** How a roof's place among the others is said after its name: on, over, in, of or beside a roof. */
function placeWord(became: RoofBecame) {
  if (became.is === 'hole') return KIND.inRoof;
  if (became.is === 'separate_part') return KIND.partOfRoof;
  if (became.is === 'building') return KIND.besideRoof;
  // An upper floor across both arms of one roof stands on it; one that sticks out lies over it.
  const over = became.is === 'open_shed' || (became.place !== 'inside' && !became.across);
  return over ? KIND.overRoof : KIND.onRoof;
}

/** The line's first words: "Stair room on Roof 1", "Hole in Roof 1", "Roof 2 beside Roof 1". */
export function roofBecameTitle(t: T, became: RoofBecame): TranslatedText {
  const name = roofNameWord(t, became.name);
  if (became.beside === null) return name;
  return t(placeWord(became), { name, roof: roofNameWord(t, became.beside) });
}

/**
 * The line's second half: how high it stands and that it waits for a look, or what its place
 * means. `height` formats a height in the reader's units.
 */
export function roofBecameStatus(
  t: T,
  became: RoofBecame,
  height: (metres: number) => string,
): TranslatedText | null {
  if (became.is === 'hole') return t(KIND.openBelow);
  if (became.is === 'separate_part') return t(KIND.ownType);
  if (became.beside === null) return null;
  const roof = roofNameWord(t, became.beside);
  if (became.is === 'building') return t(KIND.sharesEdge, { roof });
  if (became.across) return t(KIND.overBothArms);
  if (became.place === 'partly_over') return t(KIND.partlyOver, { roof });
  if (became.aboveM === null) return became.toCheck ? t(KIND.toCheck) : null;
  if (became.is === 'upper_floor') return t(KIND.storeyAbove);
  const facts = { height: height(became.aboveM), roof };
  return t(became.is === 'open_shed' ? KIND.aboveOnPosts : KIND.above, facts);
}

/** What a placed roof became, as one line: its second half, or its name where there is none. */
function becameLine(t: T, became: RoofBecame, height: (metres: number) => string): TranslatedText {
  return roofBecameStatus(t, became, height) ?? roofBecameTitle(t, became);
}

/**
 * What the roof step says of a roof among the others, as one line: what it became, the kind a
 * person made it, the roof it joined, its copy, or what was deleted by name. `null` for any other
 * line, and for a roof closed or deleted with no word on its place.
 */
export function roofPlaceLine(
  t: T,
  said: RoofSaid,
  height: (metres: number) => string,
): TranslatedText | null {
  switch (said.kind) {
    case 'closed':
      // A roof that stands apart has no more to say of its place: the caller says its height.
      return said.became === undefined ? null : roofBecameStatus(t, said.became, height);
    case 'cut':
      return becameLine(t, said.became, height);
    case 'made':
      return t(KIND.madeInto, { name: roofNameWord(t, said.name) });
    case 'joined':
      return t(KIND.joinedWith, { roof: roofNameWord(t, said.name) });
    case 'copied':
      return t(KIND.copied, { roof: roofNameWord(t, said.of) });
    case 'roof_deleted':
      return said.was === undefined ? null : t(KIND.deleted, { name: roofNameWord(t, said.was) });
    case 'sticks_out':
      return t(KIND.sticksOut, { name: roofNameWord(t, said.name) });
    case 'side_wall':
      if (said.walled === 0) return t(KIND.wallsNone);
      return said.walled === said.sides
        ? t(KIND.wallsAllRound)
        : t(KIND.wallsOn, { count: said.walled });
    case 'set_free':
      return t(KIND.setFree, { name: roofNameWord(t, said.name) });
    default:
      return null;
  }
}

/** The line after a roof closes, as the bar draws it: its name, why, and its chips, the lit one first. */
export function kindLineWords(t: T, line: KindLine, height: (metres: number) => string) {
  const { became, joined } = line;
  return {
    /** The chip row's name, for a screen reader. */
    chipsName: t(KIND.whatItIs),
    title:
      joined === null
        ? roofBecameTitle(t, became)
        : t(KIND.joinedWith, { roof: roofNameWord(t, joined) }),
    status: joined === null ? roofBecameStatus(t, became, height) : t(KIND.oneOutline),
    chips: line.chips.map(({ choice, lit }) => ({
      choice,
      lit,
      label: meetChoiceWord(t, choice, became.beside),
    })),
  };
}

/** Why a stretch of the picked roof's side has no parapet: the roof that takes it. */
function noWallWhyLine(t: T, why: NoWallWhy): TranslatedText {
  if (why.why === 'shared') return t(KIND.sharedNoWall, { roof: roofNameWord(t, why.name) });
  if (why.name.kind === 'stair_room') return t(KIND.noWallUnderStair);
  if (why.name.kind === 'upper_floor') return t(KIND.noWallUnderFloor);
  return t(KIND.noWallUnderWall, { roof: roofNameWord(t, why.name) });
}

/** The words of the marks on a roof in the top view: its sides' dots and its tags. */
export function roofTopWords(t: T) {
  return {
    /** A side's dot, spoken: what a tap on it does. */
    sideDot: (number: number, wall: boolean) =>
      t(wall ? KIND.sideWallOff : KIND.sideWallOn, { number }),
    /** The tag by a side a person took the wall off. */
    noWallOnSide: t(KIND.noWallOnSide),
    noWallWhy: (why: NoWallWhy) => noWallWhyLine(t, why),
    /** The tag on a roof past the edge of the roof it stands on: how far, already formatted. */
    sticksOutBy: (length: string) => t(KIND.sticksOutBy, { length }),
    /**
     * The tag on the level line a dragged height pulled to: what it is level with, and the height
     * above the ground, already formatted. A round value has no tag: the number by the arrow says it.
     */
    heightLevel: (to: HeightLevel, height: string): TranslatedText | null => {
      if (to.kind === 'round') return null;
      // Floors as reps count them: G, G+1, G+2.
      if (to.kind === 'floor') {
        const floor = shownAsSent(to.floors === 0 ? 'G' : `G+${to.floors}`);
        return t(KIND.levelFloor, { floor, height });
      }
      if (to.kind === 'other_sides') return t(KIND.levelSides, { height });
      const roof = roofNameWord(t, to.name);
      if (to.kind === 'ridge') return t(KIND.levelRidge, { roof, height });
      return t(to.kind === 'roof_top' ? KIND.levelTop : KIND.levelParapet, { roof, height });
    },
    /** A roof's height above the roof it stands on, on it in the top view: "+3.0 m". */
    above: (height: string) => shownAsSent(`+${height}`),
  };
}
