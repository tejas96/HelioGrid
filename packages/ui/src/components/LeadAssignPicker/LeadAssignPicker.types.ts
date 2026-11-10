import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadActFailure, Read } from '@heliogrid/domain';
import type { AssignPickerPerson, AssignPickerWords } from '../AssignPicker/AssignPicker.types';

/** How the last assign came back undone: someone assigned the lead first (`M02-67`), or it failed. */
export type LeadAssignReturned =
  | {
      readonly kind: 'already_assigned';
      readonly userId: string;
      /** Who holds it now, when the server named them. */
      readonly owner: { readonly name: string } | null;
    }
  | { readonly kind: 'failed'; readonly userId: string; readonly failure: LeadActFailure };

/**
 * The owner chip's picker as its data hook holds it (`useLeadDetailScreen`'s `assign`), named by
 * shape because this package may not import `packages/data`; the hook's satisfies it.
 */
export interface LeadAssignFacts {
  readonly open: boolean;
  /** Refused while an assign is out. */
  hide(): void;
  readonly people: Read<readonly AssignPickerPerson[]>;
  /** The reader, when they are one of the people a lead can go to. */
  readonly readerId: string | null;
  pick(userId: string): void;
  /** The person an assign is out to. */
  readonly pendingUserId: string | null;
  readonly returned: LeadAssignReturned | null;
}

/** Every word the picker says on a lead, built in `@heliogrid/i18n` (`leadAssignPickerWords`). */
export interface LeadAssignPickerWords {
  /** The picker's own words, its subtitle naming this lead. */
  readonly picker: AssignPickerWords;
  /** "Assigning to Priya Sharma…" — the picked row's line while the assign is out. */
  readonly assigning: (name: string) => TranslatedText;
  /** "Not assigned — Rajesh Jadhav has it already." — `null` when the server named no one. */
  readonly alreadyAssigned: (owner: string | null) => TranslatedText;
  /** Why an assign failed, said on the row it was picked from. */
  readonly failure: (failure: LeadActFailure) => TranslatedText;
}

/**
 * **The owner chip's picker on Lead Detail** (`M02-29`), both platforms: the inbox's own
 * `AssignPicker`, with the same people and the same open and overdue counts. The assign out is the
 * picked person's row line; one that came back undone — someone assigned it first (`M02-67`), or
 * it failed — stays on that row saying why.
 */
export interface LeadAssignPickerProps {
  readonly assign: LeadAssignFacts;
  /** The lead's owner now — marked and not offered; `null` for an unassigned lead. */
  readonly ownerId: string | null;
  readonly words: LeadAssignPickerWords;
}
