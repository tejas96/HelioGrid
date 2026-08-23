import type { ReactNode } from 'react';
import type { SurfaceState } from '../UnavailableNote';

/** Done = filled success tick, current = accent dot in a soft ring, upcoming = hollow. */
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
}

export interface TimelineProps {
  items: TimelineItem[];
  /** page = full-page sequence with a continuous rail; compact = the four-row sheet form. */
  variant?: TimelineVariant;
  density?: TimelineDensity;
  state?: SurfaceState;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  /** `unavailable`: there is no sequence here to draw. Neutral, and no retry. */
  unavailableTitle?: string;
  unavailableMessage?: string;
}
