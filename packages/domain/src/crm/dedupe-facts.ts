import { can } from '../authz/policy';
import type { RolePreset } from '../authz/roles';
import type { DedupeChoice, LeadStage } from './vocabulary';

/**
 * The duplicate sheet (`M02-08`, `M02-09`), authored once for every capture that meets an existing
 * number — quick add, the import preview and, with voice, an inbound call (`M02-10`).
 */

/**
 * The existing record as the server read it: the customer, and the facts of their current lead. The
 * caller says whether the person capturing may open that lead under their scope (`lead-scope.ts`).
 */
export interface DedupeMatch {
  readonly customerId: string;
  readonly leadId: string;
  /** `null` while the customer has no name — a capture needs only the number (`M02-03`). */
  readonly name: string | null;
  readonly city: string | null;
  /** The owner's display name; `null` while the lead waits unassigned. */
  readonly ownerName: string | null;
  readonly stage: LeadStage;
  /** Epoch milliseconds of the last contact, or `null` when there has been none. */
  readonly lastContactAt: number | null;
  readonly inScope: boolean;
}

/**
 * What the sheet shows. A record in scope shows who it is — name and city — beside the three facts.
 * A record outside it shows the three facts ONLY, never its contents or its address (`M02-08`): the
 * sheet exists to stop a second rep chasing one customer, not to open a side door around a scope.
 */
export type DedupeSheetRecord =
  | {
      readonly kind: 'visible';
      readonly customerId: string;
      readonly leadId: string;
      readonly name: string | null;
      readonly city: string | null;
      readonly ownerName: string | null;
      readonly stage: LeadStage;
      readonly lastContactAt: number | null;
    }
  | {
      readonly kind: 'out_of_scope';
      readonly ownerName: string | null;
      readonly stage: LeadStage;
      readonly lastContactAt: number | null;
    };

/**
 * The three choices, in order, and no fourth (`M02-09`). *Open existing* opens the record in scope,
 * and outside it becomes *Ask the owner* — an enquiry naming the asker, sent to the owner
 * (`M02-08`, RFC decision 11). *Keep both* asks for a reason and needs `crm.dedupe_override`.
 */
export type DedupeSheetChoice =
  | {
      readonly choice: Extract<DedupeChoice, 'open_existing'>;
      readonly opens: 'record' | 'ask_owner';
    }
  | { readonly choice: Extract<DedupeChoice, 'log_enquiry'> }
  | {
      readonly choice: Extract<DedupeChoice, 'keep_both'>;
      readonly available: boolean;
      readonly needsReason: true;
    };

export interface DedupeSheet {
  readonly record: DedupeSheetRecord;
  readonly choices: readonly [DedupeSheetChoice, DedupeSheetChoice, DedupeSheetChoice];
}

function sheetRecordOf(match: DedupeMatch): DedupeSheetRecord {
  const { ownerName, stage, lastContactAt } = match;
  if (!match.inScope) return { kind: 'out_of_scope', ownerName, stage, lastContactAt };
  const { customerId, leadId, name, city } = match;
  return { kind: 'visible', customerId, leadId, name, city, ownerName, stage, lastContactAt };
}

/** The sheet a capture meets, for the person capturing — their held presets decide *Keep both*. */
export function dedupeSheetOf(match: DedupeMatch, roles: readonly RolePreset[]): DedupeSheet {
  return {
    record: sheetRecordOf(match),
    choices: [
      { choice: 'open_existing', opens: match.inScope ? 'record' : 'ask_owner' },
      { choice: 'log_enquiry' },
      {
        choice: 'keep_both',
        available: can(roles, 'crm.dedupe_override'),
        needsReason: true,
      },
    ],
  };
}
