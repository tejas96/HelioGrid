'use client';
import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react';

/**
 * A tool that holds the keyboard focus and goes, or turns off, hands the focus to `to` (the pencil):
 * read before it goes, as once it is out of the page or off the browser has already let go.
 */
export function useHandFocus(
  gone: boolean,
  box: RefObject<HTMLElement | null>,
  to: RefObject<HTMLElement | null> | undefined,
): void {
  const was = useRef(gone);
  const held = useRef(false);
  if (!was.current && gone) held.current = box.current?.contains(document.activeElement) ?? false;
  was.current = gone;
  useLayoutEffect(() => {
    if (!gone || !held.current) return;
    held.current = false;
    to?.current?.querySelector<HTMLElement>('button')?.focus();
  }, [gone, to]);
}

/**
 * A tool the job in hand may set aside (`focus.ts`): set aside, it takes no place in its column, no
 * tap and no keyboard focus; it rises back into its place when the job ends. The columns stand on
 * the foot, so a tool coming or going moves only the tools above it, never one under a finger.
 * A tool that goes, or turns off (`off`), while it holds the focus hands it to `focusTo` (the pencil).
 */
export function Shown({
  when,
  off = false,
  focusTo,
  children,
}: {
  when: boolean;
  off?: boolean;
  focusTo?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const box = useRef<HTMLSpanElement>(null);
  useHandFocus(!when || off, box, focusTo);
  return (
    <span ref={box} className="hg-studio-focus" data-hidden={!when} inert={!when}>
      {children}
    </span>
  );
}
