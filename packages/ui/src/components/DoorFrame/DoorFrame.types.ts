import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ExplainerProps } from '../Explainer/Explainer.types';
import type { SkyFraming } from '../SolarSky/SolarSky.types';

/**
 * The task column's measure (`SCR-M01-02` decision 14): the front door's one field, the signup's
 * three named steps and its two-up row, a column of stacked cards over a field (`SCR-M01-04`), or
 * a row of choices read side by side (`SCR-M01-03`). A door names which; the frame owns the widths.
 */
export type DoorTaskMeasure = 'field' | 'steps' | 'list' | 'choices';

/**
 * Where the heading sits under what leads it. `deep` — `sp-8` under it, a signup step's place
 * (`SCR-M01-02`). `near` — `sp-4` under it, for a failure that takes the heading: its block is
 * taller than a title, and the column must still hold its last line above the action
 * (`SCR-M01-04` `m-error`). Omitted, the column opens the door's sheet under the sky at the frame's
 * own gap, the front door's place.
 */
export type DoorColumn = 'deep' | 'near';

/** A door's heading, the one ask beside it, and the line under it (`SCR-M01-02` decision 26). */
export interface DoorTitleProps {
  /** A quiet line over the title — the front door's greeting by the hour. */
  overline?: TranslatedText;
  title: TranslatedText;
  explainer?: ExplainerProps;
  intro?: TranslatedText;
}

/** What the desktop door's sky panel says about the product, under the wordmark. */
export interface DoorStory {
  title: TranslatedText;
  line: TranslatedText;
}

/**
 * The frame every door and setup step shares: the living sky (`SolarSky`) and the wordmark, a
 * trailing control, then the step's overline, the identity, the one task and the held action. On
 * the phone the sky stands over the column, which rides up over its foot as a glass sheet; from the
 * desktop width the sky is a panel beside the column.
 */
export interface DoorFrameProps {
  /** How much sky the door shows: the front door's tall sky, or a setup step's band. Default `band`. */
  sky?: SkyFraming;
  /** The desktop sky panel's words about the product. Absent, the panel shows the scene alone. */
  story?: DoorStory;
  /**
   * The step draws its own panel beside the column from the desktop width (the company profile's
   * letterhead), so the frame's sky panel stands down there and the column is the door's own
   * centred measure. The phone keeps its sky band.
   */
  ownPanel?: boolean;
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
