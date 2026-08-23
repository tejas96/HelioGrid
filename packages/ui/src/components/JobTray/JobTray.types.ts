import type { ReactNode } from 'react';
import type { OperationProgressProps } from '../OperationProgress/OperationProgress.types';

/**
 * One piece of work the person walked away from. It is `OperationProgress`'s own spec — the two
 * components share one job object, so a watched computation promoted to a background job is the
 * same object in both — plus the two things a tray requires: an id and a destination.
 */
export interface BackgroundJob extends Omit<OperationProgressProps, 'label' | 'size' | 'style'> {
  id: string | number;
  /** The work, named — "Importing leads · Nashik list.csv". */
  label: ReactNode;
  /**
   * **Where the finished thing is, as a real control.** A job you left is unreachable without one:
   * `M02-21`'s finished import "produces a report naming every rejected row and why", and
   * *"the person is told where it got to"* is a place, not a sentence.
   */
  destination?: ReactNode;
}

/**
 * **Work you walked away from, and the one place it lives** (`M02-21` P0, `SCR-M02-05`,
 * `importing-progress`).
 *
 * **It is shell furniture, which is why it sits beside the bell.** The bell says *something
 * happened while you were elsewhere*; this says *something is still happening while you are
 * elsewhere*. `AppHeader` and `MobileTopBar` take it in a `jobs` slot, before the bell, so it
 * survives every navigation — the whole point being that it outlives the screen that started the
 * work.
 *
 * Each tray row renders as an `OperationProgress` at `size="inline"`, so stage narration and the
 * honest-cancel rule are inherited rather than restated.
 *
 * Renders **nothing** with no jobs. A tray with nothing in it is chrome.
 */
export interface JobTrayProps {
  /**
   * Every job the person has left running, plus the finished ones they have not opened yet. A
   * finished job **stays** until it is opened or cleared — the opposite of `Toast`'s rule, and the
   * reason a `Toast` could not carry this: the person who walked away is by definition not watching
   * the moment it lands.
   */
  jobs: BackgroundJob[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name and the panel's overline. Default "Background work". */
  label?: string;
  /** Clears the finished and failed jobs. The control appears only when there are some. */
  onClear?: () => void;
  clearLabel?: string;
  align?: 'right' | 'left';
}

/** The one line the shell can say, because the trigger is 44px of top bar, not a panel. */
export interface JobTraySummary {
  words: string;
  /** Something is still running: the trigger shows the travelling rail, not a clock. */
  busy: boolean;
  /** The tone of the resting state, where there is one. Never a raw colour. */
  tone?: 'warning' | 'success';
}
