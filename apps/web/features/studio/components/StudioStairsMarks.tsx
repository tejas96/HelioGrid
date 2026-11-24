'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { GroundPoint } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph } from '@heliogrid/ui';
import { useRef } from 'react';
import type { useRoofPress } from '../hooks/use-roof-press';
import { pointText } from './roof-marks-place';

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
  besideAt,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  press: ReturnType<typeof useRoofPress>;
  /** The ground a finger's half-width to the side of a point of the screen. */
  besideAt: (clientX: number, clientY: number) => GroundPoint | null;
}) {
  const holder = useRef<HTMLSpanElement>(null);
  const reach = useRef(0);
  const { stairs, stairsLanding: landing, stairsHeld: held } = studio;
  // The stairs are the top view's, as the setback line is.
  if (stairs === null || studio.view !== 'top') return null;
  const editable = studio.editing.kind === 'editor';
  const { moves } = studio;
  // How far a finger's width reaches on the ground, read where the mark is when the drag starts.
  const measure = (at: GroundPoint | null) => {
    const box = holder.current?.getBoundingClientRect();
    const there =
      box === undefined ? null : besideAt(box.left + box.width / 2, box.top + box.height / 2);
    reach.current =
      at === null || there === null ? 0 : Math.hypot(there.east - at.east, there.north - at.north);
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
              // A tap that barely moves is no drag: the guess stays a guess.
              onDragStart: (at) => {
                measure(at);
                moves.grabStairs();
              },
              onDrag: (at) => moves.dragStairs(at, beside(at)),
              onDragEnd: () => moves.dropStairs(),
              onDragCancel: () => moves.cancelStairs(),
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
