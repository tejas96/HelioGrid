'use client';
import type { PlanShown, StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph } from '@heliogrid/ui';
import { useRef } from 'react';
import type { useRoofPress } from '../hooks/use-roof-press';
import { pointText } from './roof-marks-place';

/**
 * The plan's move and turn handles while it is picked (`T-M05-002d`, board 4.1, 4.2): a drag of one
 * carries or turns the plan — the turn in 5° steps — and it is kept when the finger lifts, as one
 * change. Placed each frame by the marks' layer, as a roof's handles are.
 */

type Spot = { readonly east: number; readonly north: number };

function Handle({
  plan,
  handle,
  studio,
  words,
  press,
}: {
  plan: PlanShown;
  handle: 'move' | 'turn';
  studio: StudioScreen;
  words: StudioCanvasWords;
  press: ReturnType<typeof useRoofPress>;
}) {
  const { dragPlan } = studio.ownMoves;
  const held = useRef<{ from: Spot; last: Spot } | null>(null);
  const acts = press({
    dragAtOnce: true,
    onDragStart: (at) => {
      held.current = at === null ? null : { from: at, last: at };
    },
    onDrag: (to) => {
      const hold = held.current;
      if (hold === null) return;
      hold.last = to;
      dragPlan(handle, hold.from, to, false);
    },
    onDragEnd: () => {
      const hold = held.current;
      held.current = null;
      if (hold !== null) dragPlan(handle, hold.from, hold.last, true);
    },
    onDragCancel: () => {
      const hold = held.current;
      held.current = null;
      if (hold !== null) dragPlan(handle, hold.from, null, false);
    },
  });
  const at = handle === 'move' ? plan.middle : plan.turnAt;
  return (
    <span className="hg-roof-at" data-at={pointText(at)} {...acts}>
      <Pressable
        className="hg-roof-hit"
        accessibilityLabel={handle === 'move' ? words.movePlan : words.turnPlan}
        ripple="none"
      >
        <span className="hg-roof-handle">
          <ShellGlyph name={handle} size="sm" tone="current" />
        </span>
      </Pressable>
    </span>
  );
}

export function StudioPlanHandles(props: {
  plan: PlanShown;
  studio: StudioScreen;
  words: StudioCanvasWords;
  press: ReturnType<typeof useRoofPress>;
}) {
  return (
    <>
      <Handle {...props} handle="move" />
      <Handle {...props} handle="turn" />
    </>
  );
}
