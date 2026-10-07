import type { ReactNode } from 'react';

/**
 * The task column's measure (`SCR-M01-02` decision 14): the front door's one field, or the
 * signup's three named steps and its two-up row. A door names which; the frame owns the widths.
 */
export type DoorTaskMeasure = 'field' | 'steps';

/**
 * The frame both doors share (`SCR-M01-01`, `SCR-M01-02`): the canvas, the brand bloom, the
 * header row with the wordmark and a trailing control, then the step header, the identity, the
 * one task and the held action. The web half draws the identity as the left column from the
 * door's own breakpoint and stacks the rest on the right; the native half has one scrolling
 * column and keeps the action under it.
 */
export interface DoorFrameProps {
  /** The header row's right-hand control — the language control; on the code step, the change-number ghost before it. */
  trailing: ReactNode;
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
  /** Which measure the task column takes. The native half has one column and reads none. */
  taskMeasure?: DoorTaskMeasure;
  children: ReactNode;
}
