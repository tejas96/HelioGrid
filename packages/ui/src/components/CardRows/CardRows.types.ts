import type { ReactNode, Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';

/**
 * How a list's rows sit on the page: `joined`, one glass card with a hairline between two rows
 * (direction A — the catalog's narrow list, the Team list); `separate`, a tile per row with a gap
 * between them, where each row is a record a person scans and taps on its own (the list pages'
 * cards on the phone, the owner's pick L2).
 */
export type CardRowsForm = 'joined' | 'separate';

/** **A list's rows**, in one card or a card each (`form`). */
export interface CardRowsProps {
  children: ReactNode;
  form: CardRowsForm;
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
  /** The open target's focus handle: an act in `aside` that removes itself sends focus here. */
  targetRef?: Ref<FocusHandle>;
}

export interface CardRowOpen {
  /** The target's spoken name: the record's own name, or its worded label. */
  readonly name: string;
  readonly onOpen: () => void;
  /** This row's detail is open beside the list. */
  readonly current?: boolean;
  /**
   * The record's address on the web: the target is then a link — announced as one, opened in a new
   * tab by a modified click — while a plain click still opens through `onOpen`. The phone has no
   * address to show, so its target presses `onOpen` alone.
   */
  readonly href?: string;
}
