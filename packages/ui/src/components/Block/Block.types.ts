import type { ReactNode } from 'react';
import { clampCount } from '../../utils/count';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceState } from '../UnavailableNote';

/**
 * **An alias, not a second union.** A block is a surface, so its states are the system's five
 * (law 1) — re-declaring them locally read identically and drifted the moment `SurfaceState`
 * changed, which is the whole reason there is one vocabulary. Kept as a name because screens read
 * `BlockState` in their own types.
 *
 * - `ready` — has content.
 * - `loading` — content is coming.
 * - `empty` — **there is nothing, and that is the answer.** The block says so and stays.
 * - `error` — the fetch failed; offers a retry.
 * - `unavailable` — the block can't apply here at all (no coverage for this pin, no provider in
 *   this market). Different from empty: empty means "none yet", unavailable means "not a thing
 *   here", and a retry would be a lie.
 */
export type BlockState = SurfaceState;

export interface BlockProps {
  /** Uppercase micro-label above the title. */
  overline?: string;
  title?: string;
  /** The object this block reads and the version in force (`M08-16`) — "Quote v4 · 12 Aug 2026". */
  meta?: ReactNode;
  /** Header-right slot: a link, a small button, a menu. */
  action?: ReactNode;
  /**
   * **How many** — the block's summary count, a tabular numeral in a neutral pill in the header. It
   * renders whether or not there is a `title`: an overline-only block (`overline="AGENT CALLS"`,
   * `count={6}` — the `SCR-M07-01` / `M13-10` shape) shows the numeral beside the overline.
   *
   * A **total**, not an unread badge: grouped by the market pack (`1,240`, not `99+`) and **not**
   * `CountBadge`, whose accessible name says "unread" and whose tone is danger. Nothing is drawn at
   * zero — a block with none of something uses `state="empty"`, a sentence rather than a 0.
   */
  count?: number;
  /** Clamp the numeral: `countMax={99}` renders "99+". Unset by default, because clamping a total lies. */
  countMax?: number;
  /** Words for the count in the accessible name — "documents", "open blockers". */
  countLabel?: string;
  /**
   * In the header row beside the count — a `StatusChip` or a provider badge, with or without a
   * `title`. **A count goes in `count`, not here.**
   */
  badge?: ReactNode;
  /** Footer-right content: an honest caveat, a source note, a timestamp. */
  footer?: ReactNode;
  /** Provenance for the block's figures, rendered in the footer. */
  provenance?: ProvenanceProps | ProvenanceTierSpec | ReactNode;
  state?: BlockState;
  /** The empty sentence. Say what is true — "No blockers — nothing is waiting on anyone". */
  emptyMessage?: string;
  emptyTitle?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  unavailableTitle?: string;
  unavailableMessage?: string;
  density?: 'expressive' | 'functional';
  /** Drops the surface and shadow — for a block already sitting inside a card or a sheet. */
  flat?: boolean;
  children?: ReactNode;
}

export interface BlockGridProps {
  children?: ReactNode;
  /** Minimum column width before wrapping. Default 320. */
  min?: number;
  gap?: number;
  /** Fixed column count instead of auto-fit. */
  columns?: number;
}

/**
 * A total GROUPS rather than clamping — "1,240 documents" clamped to "99+" would be a lie about a
 * number the block is reporting — so it clamps only when a caller asks with `countMax`, and nothing
 * is drawn at zero.
 */
export function blockCount(
  count: number | undefined,
  countMax: number | undefined,
  group: (n: number) => string,
): string | null {
  if (typeof count !== 'number' || count <= 0) return null;
  return clampCount(count, countMax, group);
}
