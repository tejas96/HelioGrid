import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { PendingActionSpec } from '../PendingAction';
import type { ProvenanceProps, ProvenanceStanding, ProvenanceTierSpec } from '../Provenance';
import type { SolarStatus } from '../StatusChip';
import type { SurfaceRead } from '../UnavailableNote';

export interface KanbanCardItem {
  id: string | number;
  /** The record the card stands for, by its own name — a project, a lead. */
  // biome-ignore lint/plugin/copy-prop-type: the record's own name — a project or a lead
  title: string;
  /** Second line — city, capacity, due date. */
  meta?: string;
  /** Right-aligned mono value, e.g. ₹5,12,000. */
  value?: string;
  /**
   * **The tier on this card's figure** (`F8-01` / `F8-07`) — a bare tier or a full spec,
   * rendered as persistent words on their own line under the meta/value row.
   *
   * A board card is a record carrying money, and the board is not an exception to the tier rule:
   * this is the same slot `DataTable`'s row and stacked record card fill. Before it existed the
   * only route was `renderCard` — a private adjacency per screen.
   */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /** How far the figure can be relied on as final. Folded into `provenance` when both are given. */
  standing?: ProvenanceStanding;
  /** Name for the trailing avatar. */
  owner?: string;
  /** The DS declares an open item shape; the contract keeps it open without reaching for `any`. */
  [key: string]: unknown;
}

export interface KanbanColumn {
  key: string;
  /** The stage's name, in the reader's language (`@heliogrid/i18n`'s `stageWords`). */
  label: TranslatedText;
  /** Drives the header StatusChip. */
  status?: SolarStatus;
  items?: KanbanCardItem[];
  /** WIP limit — header shows n/limit and turns warning when exceeded. */
  limit?: number;
  /** What an empty column says. Default: `words.nothingHere`. */
  emptyLabel?: TranslatedText;
}

/** The words a board says itself, in the reader's language (`@heliogrid/i18n`'s `kanbanWords`). */
export interface KanbanWords {
  /** What a screen reader hears while the board loads. */
  loading: TranslatedText;
  /** What a column with no cards says when the column names nothing of its own. */
  nothingHere: TranslatedText;
  /** The phone form's stage strip — its overline by default, and its name always. */
  stage: TranslatedText;
  /** A card's back button — *Move back a stage*, and the stage it moves to when there is one. */
  moveBack(stage?: string): TranslatedText;
  /** A card's on button — *Move on a stage*, and the stage it moves to when there is one. */
  moveOn(stage?: string): TranslatedText;
}

/** What `onFormChange` publishes: the board's OWN width, never the viewport. */
export interface KanbanForm {
  stacked: boolean;
  width: number;
}

export interface KanbanProps {
  columns: KanbanColumn[];
  onCardClick?: (item: KanbanCardItem, column: KanbanColumn) => void;
  /** Enables drag between columns. Called with (id, toColumnKey, fromColumnKey). */
  onMove?: (id: string | number, to: string, from: string) => void;
  /**
   * Replaces the whole card. **Not the route for a tier or a standing** — those are
   * `item.provenance` and `item.standing`, so the adjacency stays the system's.
   */
  renderCard?: (item: KanbanCardItem, column: KanbanColumn) => ReactNode;
  /**
   * **This card's move is in flight** (`SCR-M08-01`'s `move-waiting-server`). Return a
   * `PendingActionSpec` or null; `PendingAction` renders it under the card. The card is **not**
   * dimmed, disabled or covered — it stays draggable, its move buttons stay live, and a second
   * move can start while the first is in flight.
   */
  cardPending?: (item: KanbanCardItem, column: KanbanColumn) => PendingActionSpec | null;
  /**
   * **Required:** what this draws always comes from a read. `failed` draws the error with its
   * retry; `unavailable` draws none.
   */
  read: SurfaceRead;
  /** The board's own words — its loading name, its move buttons, its stage strip. */
  words: KanbanWords;
  /**
   * Each state's words are drawn only when given — `@heliogrid/i18n`'s `KANBAN` holds the usual
   * ones.
   */
  emptyTitle?: TranslatedText;
  emptyDescription?: TranslatedText;
  /** `unavailable`: no such board here at all. Neutral, and no retry. */
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  columnWidth?: number;
  /**
   * Own-width px below which the board becomes **one column with a stage filter** — `M08-10` (P0)
   * / `SCR-M08-01`'s `mobile-single-column-filter`. Default 720. It used to stack: nine full-width
   * columns one after another, which at the ruled 200-project volume is the whole portfolio in one
   * scroll.
   */
  stackBelow?: number;
  /**
   * The stage shown on the phone form. Uncontrolled by default (the first column). Pass it — with
   * `onStackedColumnChange` — when the screen keeps the stage in a URL.
   */
  stackedColumn?: string;
  onStackedColumnChange?: (key: string) => void;
  /** The overline above the stage strip. Default `words.stage`; pass "" to drop it. */
  stageFilterLabel?: TranslatedText | '';
  /**
   * **The measurement, published.** Fires whenever the answer changes — the board's own width,
   * never the viewport. A screen arranging content around the board needs to know WHEN the form
   * switched, and this component owns the observer that knows, so it says.
   */
  onFormChange?: (form: KanbanForm) => void;
}
