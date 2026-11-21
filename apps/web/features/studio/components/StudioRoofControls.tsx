'use client';
import { type StudioScreen, useRepeatPress } from '@heliogrid/data/react';
import type {
  EdgeView,
  GroundPoint,
  MeasurementSystem,
  RoofGrip,
  RoofMarksView,
} from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';
import { MathUtils } from 'three';
import type { PressActs } from '../hooks/use-roof-press';
import { pointText } from './roof-marks-place';
import { StudioLengthLabel } from './StudioLengthLabel';

/** The angle of a picked corner stands this many × steps out, past its ×. */
const ANGLE_OUT = 2.2;

/** The holder's drag handlers, from `useRoofPress`. */
type Press = (acts: PressActs) => Record<string, unknown>;

interface RoofFacts {
  readonly roof: RoofMarksView;
  readonly index: number;
  readonly studio: StudioScreen;
  /** The marks sit on the roof's top, in 3D; on the ground, in the top view. */
  readonly onTop: boolean;
  readonly words: StudioCanvasWords;
  readonly press: Press;
}

const middleOf = (edge: EdgeView): GroundPoint => ({
  east: (edge.from.east + edge.to.east) / 2,
  north: (edge.from.north + edge.to.north) / 2,
});

/** A drag that grabs `grip` where the mark is, follows the pointer and lets go. */
function dragOf(studio: StudioScreen, grip: RoofGrip, at: GroundPoint): PressActs {
  return {
    onDragStart: () => studio.moves.grab(grip, at),
    onDrag: (to) => studio.moves.drag(to),
    onDragEnd: () => studio.moves.release(),
  };
}

/** The length in hand: its number between − and +, which step and repeat while held. */
function SteppedLength({ text, trust, facts }: { text: string; trust: string; facts: RoofFacts }) {
  const repeat = useRepeatPress();
  const { studio, words } = facts;
  // A press by pointer steps at once and repeats while held; its click is then not a second step.
  // A key's press is the click alone.
  const byPointer = useRef(false);
  const step = (by: 1 | -1) => (
    <Pressable
      className="hg-roof-hit"
      accessibilityLabel={by === 1 ? words.lengthLonger : words.lengthShorter}
      disabled={by === 1 ? studio.stepOff.more : studio.stepOff.less}
      ripple="none"
      onPress={() => {
        if (byPointer.current) byPointer.current = false;
        else studio.moves.stepLength(by);
      }}
    >
      <span
        className="hg-roof-step-act"
        onPointerDown={() => {
          byPointer.current = true;
          repeat.start(() => studio.moves.stepLength(by));
        }}
        onPointerUp={repeat.stop}
        onPointerLeave={repeat.stop}
      >
        <ShellGlyph name={by === 1 ? 'plus' : 'minus'} size="xs" tone="current" />
      </span>
    </Pressable>
  );
  return (
    <span className="hg-roof-len hg-roof-step" data-kind={trust}>
      {step(-1)}
      <span className="hg-roof-len-num">{text}</span>
      {trust === 'measured' ? <ShellGlyph name="check" size="xs" tone="current" /> : null}
      {step(1)}
    </span>
  );
}

/** Each edge's length, outside its edge: a tap opens its box. */
function EdgeLengths({ facts, units }: { facts: RoofFacts; units: MeasurementSystem }) {
  const format = useFormat();
  const { roof, index, studio, onTop, words } = facts;
  const step = studio.roofStep;
  const editable = studio.editing.kind === 'editor';
  const inHand = step.kind === 'sizing' && step.roof === index ? step.edge : null;
  const live =
    step.kind === 'dragging' &&
    step.grip.roof === index &&
    (step.grip.kind === 'corner' || step.grip.kind === 'plus');
  const middle = pointText(roof.middle);
  return roof.edges.map((edge, i) => {
    const text = format.roofLength(edge.metres, units, edge.trust === 'traced');
    return (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: an edge is its place in the roof
        key={`len${i}`}
        className="hg-roof-at"
        data-edge={`${pointText(edge.from)}|${pointText(edge.to)}|${middle}`}
        data-top={onTop}
      >
        {inHand === i ? (
          <SteppedLength text={text} trust={edge.trust} facts={facts} />
        ) : (
          <StudioLengthLabel
            text={text}
            kind={edge.trust}
            pulse={edge.pulse && editable && step.kind === 'idle'}
            live={live}
            label={editable ? words.edgeLength(i + 1, text) : null}
            onOpen={
              editable && step.kind !== 'drawing' ? () => studio.moves.pickLength(index, i) : null
            }
          />
        )}
      </span>
    );
  });
}

/** The + on each edge: drag it out, and it is a new corner; a key adds one in place. */
function EdgePluses({ facts }: { facts: RoofFacts }) {
  const { roof, index, studio, onTop, words, press } = facts;
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
        data-top={onTop}
        {...press({ dragAtOnce: true, ...dragOf(studio, grip, at) })}
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
  const { roof, index, studio, onTop, words, press } = facts;
  const step = studio.roofStep;
  const picked = step.kind === 'idle' && step.picked?.roof === index ? step.picked.corner : null;
  const held =
    step.kind === 'dragging' && step.grip.roof === index
      ? step.grip.kind === 'corner'
        ? step.grip.corner
        : step.grip.kind === 'plus'
          ? step.grip.edge + 1
          : null
      : null;
  const pick = (i: number) =>
    studio.moves.pickCorner(picked === i ? null : { roof: index, corner: i });
  return roof.corners.map((corner, i) => (
    <span
      // biome-ignore lint/suspicious/noArrayIndexKey: a corner is its place in the roof
      key={`dot${i}`}
      className="hg-roof-at"
      data-at={pointText(corner)}
      data-top={onTop}
      {...press({
        ...dragOf(studio, { kind: 'corner', roof: index, corner: i }, corner),
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
  const { roof, index, studio, onTop, words } = facts;
  const step = studio.roofStep;
  const picked = step.kind === 'idle' && step.picked?.roof === index ? step.picked.corner : null;
  const corner = picked === null ? undefined : roof.corners[picked];
  if (picked === null || corner === undefined) return null;
  const holder = {
    'data-at': pointText(corner),
    'data-away': pointText(roof.middle),
    'data-top': onTop,
  };
  return (
    <>
      <span className="hg-roof-at" {...holder}>
        <Pressable
          className="hg-roof-hit"
          accessibilityLabel={words.cornerRemove(picked + 1)}
          ripple="none"
          onPress={studio.moves.removeCorner}
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

/** One arrow key's move of a whole roof, in metres, and its turn, in degrees. */
const KEY_MOVE_M = 0.1;
const KEY_TURN_DEGREES = 1;
const RADIANS_PER_DEGREE = MathUtils.DEG2RAD;
const ARROW_WAY: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/**
 * A handle answers the arrow keys as a drag would: move steps the roof east, west, north or south;
 * turn turns it one degree, left anticlockwise, right clockwise. Each press is one change.
 */
function handleKeys(facts: RoofFacts, kind: 'move' | 'turn') {
  return (key: string): boolean => {
    const way = ARROW_WAY[key];
    if (way === undefined) return false;
    const { studio, roof, index } = facts;
    const { east, north } = roof.middle;
    const [x, y] = way;
    if (kind === 'move') {
      studio.moves.grab({ kind, roof: index }, roof.middle);
      studio.moves.drag({ east: east + x * KEY_MOVE_M, north: north + y * KEY_MOVE_M });
    } else {
      if (x === 0) return false;
      const turn = -x * KEY_TURN_DEGREES * RADIANS_PER_DEGREE;
      studio.moves.grab({ kind, roof: index }, { east: east + 1, north });
      studio.moves.drag({ east: east + Math.cos(turn), north: north + Math.sin(turn) });
    }
    studio.moves.release();
    return true;
  };
}

/** The move and the turn handle: each takes hold where the pointer goes down, or answers arrows. */
function RoofHandles({ facts }: { facts: RoofFacts }) {
  const { roof, index, studio, onTop, words, press } = facts;
  const step = studio.roofStep;
  const held = step.kind === 'dragging' && step.grip.roof === index ? step.grip.kind : null;
  return (['move', 'turn'] as const).map((kind) => (
    <span
      key={kind}
      className="hg-roof-at"
      data-handle={kind}
      data-roof={index}
      data-middle={pointText(roof.middle)}
      data-top={onTop}
      {...press({
        dragAtOnce: true,
        onDragStart: (at) => {
          if (at !== null) studio.moves.grab({ kind, roof: index }, at);
        },
        onDrag: (to) => studio.moves.drag(to),
        onDragEnd: () => studio.moves.release(),
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
 * One roof's controls on the model (`T-M05-002`, part b), in the top view and in 3D alike: the
 * length of each edge (a tap opens its box; the one in hand carries − and +), the + on each edge,
 * the corner dots (a drag moves one, a tap picks it), the × and angle of a picked corner, and the
 * move and turn handles. A reader who may not edit sees the lengths alone.
 */
export function StudioRoofControls({
  roof,
  index,
  studio,
  onTop,
  units,
  words,
  press,
}: RoofFacts & { units: MeasurementSystem }) {
  const facts: RoofFacts = { roof, index, studio, onTop, words, press };
  const step = studio.roofStep;
  const editable = studio.editing.kind === 'editor';
  const drawing = step.kind === 'drawing';
  const tools = editable && !drawing && step.kind !== 'sizing';
  return (
    <div className="hg-roof-on" data-quiet={drawing}>
      <EdgeLengths facts={facts} units={units} />
      {tools ? <EdgePluses facts={facts} /> : null}
      {editable && !drawing ? <CornerDots facts={facts} /> : null}
      <PickedCorner facts={facts} />
      {tools ? <RoofHandles facts={facts} /> : null}
    </div>
  );
}
