'use client';
import type { StepPlace } from '@heliogrid/domain';

type Standing = 'done' | 'here' | 'ahead';

/** Where each step stands: the steps before the one in hand are done, the ones after it ahead. */
export function standingsOf(rail: readonly StepPlace[]): Standing[] {
  const here = rail.findIndex((place) => place.here);
  return rail.map((_, at) => (at < here ? 'done' : at === here ? 'here' : 'ahead'));
}

/**
 * How far the design has come, as one unbroken line along the screen's top edge: filled up to the
 * step in hand, a quiet track after it. One piece a step with no gap between them, so a new step
 * fills its piece forward and the line reads as one. It takes no room and is never pressed.
 */
export function StudioStepLine({ rail }: { rail: readonly StepPlace[] }) {
  return (
    <span className="hg-studio-step-line" aria-hidden="true">
      {standingsOf(rail).map((standing, at) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: one piece a step, in the steps' own order
        <span key={at} className="hg-studio-step-piece" data-standing={standing} />
      ))}
    </span>
  );
}
