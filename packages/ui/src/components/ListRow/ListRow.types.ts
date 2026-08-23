import type { ReactNode } from 'react';
import type { NamedGapSpec } from '../NamedGap';
import type { PendingActionSpec } from '../PendingAction';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { ValueSourceLevel, ValueSourceSpec } from '../ValueSource';

export interface ListRowProps {
  /** icon node rendered inside a circular IconCircle */
  icon?: ReactNode;
  /** A DS colour token reference — the web half takes `var(--…)`, the native half a theme value. */
  iconColor?: string;
  /** use instead of icon for an avatar leading element */
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * **The subtitle's value is absent, and this names what is missing** — "no city yet" (`M02-03`).
   * Rendered by `NamedGap` in the subtitle's place, and it **replaces** the subtitle rather than
   * joining it: there is one value, and it is absent. Never a blank line, never a dash.
   */
  gap?: ReactNode | NamedGapSpec;
  /** Marks this row carries — nodes, rendered through `MarkRow`, under the subtitle. */
  marks?: ReactNode | ReactNode[];
  /**
   * Which layer supplied this row's value (`SCR-M01-15`) — `ValueSource`. Sits above the
   * provenance line. Mutually exclusive with an override: an overridden value speaks through
   * `FieldOverride`.
   */
  attribution?: ReactNode | ValueSourceLevel | ValueSourceSpec;
  /**
   * The provenance tier for a figure in this row (`F8-01` / `F8-07`). **The slot is the third line
   * of the text column, under the subtitle** — the row's number usually sits in `trailing`, and a
   * tier wedged in there competes with the action. Never fold it into `subtitle`.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec | ReactNode;
  /**
   * **An act on this row is in flight** (`M02-67`, `F8-36`) — rendered by `PendingAction` as the
   * row's last line, under everything the row says about its values. It never dims the row and
   * never disables `trailing`: a pending row is visibly pending **and still operable**. A failure
   * comes back as `{state: "returned", reason}` and the row is already back to what it was.
   */
  pending?: PendingActionSpec | ReactNode;
  /** trailing action / chevron / chip */
  trailing?: ReactNode;
  density?: 'expressive' | 'functional';
  /**
   * Makes the row the target. The DS declares `(e: React.MouseEvent) => void`; the shared contract
   * carries no DOM event, so the platform halves call it with nothing.
   */
  onClick?: () => void;
}
