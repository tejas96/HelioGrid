import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ActorClassSpec } from '../ActorClass';
import type { PendingActionSpec } from '../PendingAction';
import type { SurfaceRead, SurfaceState } from '../UnavailableNote';

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
  /** The phase's own name, as the checklist's source words it. */
  // biome-ignore lint/plugin/copy-prop-type: a phase's own name — the market pack's word
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
  /** The word for the items in the count — "steps", "checks", "items". Default: `words.count`'s own. */
  noun?: TranslatedText;
  /** The list's own words — its loading and region names, its counts, its row names. */
  words: ChecklistWords;
  /**
   * `screen` (default) · `document` — `SCR-MS-17`'s Print: pen tick boxes, no toggle affordance,
   * the progress line and the attribution of what is already done still printed as content.
   */
  surface?: 'screen' | 'document';
  /**
   * **Required:** what this draws always comes from a read. `failed` draws the error with its
   * retry; `unavailable` draws none.
   */
  read: SurfaceRead;
  /**
   * Each state's words are drawn only when given — `@heliogrid/i18n`'s `CHECKLIST` holds the
   * usual ones.
   */
  emptyTitle?: TranslatedText;
  emptyMessage?: TranslatedText;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  note?: ReactNode;
}

/** The words a checklist says itself, in the reader's language (`@heliogrid/i18n`'s `checklistWords`). */
export interface ChecklistWords {
  /** What a screen reader hears while the list loads. */
  loading: TranslatedText;
  /** The list's region name when its `label` is not words alone. */
  name: TranslatedText;
  /** The count in words — *12 of 47 steps done*, in the items' own word when a `noun` is given. */
  count(done: number, total: number, noun?: string): TranslatedText;
  /** A phase's count — *3 of 5*. */
  phaseCount(done: number, total: number): TranslatedText;
  /** The label before an item's materials. */
  materials: TranslatedText;
  /** An item's proof link when the item names none — *See the evidence*. */
  evidence: TranslatedText;
  /** A tick box's name — the item's title, and whether it is done. */
  tick(title: string, done: boolean): TranslatedText;
}

/** The four non-ready faces' words and acts, as both halves draw them. */
export type ChecklistStateProps = {
  state: SurfaceState;
  onRetry?: () => void;
  loadingLabel: TranslatedText;
  /** The list's frame, where focus lands once its retry has left. */
  focusAfter: FocusAfter;
} & Pick<
  ChecklistProps,
  | 'emptyTitle'
  | 'emptyMessage'
  | 'errorTitle'
  | 'errorMessage'
  | 'retryLabel'
  | 'unavailableTitle'
  | 'unavailableMessage'
>;

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface ChecklistRowProps {
  item: ChecklistItem;
  /** The item's counted position in the whole list, or the number the item carries. */
  number: string | number;
  onToggle: ChecklistProps['onToggle'];
  surface: NonNullable<ChecklistProps['surface']>;
  words: ChecklistWords;
}
