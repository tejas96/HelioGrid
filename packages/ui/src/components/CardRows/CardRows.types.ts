import type { ReactNode } from 'react';

/**
 * **One glass card holding a list's rows** (direction A): a tile on the page with a hairline between
 * two rows — never a card per row. The catalog's narrow list and the Team list draw their rows in it.
 */
export interface CardRowsProps {
  children: ReactNode;
}

/**
 * **One row of a `CardRows` card.** Its body is the caller's; the row draws the hairline above it
 * (none on the first), the highlight, and with `open` the whole row as the target that opens its
 * record — on the web a button UNDER the body, so an act in `aside` takes its own presses; on the
 * phone a `Pressable` beside the act, never around it. So nothing nests, and a screen reader and a
 * keyboard reach the open and each act on its own.
 */
export interface CardRowProps {
  children: ReactNode;
  /** The first row draws no hairline above it. */
  first: boolean;
  /** The whole row opens its record; absent, nothing opens and the body is plain. */
  open?: CardRowOpen;
  /**
   * The row's own acts, outside the open target, at the row's top end. The body's first line keeps
   * clear of them (the web's grid; on the phone `useCardRowAsideRoom`), and what sits under that
   * line runs the row's whole width beneath them.
   */
  aside?: ReactNode;
  /** A line under the body, the row's whole width — its write in flight or back. */
  after?: ReactNode;
  /** The row reads as the chosen one: just added, or its detail open beside the list. */
  highlighted?: boolean;
  /** An archived record: its body sinks back. */
  muted?: boolean;
  /** The row's write is out. */
  busy?: boolean;
}

export interface CardRowOpen {
  /** The target's spoken name: the record's own name, or its worded label. */
  readonly name: string;
  readonly onOpen: () => void;
  /** This row's detail is open beside the list. */
  readonly current?: boolean;
}
