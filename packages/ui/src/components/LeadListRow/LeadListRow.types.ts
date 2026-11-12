import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadRowNext, LeadSource, LeadStage } from '@heliogrid/domain';

/** A lead as the list shows it, its bill already formatted in the tenant's currency. */
export interface ListedLead {
  readonly id: string;
  /** The customer's name as typed — a fact; `null` puts the phone in its place. */
  readonly name: string | null;
  /** The number in the market's grouping — the row's name while the lead has none. */
  readonly phone: string;
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
  /** "No name yet" — the table's lead cell, where the number sits under the gap. */
  noName: TranslatedText;
  /** "No city yet". */
  noCity: TranslatedText;
  /** "No bill yet". */
  noBill: TranslatedText;
  /** "No owner yet". */
  noOwner: TranslatedText;
  /** A stage's word — "Qualified". */
  stage: (stage: LeadStage) => TranslatedText;
  /** "Open Priya Sharma", or "Open this lead" with no name. */
  open: (name: string | null) => TranslatedText;
}

/**
 * **One lead of the Leads list** (`SCR-M02-03`), its own card on the phone and in a narrow web
 * column (the owner's pick L2): the face, the name — or the number while it has none — then the
 * source's glyph, the stage and the city in one quiet line; at its end the bill in mono, its tier
 * standing once on the list's head, what comes next and the owner's face. A fact the lead lacks is
 * left out, never said as a gap. The whole card opens the lead.
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
