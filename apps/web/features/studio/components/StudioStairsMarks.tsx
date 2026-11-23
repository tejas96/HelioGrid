'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { GroundPoint } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph } from '@heliogrid/ui';
import { type RefObject, useRef } from 'react';
import type { useRoofPress } from '../hooks/use-roof-press';
import { pointText } from './roof-marks-place';
import type { StudioDrive } from './StudioCameraRig';

/** A finger's width on the screen: a side this near the dragged mark takes it. */
const FINGER_PX = 44;

/**
 * The stairs in the top view (`T-M05-002`, part e, board 7): the round mark where they reach the
 * roof and the green strip of the clear path in front of them. A drag moves the mark onto another
 * side of the stair room or a roof's edge; while held, a tag says "Outside stairs" or what the
 * magnet pulled it to. A reader sees the mark and the strip, and moves nothing.
 */
export function StudioStairsMarks({
  studio,
  words,
  press,
  drive,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  press: ReturnType<typeof useRoofPress>;
  drive: RefObject<StudioDrive | null>;
}) {
  const holder = useRef<HTMLSpanElement>(null);
  const reach = useRef(0);
  const { stairs, stairsLanding: landing, stairsHeld: held } = studio;
  // The stairs are the top view's, as the setback line is.
  if (stairs === null || studio.view !== 'top') return null;
  const editable = studio.editing.kind === 'editor';
  const { moves } = studio;
  // How far a finger's width reaches on the ground, read where the mark is when the drag starts.
  const measure = () => {
    const box = holder.current?.getBoundingClientRect();
    if (box === undefined) return;
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const here = drive.current?.groundAt(x, y, 0) ?? null;
    const there = drive.current?.groundAt(x + FINGER_PX, y, 0) ?? null;
    reach.current =
      here === null || there === null
        ? 0
        : Math.hypot(there.east - here.east, there.north - here.north);
  };
  const beside = (at: GroundPoint): GroundPoint => ({
    east: at.east + reach.current,
    north: at.north,
  });
  const tag = held && landing !== null ? words.stairsTag(landing) : null;
  return (
    <>
      <svg className="hg-roof-lines" aria-hidden="true">
        <path
          className="hg-stairs-strip"
          data-pts={stairs.strip.map(pointText).join(';')}
          data-closed="true"
        />
      </svg>
      <span
        ref={holder}
        className="hg-roof-at"
        data-at={pointText(stairs.at)}
        data-stairs="true"
        {...(editable
          ? press({
              dragAtOnce: true,
              onDragStart: () => {
                measure();
                moves.grabStairs();
              },
              onDrag: (at) => moves.dragStairs(at, beside(at)),
              onDragEnd: () => moves.dropStairs(),
              onDragCancel: () => moves.dropStairs(),
            })
          : {})}
      >
        <Pressable
          className="hg-stairs-mark"
          data-hot={held || undefined}
          accessibilityLabel={editable ? words.stairsPlaced : words.rowStairs}
          ripple="none"
        >
          <ShellGlyph name="steps" size="sm" tone="current" />
        </Pressable>
      </span>
      {tag === null || landing === null ? null : (
        <span className="hg-roof-at" data-at={pointText(landing.at)} data-tag="true">
          <span className="hg-roof-tag" role="status">
            {tag}
          </span>
        </span>
      )}
    </>
  );
}
