'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofMarksView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, useFormat } from '@heliogrid/ui';
import { type PointerEvent, useRef } from 'react';
import { pointText } from './roof-marks-place';

/** A dragged height within this many pixels of a level pulls to it. */
const PULL_PX = 8;

/** One arrow key on an arrow: up or down a step. */
const ARROW_STEP: Readonly<Record<string, 1 | -1>> = { ArrowUp: 1, ArrowDown: -1 };

/**
 * A blue arrow on the model (`T-M05-002`, parts b and e): a drag up or down changes the height it
 * stands for — a roof's, a wall's, a ridge's — and the number beside it counts with it; let go, it
 * is kept. Up and Down step it by a key. The placer stands it at `at`, `top` metres up, and
 * measures how many pixels a metre up takes there.
 */
export function DragArrow({
  label,
  value,
  at,
  top,
  kind,
  onGrab,
  onDrag,
  onKeep,
  onStep,
}: {
  label: TranslatedText;
  value: string;
  at: string;
  top: number;
  /** Which height it sets: the roof's, a wall's or the ridge's. */
  kind: 'roof' | 'wall' | 'ridge';
  onGrab: () => void;
  /** How far the pointer rose, in metres, and the magnet's reach in metres there. */
  onDrag: (risenM: number, reachM: number) => void;
  onKeep: () => void;
  onStep: (by: 1 | -1) => void;
}) {
  const held = useRef<{ y: number; perMetre: number } | null>(null);
  const holder = useRef<HTMLSpanElement>(null);
  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const perMetre = Number(holder.current?.dataset.perMetre ?? 0);
    held.current = { y: event.clientY, perMetre };
    onGrab();
  };
  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const press = held.current;
    if (press === null || press.perMetre <= 0) return;
    onDrag((press.y - event.clientY) / press.perMetre, PULL_PX / press.perMetre);
  };
  const onPointerUp = (event: PointerEvent<HTMLSpanElement>) => {
    if (held.current === null) return;
    event.stopPropagation();
    held.current = null;
    onKeep();
  };
  return (
    <span
      ref={holder}
      className="hg-roof-at"
      data-at={at}
      data-top={top}
      data-arrow="true"
      data-arrow-kind={kind}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Pressable
        className="hg-roof-arrow"
        accessibilityLabel={label}
        ripple="none"
        focusGroup={{
          tabbable: true,
          onKey: (key) => {
            const by = ARROW_STEP[key];
            if (by === undefined) return false;
            onStep(by);
            return true;
          },
        }}
      >
        <span className="hg-roof-arrow-stem" aria-hidden="true" />
        <span className="hg-roof-len hg-roof-arrow-value" data-kind="typed">
          {value}
        </span>
      </Pressable>
    </span>
  );
}

/** The middle of a roof's side on the plan, as the placer reads it. */
function sideMiddle(marks: RoofMarksView, side: number): string | null {
  const from = marks.corners[side];
  const to = marks.corners[(side + 1) % marks.corners.length];
  if (from === undefined || to === undefined) return null;
  return pointText({ east: (from.east + to.east) / 2, north: (from.north + to.north) / 2 });
}

/**
 * The side lit on the model, with its own wall arrow where it has a wall (board 6.3): a drag sets
 * that side's parapet height. Where it has none, the side is lit along its edge.
 */
export function LitSide({
  studio,
  marks,
  units,
  words,
}: {
  studio: StudioScreen;
  marks: RoofMarksView;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const side = studio.sideRows;
  if (side === null) return null;
  const at = sideMiddle(marks, side.side);
  const top = studio.scene.levels[side.roof]?.topM ?? 0;
  const from = marks.corners[side.side];
  const to = marks.corners[(side.side + 1) % marks.corners.length];
  if (at === null || from === undefined || to === undefined) return null;
  const wall = side.parapetHeight;
  const { moves } = studio;
  return (
    <>
      <svg className="hg-roof-lines" aria-hidden="true">
        {wall === null ? null : (
          <path
            className="hg-roof-side-face"
            data-pts={[
              `${pointText(from)} ${top}`,
              `${pointText(to)} ${top}`,
              `${pointText(to)} ${top + wall.value}`,
              `${pointText(from)} ${top + wall.value}`,
            ].join(';')}
            data-closed="true"
            data-top={top}
          />
        )}
        <path
          className="hg-roof-side-lit"
          data-pts={[from, to].map(pointText).join(';')}
          data-top={top + (wall?.value ?? 0)}
        />
      </svg>
      {wall === null || studio.editing.kind !== 'editor' ? null : (
        <DragArrow
          kind="wall"
          label={words.wallArrow}
          value={format.roofHeight(wall.value, units)}
          at={at}
          top={top + wall.value}
          onGrab={() => moves.grabWall(wall.value)}
          onDrag={(risenM) => moves.dragWall(risenM)}
          onKeep={moves.keepNumber}
          onStep={(by) => moves.setNumber('parapet_height', wall.value + by * wall.slide.step)}
        />
      )}
    </>
  );
}

/** The ridge's own height arrow (board 9.8): a drag sets the ridge's height, and the slope follows. */
export function RidgeArrow({
  studio,
  units,
  words,
}: {
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const rows = studio.sheetRows;
  const slope = rows?.slope;
  if (rows == null || slope == null || slope.ridge === null) return null;
  if (studio.editing.kind !== 'editor' || studio.sheetPart.kind !== 'roof') return null;
  const { from, to } = slope.ridge;
  const at = pointText({ east: (from.east + to.east) / 2, north: (from.north + to.north) / 2 });
  const low = studio.scene.levels[rows.roof]?.topM ?? 0;
  const { moves } = studio;
  const degrees = slope.number.value;
  return (
    <DragArrow
      kind="ridge"
      label={words.ridgeArrow}
      value={format.roofHeight(slope.ridgeAboveM, units)}
      at={at}
      top={low + slope.ridgeAboveM}
      onGrab={() => moves.grabRidge(slope.ridgeAboveM, degrees)}
      onDrag={(risenM) => moves.dragRidge(risenM)}
      onKeep={moves.keepNumber}
      onStep={(by) => moves.setNumber('slope', degrees + by * slope.number.slide.step)}
    />
  );
}
