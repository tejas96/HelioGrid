import type { StatusTone } from '../../primitives/StatusMark';

/** The canonical pipeline vocabulary. **Not a boundary** — `status` accepts any string. */
export type SolarStatus =
  /* delivery */
  | 'lead'
  | 'survey-scheduled'
  | 'design-in-progress'
  | 'approved'
  | 'installing'
  | 'commissioned'
  | 'on-hold'
  /* V2 sales stages */
  | 'new-lead'
  | 'contacted'
  | 'qualified'
  | 'site-visit'
  | 'designing'
  | 'proposal-sent'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'snoozed';

export type StatusChipDensity = 'expressive' | 'functional';

export interface StatusChipProps {
  /**
   * A canonical status, or **any string** — the eight other lifecycle vocabularies (invite,
   * membership, document checklist, payment tranche, billing, calling outcome, proposal & link,
   * studio) pass their own values here. An unknown status renders under its own words in the
   * neutral tone; it is never silently re-labelled as something else.
   */
  status?: SolarStatus | string;
  /** Override the word. */
  label?: string;
  /**
   * The meaning. Supply it whenever `status` is outside the canonical set — that is how a word the
   * registry has never heard of gets the right colour instead of borrowing a wrong one.
   *
   * `StatusTone` is the primitives' declaration (`StatusMark`), which is the one place the six
   * tones live in this repo.
   */
  tone?: StatusTone;
  density?: StatusChipDensity;
  /** Status dot. Turn off inside a table where a NextAction dot already sits in the row. */
  dot?: boolean;
}
