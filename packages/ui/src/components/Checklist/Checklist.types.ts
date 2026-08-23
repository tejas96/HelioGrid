import type { ReactNode } from 'react';
import type { ActorClassSpec } from '../ActorClass';
import type { PendingActionSpec } from '../PendingAction';
import type { SurfaceState } from '../UnavailableNote';

export interface ChecklistItem {
  id?: string | number;
  /** Overrides the counted position. Rarely right — the count is the numbering. */
  number?: number | string;
  title: ReactNode;
  /** What the step actually involves. */
  detail?: ReactNode;
  /** Materials needed (`M05-76`) — rendered as one quiet line, never a nested list. */
  materials?: string[];
  /** Which phase it belongs to. Grouped, so a heading can never appear twice. */
  phase?: string;
  /** **The confirmed truth from the server, never an optimistic flip.** */
  done?: boolean;
  /**
   * **Who ticked it** (`MS11-35`) — an `ActorClass` spec, so a person, the agent, the system and
   * the customer read as they do everywhere else. Not a second person-glyph.
   */
  doneBy?: ActorClassSpec;
  doneAt?: ReactNode;
  /** `MS10-10` — where the design can prove the item, the proof is a real link. */
  evidence?: { label?: ReactNode; href?: string; onOpen?: () => void };
  /**
   * **The write in flight.** A tick persists per project, so it is a server write: the box keeps
   * its previous state and this line names the act (`PendingAction`). `state="returned"` says why
   * it came back.
   */
  pending?: PendingActionSpec | ReactNode;
}

export interface ChecklistPhase {
  id?: string;
  label: string;
  /** A line under the heading — what this phase is for, or what it depends on. */
  note?: ReactNode;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  /** Fixes phase order and lets a phase carry a note. Omitted, order is first appearance. */
  phases?: ChecklistPhase[];
  onToggle?: (item: ChecklistItem, next: boolean) => void;
  label?: ReactNode;
  /** **The meaning of the count, stated** (`MS11-35`). A percentage says how far, never what. */
  progressNote?: ReactNode;
  /** Replaces the composed "12 of 47 steps done". The numbers still come from the items. */
  countWords?: ReactNode;
  /** The word for one item — "steps", "checks", "items". */
  noun?: string;
  /**
   * `screen` (default) · `document` — `SCR-MS-17`'s Print: pen tick boxes, no toggle affordance,
   * the progress line and the attribution of what is already done still printed as content.
   */
  surface?: 'screen' | 'document';
  state?: SurfaceState;
  emptyTitle?: string;
  emptyMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  unavailableTitle?: string;
  unavailableMessage?: string;
  note?: ReactNode;
}
