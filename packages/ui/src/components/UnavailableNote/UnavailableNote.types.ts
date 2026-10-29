import type { TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
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

/**
 * **A read, as a surface takes it** — the one prop in place of a state and a separate retry. A
 * failed read carries its retry, so a surface cannot say *something went wrong* without *try
 * again*; `unavailable` carries none, so it can never offer one. It is a `Read<T>` with only what a
 * surface draws: a screen passes its read straight in, and its value and failure stay the screen's.
 */
export type SurfaceRead =
  | Pick<Exclude<Read<unknown>, { kind: 'failed' }>, 'kind'>
  | Pick<Extract<Read<unknown>, { kind: 'failed' }>, 'kind' | 'retry'>
  | { readonly kind: 'unavailable' };

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
  title: TranslatedText;
  /** What is true and why, in the product's plain voice. Never blames, never apologises. */
  message?: TranslatedText;
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
