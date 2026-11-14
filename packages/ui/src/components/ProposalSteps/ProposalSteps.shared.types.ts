import type { TranslatedText } from '@heliogrid/contracts';
import type { BankDetails, CoverCount } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { ProposalPictureName } from '../ProposalPicture/ProposalPicture.types';

/** What the steps' views and their words both stand on: the small shapes neither owns. */

/** One of the cover's three figures — domain's `CoverCount`, under the name this step uses. */
export type TrackRecordCount = CoverCount;

export type BankField = keyof BankDetails;

/** What a field's last commit came to (`T-M06-023`). The typed value stays in the field throughout. */
export interface FieldSave {
  readonly kind: 'saving' | 'saved' | 'unsaved' | 'conflict' | 'refused';
  /**
   * `refused`: why the server would not take the value itself, said at the field (`F8-36`).
   * `saved`: what landed, where it is more than the field's own value (*Saved as the company default*).
   */
  readonly reason?: TranslatedText;
  /** `refused`: the refusal as the view model holds it, until `proposalStepViewOf` words it. */
  readonly failure?: unknown;
  /** `unsaved`: send the kept value again. */
  readonly onRetry?: () => void;
  /** `conflict`: read the draft as the other device left it. */
  readonly onReload?: () => void;
}

/** A step's fields, by name, each with what its last commit came to; a field left out is at rest. */
export type FieldSaves<Field extends string> = Readonly<Partial<Record<Field, FieldSave>>>;

/** A read-only fact row: a glyph, what it is, and its value as written. */
export interface StepFact {
  readonly key: string;
  readonly glyph: ShellGlyphName;
  readonly label: TranslatedText;
  /** A fact: a company's name, a number, an address */
  readonly value: string;
}

/** A notice a step raises: what is so, what to do, and the act that does it. */
export interface StepNotice {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  readonly act?: { readonly label: TranslatedText; readonly onPress: () => void };
}

/** One cover picture a proposal may open with: the platform's four, or the company's own photo. */
export interface CoverChoice {
  readonly key: string;
  readonly name: TranslatedText;
  /** A platform picture; absent for the company's own photo, which names its `src`. */
  readonly picture?: ProposalPictureName;
  readonly src?: string;
}

/** One field the checklist names, with the words of the block that names it. */
export interface FieldMark {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
}

/**
 * The fields the step in view marks once Generate was asked for (`T-M06-022` DONE WHEN 2), by their
 * paths in the field set — `system.priceInclusive`.
 */
export type FieldMarks = Readonly<Record<string, FieldMark>>;
