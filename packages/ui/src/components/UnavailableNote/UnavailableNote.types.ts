import type { ReactNode } from 'react';

/**
 * **The system's one surface-state vocabulary.** Five members, and the fifth is the fourth *idea*:
 *
 * - `ready` — has content.
 * - `loading` — content is coming. Never a placeholder value presented as a real one.
 * - `empty` — there is none **yet**, and there could be. Encouraging voice, often an action that
 *   creates the first one.
 * - `error` — something went wrong. Warning tint, and a **retry**, because trying again may work.
 * - `unavailable` — **this was never going to be here, and that is fine.** Neutral, no alarm, and
 *   **no retry, ever**: no coverage for this pin, no provider in this market, a market that
 *   declares no schemes, a result that cannot be produced (`M05-18`, `SCR-MS-04`, `SCR-MS-09`,
 *   `SCR-MS-05`, `MS4-09`). Rendered by `UnavailableNote`.
 *
 * Every surface in the system takes this union, so nobody spells the fourth state privately again.
 */
export type SurfaceState = 'ready' | 'loading' | 'empty' | 'error' | 'unavailable';

/** `["ready","loading","empty","error","unavailable"]`. */
export const SURFACE_STATES: SurfaceState[] = ['ready', 'loading', 'empty', 'error', 'unavailable'];

/** True for every state whose surface must not draw content — or a number. */
export function isBlockedState(state?: SurfaceState | string): boolean {
  return state === 'loading' || state === 'empty' || state === 'error' || state === 'unavailable';
}

export type UnavailableNoteVariant = 'note' | 'region';
export type UnavailableNoteAlign = 'start' | 'center';

export interface UnavailableNoteProps {
  /** The sentence's subject — "No tile coverage here", "This market declares no schemes". */
  title?: string;
  /** What is true and why, in the product's plain voice. Never blames, never apologises. */
  message?: string;
  /** A quiet third line: a scope, a date, a rule that was applied. */
  detail?: ReactNode;
  /** Replaces the slashed-circle mark. Keep it neutral — never the warning glyph. */
  icon?: ReactNode;
  /**
   * One **forward** action, and it is never a retry: "Open the checklist", "See covered areas". A
   * retry would claim that trying again could change the answer.
   */
  action?: ReactNode;
  /** `note` (default) — a quiet line inside a frame. `region` — the centred body of a surface. */
  variant?: UnavailableNoteVariant;
  align?: UnavailableNoteAlign;
}
