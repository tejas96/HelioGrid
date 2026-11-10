import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadRowNext, LeadSource, LeadStage } from '@heliogrid/domain';
import type { StageTrackWords } from '../StageTrack/StageTrack.types';

/** A lead as the list shows it, its bill already formatted in the tenant's currency. */
export interface ListedLead {
  readonly id: string;
  /** The customer's name as typed — a fact; `null` is drawn as the named gap. */
  readonly name: string | null;
  readonly city: string | null;
  readonly source: LeadSource | (string & {});
  readonly stage: LeadStage;
  /** The monthly bill in the tenant's currency, formatted; `null` while it was never asked. */
  readonly bill: string | null;
  /** The owner's name; `null` while the lead waits in the inbox. */
  readonly owner: string | null;
}

/**
 * What comes next on a lead (`domain`'s `LeadRowNext`, worded): glyph, word and tint, never the
 * tint alone. A lead with nothing next draws none.
 */
export interface LeadNextMarkProps {
  kind: Exclude<LeadRowNext['kind'], 'none'>;
  /** A task past its moment reads as a problem; nothing else does. */
  overdue: boolean;
  /** "Snoozed till 14 Nov", "Quiet 34 days", "2 tries, no answer", "Call 11:30". */
  label: TranslatedText;
}

/** Every word a listed lead says, built in `@heliogrid/i18n` (`leadsListWords`). */
export interface LeadListRowWords {
  /** "No name yet". */
  noName: TranslatedText;
  /** "No city yet". */
  noCity: TranslatedText;
  /** "No bill yet". */
  noBill: TranslatedText;
  /** "No owner yet". */
  noOwner: TranslatedText;
  /** A stage's word — "Qualified". */
  stage: (stage: LeadStage) => TranslatedText;
  track: StageTrackWords;
  /** "Open Priya Sharma", or "Open this lead" with no name. */
  open: (name: string | null) => TranslatedText;
}

/**
 * **One lead of the Leads list** (`SCR-M02-03`), a row of its `CardRows` card on the phone and in
 * a narrow web column: the face, the name, the source, the stage as track and word, the city,
 * what comes next; at its end the bill in mono — its tier stands once, on the column's head — and
 * the owner. The whole row opens the lead.
 */
export interface LeadListRowProps {
  lead: ListedLead;
  /** The source's word (`leadSourceWord`), spoken beside its glyph. */
  sourceLabel: TranslatedText;
  next: LeadNextMarkProps | null;
  /** The first row of its card draws no hairline above it. */
  first: boolean;
  onOpen: () => void;
  words: LeadListRowWords;
}
