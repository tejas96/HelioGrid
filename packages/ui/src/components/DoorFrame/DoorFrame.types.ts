import type { ReactNode } from 'react';
import type { ExplainerProps } from '../Explainer/Explainer.types';

/**
 * The task column's measure (`SCR-M01-02` decision 14): the front door's one field, the signup's
 * three named steps and its two-up row, a column of stacked cards over a field (`SCR-M01-04`), or
 * a row of choices read side by side (`SCR-M01-03`). A door names which; the frame owns the widths.
 */
export type DoorTaskMeasure = 'field' | 'steps' | 'list' | 'choices';

/**
 * Where the column sits under the door's breakpoint, and on the phone. `centred` — between the
 * header row and the column's foot, the front door's place (`SCR-M01-01` "375 vertical layout").
 * `deep` — the heading `sp-8` under what leads it, a signup step's place (`SCR-M01-02`). `near` —
 * the heading `sp-4` under what leads it, for a failure that takes the heading: its block is taller
 * than a title, and the column must still hold its last line above the action (`SCR-M01-04`
 * `m-error`). Omitted, the column starts under the header row at the frame's own gap.
 */
export type DoorColumn = 'centred' | 'deep' | 'near';

/**
 * How the frame lays out from the door's breakpoint. `door` — the doors' two equal fields
 * (`SCR-M01-01` … `-05`). `onboarding` — the setup steps' two panes (`SCR-M01-07` d-default, D261):
 * a brand pane on columns 1–4 at full height, holding the bloom, the wordmark and the identity, and
 * a task pane on columns 5–12 holding the task and its action; it draws no `lead`. Under the
 * breakpoint, and on the phone, both are the one column.
 */
export type DoorPanes = 'door' | 'onboarding';

/** A door's heading, the one ask beside it, and the line under it (`SCR-M01-02` decision 26). */
export interface DoorTitleProps {
  title: string;
  explainer?: ExplainerProps;
  intro?: string;
}

/**
 * The frame both doors share (`SCR-M01-01`, `SCR-M01-02`): the canvas, the brand bloom, the
 * header row with the wordmark and a trailing control, then the step header, the identity, the
 * one task and the held action. The web half draws the identity as the left column from the
 * door's own breakpoint and stacks the rest on the right; the native half has one scrolling
 * column and keeps the action under it.
 */
export interface DoorFrameProps {
  /** The header row's right-hand control — the language control; on the code step, the change-number ghost before it. */
  trailing?: ReactNode;
  /** The layout from the door's breakpoint; the native half has one column and reads none. */
  panes?: DoorPanes;
  /**
   * The step header (`SCR-M01-02`'s progress stepper). Under the door's breakpoint it leads the
   * column, above the identity's heading; on the web at the breakpoint it heads the task column.
   */
  lead?: ReactNode;
  /** The identity half: the title, the intro, the verified number. Web: the left column. Native: above the column. */
  identity?: ReactNode;
  /**
   * An action that stays under the scrolling column — the company step's primary, which expanded
   * Hindi or Marathi copy must never push off the screen (`SCR-M01-02` decision 9). Web holds it at
   * the window's foot under the breakpoint, and in reading order under the task from it.
   */
  footer?: ReactNode;
  /**
   * Told the held action's height, its padding included, each time it changes: what floats over the
   * frame's foot (a toast) is placed clear of it, though the action's words wrap by language.
   */
  onFooterHeight?: (height: number) => void;
  /** Which measure the task column takes. The native half has one column and reads none. */
  taskMeasure?: DoorTaskMeasure;
  column?: DoorColumn;
  /**
   * The frame is the window's height and never scrolls: the task takes the room left under the
   * identity, and a part of it that holds more than fits scrolls itself (the role card's rows,
   * `SCR-M01-10` m-stacked-end, whose head and heading stay). On a screen shorter than
   * `DOOR_BOUNDED_MIN_HEIGHT` the column scrolls whole, as it does when this is omitted.
   */
  bounded?: boolean;
  children: ReactNode;
}
