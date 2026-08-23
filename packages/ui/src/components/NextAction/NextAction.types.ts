import type { ReactNode } from 'react';
import type { ActorClassSpec } from '../ActorClass';
import type { FieldOverrideSpec } from '../FieldOverride';
import type { PendingActionSpec } from '../PendingAction';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';

/** `overdue` is the only red case, so red keeps meaning something. */
export type NextActionTone = 'due' | 'overdue' | 'soon' | 'scheduled' | 'snoozed' | 'done';

export interface NextActionProps {
  label: string;
  /** Appended after a middot — a date or a countdown. */
  meta?: string;
  tone?: NextActionTone;
  muted?: boolean;
  /**
   * **Why this task exists** — `M07-06` (P0): a rep always sees WHY A TASK EXISTS, and `M07-03`:
   * agent activity is a separate block, NEVER MIXED with the rep's own tasks. Rendered by
   * `ActorClass` in its `origin` form, under the task.
   *
   * `verb` is how `SCR-M07-04` distinguishes a human reopen from an automatic resurface — in
   * words, never as a shade of one glyph. The marker is half the law: the agent's tasks are also
   * their OWN block, and this slot does not license mixing them into the rep's list.
   */
  origin?: ActorClassSpec;
  /**
   * **The rep corrected the agent, and both readings stay visible** — `SCR-M07-13`'s
   * `rep-corrected`. That is a superseded value, so it takes the system's one superseded-value
   * treatment: a `FieldOverride` spec, rendered under `origin`.
   */
  correction?: FieldOverrideSpec;
  /** Type size for the task line, px/dp. Default 13. */
  size?: number;
}

export interface RecordCardProps {
  name: string;
  /** Defaults to the initials of `name`. */
  initials?: string;
  /** Colour of the initials circle tint — a DS colour token reference, never a raw colour. */
  avatarTone?: string;
  /**
   * The row's **one lifecycle state** — usually a `StatusChip`. What the record *is*. Singular on
   * purpose; facts the record *has* go in `marks`.
   */
  chip?: ReactNode;
  /**
   * Marks that can be true at the same time — `SCR-M06-19`: both conditions can be true on the
   * same row at once and MUST STAY SEPARATELY READABLE, two different facts, never merged into
   * one badge. Rendered through `MarkRow`: no collapse, no merge, wraps.
   */
  marks?: ReactNode | ReactNode[];
  /** Mono meta parts, joined by middots: ["Nashik", "8.2 kWp", "₹4,52,000"]. */
  meta?: ReactNode[];
  /**
   * Bottom line — usually a `NextAction`, and **it may hold real buttons**: "Call", "Collect",
   * "Upload WCR". The whole-card target is a target BESIDE the content rather than a wrapper
   * around it, so a control here is separately reachable and a tap on it fires only itself.
   */
  action?: ReactNode;
  onClick?: () => void;
  /** The row target's accessible name. Defaults to `name`. */
  ariaLabel?: string;
  /**
   * **This record's own standing and tier** — `M11-42` (P0): money the tenant's account confirmed
   * and money a person says arrived are visibly different things, ON EVERY SURFACE, and the ledger
   * is read on a phone. Rendered under the mono `meta` line, above `action`.
   *
   * A record whose value is a **named gap** takes none — a gap is not a figure (law 10).
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /**
   * **An act on this card is in flight** — `M02-67` (P0) / `SCR-M02-02`: until it confirms, the
   * row shows the action IN PROGRESS, NEVER AS DONE, light and in-row, never a blocking overlay.
   * Rendered by `PendingAction` **directly above `action`**.
   *
   * The card is **not** dimmed (`muted` is a different fact) and `action` is **not** disabled.
   */
  pending?: PendingActionSpec | ReactNode;
  muted?: boolean;
  /** Radius and padding follow the density: 24px card on a phone, 12px inside a data screen. */
  density?: 'expressive' | 'functional';
}
