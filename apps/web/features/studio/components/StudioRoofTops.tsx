'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, useFormat } from '@heliogrid/ui';
import { type PointerEvent, useRef } from 'react';
import { pointText } from './roof-marks-place';

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
  roof,
  middle,
  metres,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  units: MeasurementSystem;
  roof: number;
  middle: string;
  metres: number;
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
    moves.dragHeight((press.y - event.clientY) / press.perMetre);
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
      data-top={metres}
      data-arrow="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Pressable
        className="hg-roof-arrow"
        accessibilityLabel={words.heightArrow(roof + 1)}
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
  return (
    <>
      <svg className="hg-roof-lines" aria-hidden="true">
        {studio.roofMarks.map((roof, index) =>
          index === open ? (
            <g key={roof.id}>
              <path
                className="hg-roof-picked-fill"
                data-pts={roof.corners.map(pointText).join(';')}
                data-closed="true"
                data-top={studio.heights[index]?.metres ?? 0}
              />
              <path
                className="hg-roof-picked-ring"
                data-pts={roof.corners.map(pointText).join(';')}
                data-closed="true"
                data-top={studio.heights[index]?.metres ?? 0}
              />
            </g>
          ) : null,
        )}
      </svg>
      {studio.roofMarks.map((roof, index) => {
        const metres = studio.heights[index]?.metres ?? 0;
        const middle = pointText(roof.middle);
        if (index === open && editable) {
          return (
            <HeightArrow
              key={roof.id}
              studio={studio}
              words={words}
              units={units}
              roof={index}
              middle={middle}
              metres={metres}
            />
          );
        }
        const height = format.roofHeight(metres, units);
        return (
          <span key={roof.id} className="hg-roof-at" data-at={middle} data-top={metres}>
            <Pressable
              className="hg-roof-hit"
              accessibilityLabel={words.heightOf(index + 1, height)}
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
