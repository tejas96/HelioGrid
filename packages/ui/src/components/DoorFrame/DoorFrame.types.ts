import type { TranslatedText } from '@heliogrid/contracts';
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

/** A door's heading, the one ask beside it, and the line under it (`SCR-M01-02` decision 26). */
export interface DoorTitleProps {
  title: TranslatedText;
  explainer?: ExplainerProps;
  intro?: TranslatedText;
}

/**
 * The frame every door and setup step shares: the page's glow, the header row with the product
 * mark and a trailing control, then the step's overline, the identity, the one task and the held
 * action — one centred column on every platform and at every width.
 */
export interface DoorFrameProps {
  /** The header row's right-hand control — the language control; on the code step, the change-number ghost before it. */
  trailing?: ReactNode;
  /** The step's quiet overline (`StepOverline`), above the title. */
  lead?: ReactNode;
  /** The title, the intro, the verified number. */
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
