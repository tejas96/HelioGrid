import { can } from '../authz/policy';
import type { RolePreset } from '../authz/roles';
import type { FormatPack } from '../format/pack';
import { phoneDigitsMismatch, phoneE164Of } from '../format/phone';
import type { Read } from '../shell/read';
import type { DealSegment, TenantSegment } from '../tenancy/segment';
import type { LeadStage } from './vocabulary';

/*
 * Quick add (`SCR-M02-01`, `M02-01`…`M02-06`), decided once for both screens: the four fields, the
 * live number check under the phone, the refusal a number that cannot be one meets, what a save
 * sends, and the duplicate sheet a check or a save opens over the capture (`M02-08`, `M02-66`).
 */

/**
 * How long the typing rests on a whole number before the live check asks (`M02-07`): one ask per
 * number typed, never one per key, and short enough that the answer is in before Save is reached.
 */
export const NUMBER_CHECK_SETTLE_MS = 300;

/** The four fields as typed (`M02-01`). The phone is E.164 as the field hands it back, or `''`. */
export interface QuickAddDraft {
  readonly phoneE164: string;
  readonly name: string;
  readonly city: string;
  readonly segment: DealSegment | null;
}

const DECLARED_SEGMENT: Record<TenantSegment, DealSegment | null> = {
  residential: 'residential',
  ci: 'commercial',
  both: null,
};

/**
 * A fresh capture. Its type starts on the segment the company declared at onboarding, so the common
 * case is already chosen (`M02-05`, `M01-23`); a company that sells both, or has not said, starts on
 * none — no choice is invented for it.
 */
export function quickAddDraftFor(declared: TenantSegment | null): QuickAddDraft {
  const segment = declared === null ? null : DECLARED_SEGMENT[declared];
  return { phoneE164: '', name: '', city: '', segment };
}

/**
 * The number as it is stored and matched (`M02-02`), once the market's digit count is typed —
 * spaces, a trunk zero and the dial code normalised, never scolded — else `null`: the live check
 * fires as the number becomes whole (`M02-07`), never on a part of one.
 */
export function checkableNumberOf(pack: FormatPack, phoneE164: string): string | null {
  return phoneE164 === '' ? null : phoneE164Of(pack, phoneE164);
}

/**
 * Why Save sends nothing: no number yet, or one that cannot be a number here — said at the field
 * with the shape expected, the rest of the capture kept (`M02-01`'s edge cases).
 */
export type PhoneRefusal =
  | { readonly kind: 'missing' }
  | { readonly kind: 'digits'; readonly typed: number; readonly needed: number };

export function phoneRefusalOf(pack: FormatPack, phoneE164: string): PhoneRefusal | null {
  if (checkableNumberOf(pack, phoneE164) !== null) return null;
  const mismatch = phoneDigitsMismatch(pack, phoneE164);
  if (mismatch === null || mismatch.typed === 0) return { kind: 'missing' };
  return { kind: 'digits', typed: mismatch.typed, needed: mismatch.needed };
}

/**
 * What a save sends: the stored number and only the fields typed. An empty field stays a named gap
 * on the record and nothing is invented to fill it (`M02-03`). `null` while the number is refused.
 */
export interface QuickAddCapture {
  readonly phoneE164: string;
  readonly name?: string;
  readonly city?: string;
  readonly segment?: DealSegment;
}

export function quickAddCaptureOf(pack: FormatPack, draft: QuickAddDraft): QuickAddCapture | null {
  const phoneE164 = checkableNumberOf(pack, draft.phoneE164);
  if (phoneE164 === null) return null;
  const name = draft.name.trim();
  const city = draft.city.trim();
  return {
    phoneE164,
    ...(name === '' ? {} : { name }),
    ...(city === '' ? {} : { city }),
    ...(draft.segment === null ? {} : { segment: draft.segment }),
  };
}

/** The three facts every duplicate shows (`M02-08`), and the lead an act is sent against. */
interface MatchFacts {
  readonly leadId: string;
  readonly ownerName: string | null;
  readonly stage: LeadStage;
  /** ISO instant of the last contact, `null` for never. */
  readonly lastContactAt: string | null;
}

/**
 * What a number already belongs to, as the live check and a refused save answer it. Named by shape
 * here, since `packages/contracts` derives from this package; the wire's `DedupeMatch` satisfies it.
 */
export type QuickAddMatch =
  | (MatchFacts & {
      readonly kind: 'visible';
      readonly customerId: string;
      readonly name: string | null;
      readonly city: string | null;
    })
  | (MatchFacts & { readonly kind: 'out_of_scope' });

/**
 * The line under the phone (`M02-07`): nothing until the number is whole; a quiet *Checking…* while
 * the typing settles and the ask is out; then a new number or the record it belongs to. A check
 * that could not answer says so — the server checks again at save, so it never blocks Save.
 */
export type NumberCheck =
  | { readonly kind: 'none' }
  | { readonly kind: 'checking' }
  | { readonly kind: 'new' }
  | { readonly kind: 'known'; readonly match: QuickAddMatch }
  | { readonly kind: 'unchecked' };

/**
 * `checkable` is the whole number typed now; `settled` the one the typing has rested on; `answer`
 * the live check's read for `settled`.
 */
export function numberCheckOf(
  checkable: string | null,
  settled: string | null,
  answer: Read<QuickAddMatch | null>,
): NumberCheck {
  if (checkable === null) return { kind: 'none' };
  if (checkable !== settled) return { kind: 'checking' };
  switch (answer.kind) {
    case 'failed':
      return { kind: 'unchecked' };
    case 'empty':
      return { kind: 'new' };
    case 'ready':
      return answer.value === null ? { kind: 'new' } : { kind: 'known', match: answer.value };
    default:
      return { kind: 'checking' };
  }
}

/** Who the number belongs to as the sheet may show it: outside the reader's scope, nothing of it. */
export type QuickAddSheetRecord =
  | { readonly kind: 'visible'; readonly name: string | null; readonly city: string | null }
  | { readonly kind: 'out_of_scope' };

/** The duplicate sheet over the capture (`M02-08`, `M02-09`), decided for the person capturing. */
export interface QuickAddDuplicate {
  readonly match: QuickAddMatch;
  readonly record: QuickAddSheetRecord;
  readonly ownerName: string | null;
  readonly stage: LeadStage;
  /** Milliseconds since the last contact by the caller's clock, `null` for never. */
  readonly lastContactElapsedMs: number | null;
  /** *Open existing* opens the record in scope; outside it, it asks the owner (`M02-08`). */
  readonly opens: 'record' | 'ask_owner';
  /**
   * *Keep both* needs `crm.dedupe_override`, and a record the person may see: the link it writes
   * names that customer (`M02-12`), whom a record outside the scope never discloses.
   */
  readonly canKeepBoth: boolean;
}

export function quickAddDuplicateOf(
  match: QuickAddMatch,
  roles: readonly RolePreset[],
  now: number,
): QuickAddDuplicate {
  const visible = match.kind === 'visible';
  const lastContact = match.lastContactAt === null ? null : Date.parse(match.lastContactAt);
  return {
    match,
    record: visible
      ? { kind: 'visible', name: match.name, city: match.city }
      : { kind: 'out_of_scope' },
    ownerName: match.ownerName,
    stage: match.stage,
    lastContactElapsedMs: lastContact === null ? null : Math.max(0, now - lastContact),
    opens: visible ? 'record' : 'ask_owner',
    canKeepBoth: visible && can(roles, 'crm.dedupe_override'),
  };
}

/** What a finished capture came to, said once in a toast as the sheet closes. */
export type QuickAddDone =
  | { readonly kind: 'saved'; readonly leadId: string }
  | { readonly kind: 'enquiry_logged'; readonly leadId: string; readonly name: string | null }
  | { readonly kind: 'owner_asked'; readonly ownerName: string | null };
