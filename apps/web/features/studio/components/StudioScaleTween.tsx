'use client';
import { theme } from '@heliogrid/theme';
import { useFrame, useThree } from '@react-three/fiber';
import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react';
import type { Group } from 'three';

/** How long the first length takes to grow or shrink the picture and the roofs, in ms. */
const SIZING_MS = theme.motion.durations.standard;

/** An ease that leaves fast and settles: the change lands where the person looks. */
const EASE_POWER = 3;
const easeOut = (t: number) => 1 - (1 - t) ** EASE_POWER;

/**
 * The first true length grows or shrinks the picture and every roof about the pin (`T-M05-002`,
 * part b, *Look and motion*): the model is drawn at its new size at once, and this group carries
 * it from the old size there. `factor` is that share now — 1 at rest — which the page's marks
 * read so they ride along. Reduced motion lands at once.
 */
export function StudioScaleTween({
  scale,
  still,
  factor,
  children,
}: {
  /** The picture's stretch now: each new value is grown into; `null` until the design is read. */
  scale: number | null;
  still: boolean;
  factor: RefObject<number>;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const was = useRef(scale);
  const started = useRef<{ from: number; at: number } | null>(null);
  const invalidate = useThree((three) => three.invalidate);
  useLayoutEffect(() => {
    const before = was.current;
    if (scale === null || scale === before) return;
    was.current = scale;
    // The design read: its stored stretch lands as it is, never grown into.
    if (before === null || still) return;
    // A new stretch mid-run starts from where the model stands now, not from the last target.
    const from = (before * (started.current === null ? 1 : factor.current)) / scale;
    if (!Number.isFinite(from)) return;
    started.current = { from, at: performance.now() };
    factor.current = from;
    group.current?.scale.set(from, 1, from);
    invalidate();
  }, [scale, still, factor, invalidate]);
  useFrame(() => {
    const run = started.current;
    if (run === null) return;
    const t = Math.min(1, (performance.now() - run.at) / SIZING_MS);
    const now = run.from + (1 - run.from) * easeOut(t);
    factor.current = now;
    group.current?.scale.set(now, 1, now);
    if (t < 1) invalidate();
    else started.current = null;
  });
  return <group ref={group}>{children}</group>;
}
