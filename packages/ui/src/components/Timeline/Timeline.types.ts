import type { ReactNode } from 'react';
import type { SurfaceRead } from '../UnavailableNote';

/** Done = filled success tick, current = accent dot in a soft ring, upcoming = an empty disc. */
export type TimelineStatus = 'done' | 'current' | 'upcoming' | 'blocked' | 'failed';

export type TimelineVariant = 'page' | 'compact';

export type TimelineDensity = 'expressive' | 'functional';

export interface TimelineItem {
  id?: string;
  label: string;
  /** Right-aligned micro text — a date, a count, a duration. */
  meta?: string;
  description?: string;
  /**
   * Who did it — renders with a small person glyph. **A free string, and that is the limit of what
   * this component claims:** it cannot distinguish a person from the agent, the system or the
   * customer, which `M07-03` requires of an activity log. An entry whose actor is not a person
   * belongs in `ActivityStream`, where the actor **class** is structural.
   */
  actor?: string;
  /** Arbitrary node under the step: photos, a StatCard pair, an action. */
  content?: ReactNode;
  status?: TimelineStatus;
  /** Pick mode: the step's own glyph, drawn in its node — a `ShellGlyph` the caller draws. */
  icon?: ReactNode;
  /** Pick mode: badges beside the name — *Can be skipped*. */
  marks?: ReactNode;
  /** Pick mode: `warning` gives the node the warning tint (a stage a project may skip). */
  tone?: 'warning';
}

export interface TimelineProps {
  items: TimelineItem[];
  /** page = full-page sequence with a continuous rail; compact = the four-row sheet form. */
  variant?: TimelineVariant;
  density?: TimelineDensity;
  /**
   * The read this list shows. Pass none when it holds static content: it draws `ready`. `failed`
   * draws the error with its retry; `unavailable` draws none.
   */
  read?: SurfaceRead;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorMessage?: string;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: string;
  /** `unavailable`: there is no sequence here to draw. Neutral, and no retry. */
  unavailableTitle?: string;
  unavailableMessage?: string;
  /**
   * **Pick mode** — with `onChange` the timeline is a radio group over its steps (`SCR-M01-20`'s
   * stage picker): `value` is the chosen item's `id`, `label` names the group. Each step shows its
   * `icon`, name, `description`, `marks` and `content`; the chosen one is tinted with a filled node
   * and a check at the row's end. The rail stays neutral. Arrow keys move and choose; one step is
   * tabbable. An item without an `id` cannot be chosen.
   */
  value?: string;
  onChange?: (id: string) => void;
  label?: string;
}
