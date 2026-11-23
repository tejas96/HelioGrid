'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofKind, RoofName } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, useFormat } from '@heliogrid/ui';
import { type PointerEvent, useRef } from 'react';
import { pointText } from './roof-marks-place';

/** The kinds whose top carries no height pill. */
const NO_HEIGHT: readonly RoofKind[] = ['hole', 'dormer'];

/** A dragged height within this many pixels of a level pulls to it. */
const PULL_PX = 8;

/** One arrow key on the blue arrow: up or down a step. */
const ARROW_STEP: Readonly<Record<string, 1 | -1>> = { ArrowUp: 1, ArrowDown: -1 };

/**
 * The blue arrow on the open roof's top: a drag up or down changes the height, the walls follow
 * and the number beside it counts with them; let go, it is kept. Up and Down step it by a key.
 */
function HeightArrow({
  studio,
  words,
  units,
  name,
  middle,
  metres,
  top,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  units: MeasurementSystem;
  /** What the roof is called, for the arrow's spoken name. */
  name: RoofName;
  middle: string;
  /** The roof's own height, which the arrow changes and shows. */
  metres: number;
  /** The roof's top above the ground, where the arrow stands. */
  top: number;
}) {
  const format = useFormat();
  const held = useRef<{ y: number; perMetre: number } | null>(null);
  const holder = useRef<HTMLSpanElement>(null);
  const { moves } = studio;
  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    // The placer measures how many screen pixels one metre up takes at the roof's top.
    const perMetre = Number(holder.current?.dataset.perMetre ?? 0);
    held.current = { y: event.clientY, perMetre };
    moves.grabHeight();
  };
  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const press = held.current;
    if (press === null || press.perMetre <= 0) return;
    // The magnet's reach is 0.1 m, or 8 pixels where that is more: the hook caps it.
    moves.dragHeight((press.y - event.clientY) / press.perMetre, PULL_PX / press.perMetre);
  };
  const onPointerUp = (event: PointerEvent<HTMLSpanElement>) => {
    if (held.current === null) return;
    event.stopPropagation();
    held.current = null;
    moves.keepHeight();
  };
  return (
    <span
      ref={holder}
      className="hg-roof-at"
      data-at={middle}
      data-top={top}
      data-arrow="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Pressable
        className="hg-roof-arrow"
        accessibilityLabel={words.heightArrow(name)}
        ripple="none"
        focusGroup={{
          tabbable: true,
          onKey: (key) => {
            const by = ARROW_STEP[key];
            if (by === undefined) return false;
            moves.stepHeight(by);
            return true;
          },
        }}
      >
        <span className="hg-roof-arrow-stem" aria-hidden="true" />
        <span className="hg-roof-len hg-roof-arrow-value" data-kind="typed">
          {format.roofHeight(metres, units)}
        </span>
      </Pressable>
    </span>
  );
}

/**
 * The marks on the roofs in 3D (`T-M05-002`, part b): the result and its height only — each roof's
 * height on its top, a tap on it opening the roof's sheet; the open roof wears a blue ring, a soft
 * fill and the blue arrow. No outline, no length, no corner, no handle.
 */
export function StudioRoofTops({
  studio,
  words,
  units,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  units: MeasurementSystem;
}) {
  const format = useFormat();
  const open = studio.roofSheet?.roof ?? null;
  const editable = studio.editing.kind === 'editor';
  // The height in hand pulled level with something: a line across the model there, and its name.
  const pull = studio.heightPull;
  const level =
    pull === null ? null : words.heightLevel(pull.to, format.roofHeight(pull.levelM, units));
  return (
    <>
      <svg className="hg-roof-lines" aria-hidden="true">
        {pull === null ? null : (
          <path
            className="hg-roof-level"
            data-pts={pull.line.map(pointText).join(';')}
            data-top={pull.levelM}
          />
        )}
        {studio.roofMarks.map((roof, index) =>
          index === open ? (
            <g key={roof.id}>
              <path
                className="hg-roof-picked-fill"
                data-pts={roof.corners.map(pointText).join(';')}
                data-closed="true"
                data-top={studio.scene.levels[index]?.topM ?? 0}
              />
              <path
                className="hg-roof-picked-ring"
                data-pts={roof.corners.map(pointText).join(';')}
                data-closed="true"
                data-top={studio.scene.levels[index]?.topM ?? 0}
              />
            </g>
          ) : null,
        )}
      </svg>
      {pull === null || level === null || pull.line[0] === undefined ? null : (
        <span
          className="hg-roof-at"
          data-at={pointText(pull.line[0])}
          data-top={pull.levelM}
          data-tag="true"
        >
          <span className="hg-roof-tag" data-tone="level" role="status">
            {level}
          </span>
        </span>
      )}
      {studio.roofMarks.map((roof, index) => {
        const metres = studio.heights[index]?.metres ?? 0;
        // A roof on another stands on that roof: its marks sit at its top above the ground.
        const top = studio.scene.levels[index]?.topM ?? 0;
        const name = studio.topMarks[index]?.name ?? { kind: 'roof' as const, number: index + 1 };
        const middle = pointText(roof.middle);
        if (index === open && editable) {
          return (
            <HeightArrow
              key={roof.id}
              studio={studio}
              words={words}
              units={units}
              name={name}
              middle={middle}
              metres={metres}
              top={top}
            />
          );
        }
        // A hole and a dormer have no height of their own to set: a hole is open down to the floor
        // below, and a dormer's ridge follows the roof it sits on.
        if (NO_HEIGHT.includes(studio.topMarks[index]?.kind ?? 'building')) return null;
        const height = format.roofHeight(metres, units);
        return (
          <span key={roof.id} className="hg-roof-at" data-at={middle} data-top={top}>
            <Pressable
              className="hg-roof-hit"
              accessibilityLabel={words.heightOf(name, height)}
              ripple="none"
              onPress={() => studio.moves.openRoof(index)}
            >
              <span className="hg-roof-height" data-open={index === open}>
                {words.heightPill(height)}
              </span>
            </Pressable>
          </span>
        );
      })}
    </>
  );
}
