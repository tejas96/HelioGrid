'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { EdgeView, GroundPoint, RoofGrip, RoofMarksView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { type FocusAfter, landFocusOn, Pressable, ShellGlyph, useFormat } from '@heliogrid/ui';
import type { PressActs } from '../hooks/use-roof-press';
import { pointText } from './roof-marks-place';

/** The angle of a picked corner stands this many × steps out, past its ×. */
const ANGLE_OUT = 2.2;

/** The holder's drag handlers, from `useRoofPress`. */
type Press = (acts: PressActs) => Record<string, unknown>;

interface RoofFacts {
  readonly roof: RoofMarksView;
  readonly index: number;
  readonly studio: StudioScreen;
  readonly words: StudioCanvasWords;
  readonly press: Press;
  /** Where focus goes when the × leaves with its corner: the map. */
  readonly afterRemove: FocusAfter;
}

const middleOf = (edge: EdgeView): GroundPoint => ({
  east: (edge.from.east + edge.to.east) / 2,
  north: (edge.from.north + edge.to.north) / 2,
});

/** A drag that grabs `grip` where the mark is, follows the pointer and lets go. */
function dragOf(studio: StudioScreen, grip: RoofGrip, at: GroundPoint): PressActs {
  return {
    onDragStart: () => studio.moves.grab(grip, at),
    onDrag: (to, scale) => studio.moves.drag(to, scale),
    onDragEnd: () => studio.moves.release(),
    onDragCancel: () => studio.moves.cancel(),
  };
}

/**
 * The + on each edge: drag it out, and it is a new corner; a key adds one in place. A press that
 * never moves adds none: a brushed + must not split an edge and lose the length set on it.
 */
function EdgePluses({ facts, away }: { facts: RoofFacts; away: boolean }) {
  const { roof, index, studio, words, press } = facts;
  const middle = pointText(roof.middle);
  return roof.edges.map((edge, i) => {
    const grip: RoofGrip = { kind: 'plus', roof: index, edge: i };
    const at = middleOf(edge);
    return (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: an edge is its place in the roof
        key={`plus${i}`}
        className="hg-roof-at"
        data-edge={`${pointText(edge.from)}|${pointText(edge.to)}|${middle}`}
        data-plus="true"
        data-away={away}
        {...press(dragOf(studio, grip, at))}
      >
        <Pressable
          className="hg-roof-hit"
          accessibilityLabel={words.cornerAdd}
          ripple="none"
          onPress={() => {
            studio.moves.grab(grip, at);
            studio.moves.release();
          }}
        >
          <span className="hg-roof-plus">
            <ShellGlyph name="plus" size="xs" tone="current" />
          </span>
        </Pressable>
      </span>
    );
  });
}

/** The corner dots: a drag moves one with the magnet, a tap picks it. */
function CornerDots({ facts }: { facts: RoofFacts }) {
  const { roof, index, studio, words, press } = facts;
  const step = studio.roofStep;
  const picked = step.kind === 'idle' && step.picked?.roof === index ? step.picked.corner : null;
  const held = studio.heldCorner?.roof === index ? studio.heldCorner.corner : null;
  const pick = (i: number) =>
    studio.moves.pickCorner(picked === i ? null : { roof: index, corner: i });
  return roof.corners.map((corner, i) => (
    <span
      // biome-ignore lint/suspicious/noArrayIndexKey: a corner is its place in the roof
      key={`dot${i}`}
      className="hg-roof-at"
      data-at={pointText(corner)}
      data-dot-roof={index}
      {...press({
        // Dots that crowd overlap: the drag takes the corner nearest the finger.
        onDragStart: (at) => {
          const nearest = at === null ? i : studio.cornerNearest(index, at);
          const held = roof.corners[nearest] ?? corner;
          studio.moves.grab({ kind: 'corner', roof: index, corner: nearest }, held);
        },
        onDrag: (to, scale) => studio.moves.drag(to, scale),
        onDragEnd: () => studio.moves.release(),
        onDragCancel: () => studio.moves.cancel(),
        onTap: () => pick(i),
      })}
    >
      <Pressable
        className="hg-roof-hit"
        accessibilityLabel={words.cornerName(i + 1)}
        accessibilityState={{ selected: picked === i }}
        ripple="none"
        onPress={() => pick(i)}
      >
        <span className="hg-roof-dot" data-hot={held === i} data-picked={picked === i} />
      </Pressable>
    </span>
  ));
}

/** The picked corner's × and its angle, stood out from the corner, away from the roof's middle. */
function PickedCorner({ facts }: { facts: RoofFacts }) {
  const format = useFormat();
  const { roof, index, studio, words } = facts;
  const step = studio.roofStep;
  const picked = step.kind === 'idle' && step.picked?.roof === index ? step.picked.corner : null;
  const corner = picked === null ? undefined : roof.corners[picked];
  if (picked === null || corner === undefined) return null;
  const holder = { 'data-at': pointText(corner), 'data-away': pointText(roof.middle) };
  return (
    <>
      <span className="hg-roof-at" {...holder}>
        <Pressable
          className="hg-roof-hit"
          accessibilityLabel={words.cornerRemove(picked + 1)}
          ripple="none"
          onPress={() => {
            studio.moves.removeCorner();
            // The × leaves with its corner: focus goes on to the map.
            landFocusOn(facts.afterRemove);
          }}
        >
          <span className="hg-roof-remove">
            <ShellGlyph name="close" size="xs" tone="current" />
          </span>
        </Pressable>
      </span>
      {studio.pickedAngle === null ? null : (
        <span className="hg-roof-at" {...holder} data-out={ANGLE_OUT}>
          <span className="hg-roof-tag hg-roof-angle">{`${format.number(studio.pickedAngle)}°`}</span>
        </span>
      )}
    </>
  );
}

/** An arrow key's way: east, west, north or south. */
const ARROW_WAY: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/**
 * A handle answers the arrow keys as a drag would: move steps the roof east, west, north or south;
 * turn turns it, left anticlockwise, right clockwise. Each press is one change.
 */
function handleKeys(facts: RoofFacts, kind: 'move' | 'turn') {
  return (key: string): boolean => {
    const way = ARROW_WAY[key];
    if (way === undefined || (kind === 'turn' && way[0] === 0)) return false;
    facts.studio.moves.nudgeRoof(facts.index, kind, way[0], way[1]);
    return true;
  };
}

/** The move and the turn handle: each takes hold where the pointer goes down, or answers arrows. */
function RoofHandles({ facts }: { facts: RoofFacts }) {
  const { roof, index, studio, words, press } = facts;
  const step = studio.roofStep;
  const held = step.kind === 'dragging' && step.grip.roof === index ? step.grip.kind : null;
  return (['move', 'turn'] as const).map((kind) => (
    <span
      key={kind}
      className="hg-roof-at"
      data-handle={kind}
      data-roof={index}
      data-middle={pointText(roof.middle)}
      {...press({
        dragAtOnce: true,
        onDragStart: (at) => {
          if (at !== null) studio.moves.grab({ kind, roof: index }, at);
        },
        onDrag: (to, scale) => studio.moves.drag(to, scale),
        onDragEnd: () => studio.moves.release(),
        onDragCancel: () => studio.moves.cancel(),
      })}
    >
      <Pressable
        className="hg-roof-hit"
        accessibilityLabel={kind === 'move' ? words.moveRoof : words.turnRoof}
        focusGroup={{ tabbable: true, onKey: handleKeys(facts, kind) }}
        ripple="none"
      >
        <span className="hg-roof-handle" data-hot={held === kind}>
          <ShellGlyph name={kind} size="sm" tone="current" />
        </span>
      </Pressable>
    </span>
  ));
}

/**
 * One roof's edit controls (`T-M05-002`, part b), in the top view only: the corner dots (a drag
 * moves one with the magnet, a tap picks it), the × and angle of a picked corner, the + on each
 * edge with room, and the move and turn handles — the + dots and the handles on the roof picked
 * alone, so roofs side by side stay clear. There are no tool modes: a drag anywhere else moves the
 * map; a tap inside a roof picks it. While a length is set the dots stay and the rest steps
 * aside; while a drag is in hand the + dots step aside.
 */
export function StudioRoofEdit({
  roof,
  index,
  studio,
  words,
  press,
  afterRemove,
  picked,
}: RoofFacts & {
  /** The roof picked, or the one a job holds: its + dots and handles show with its corners. */
  picked: boolean;
}) {
  const facts: RoofFacts = { roof, index, studio, words, press, afterRemove };
  const step = studio.roofStep;
  const tools = picked && (step.kind === 'idle' || step.kind === 'dragging');
  return (
    <div className="hg-roof-on">
      {/* The + dragged out stays mounted under the pointer, or its let-go is lost; unseen meanwhile. */}
      {picked &&
      (step.kind === 'idle' || (step.kind === 'dragging' && step.grip.kind === 'plus')) ? (
        <EdgePluses facts={facts} away={step.kind !== 'idle'} />
      ) : null}
      <CornerDots facts={facts} />
      <PickedCorner facts={facts} />
      {tools ? <RoofHandles facts={facts} /> : null}
    </div>
  );
}
