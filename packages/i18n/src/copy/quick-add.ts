/**
 * Quick add's words (`SCR-M02-01`, `M02-01`…`M02-16`): the four fields and Save, the line the live
 * number check says under the phone, the refusal a number that cannot be one meets, a save that
 * came back undone, the referral's chip, and the toast a finished capture leaves — each chosen by
 * the facts `packages/domain`'s quick-add view decides.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type {
  DealSegment,
  DedupeChoice,
  NumberCheck,
  PhoneRefusal,
  QuickAddDone,
  QuickAddDuplicate,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { type AttemptFailureLike, attemptFailureMessageId, INTERNAL_ERROR } from './api-error';
import { CATALOG_SETTINGS } from './catalog-settings';
import { DEAL_SEGMENT_WORD } from './crm-vocabulary';
import { dedupeSheetWords } from './dedupe-sheet';
import { phoneFieldWords } from './phone-field';
import { SHELL } from './shell';
import { SIGN_IN } from './sign-in';

type T = Translator['t'];

export const QUICK_ADD = {
  title: /*i18n*/ { id: 'New lead' },
  phone: /*i18n*/ { id: 'Phone' },
  name: /*i18n*/ { id: 'Name' },
  city: /*i18n*/ { id: 'City' },
  type: /*i18n*/ { id: 'Type' },
  save: /*i18n*/ { id: 'Save lead' },
  saving: /*i18n*/ { id: 'Saving the lead…' },
  checking: /*i18n*/ { id: 'Checking…' },
  newNumber: /*i18n*/ { id: 'New number' },
  /* The duplicate sheet's own heading: one sentence, one catalog entry. */
  known: /*i18n*/ { id: 'This number is already here' },
  unchecked: /*i18n*/ { id: 'Couldn’t check now. It is checked again when you save.' },
  missing: /*i18n*/ { id: 'Type the number. It is the one field a lead needs.' },
  notSaved: /*i18n*/ { id: 'Not saved. {reason}' },
  cameFrom: /*i18n*/ { id: 'Came from {name}' },
  saved: /*i18n*/ { id: 'Lead saved' },
  open: /*i18n*/ { id: 'Open' },
  enquiryNamed: /*i18n*/ { id: 'Enquiry added to {name}' },
  enquiryUnnamed: /*i18n*/ { id: 'Enquiry added to the existing lead' },
  askedOwner: /*i18n*/ { id: 'Request sent to {owner}' },
  askedCompany: /*i18n*/ { id: 'Request sent to your company’s owner' },
} as const;

/** The facts the screen's words are chosen by — each one the quick-add view's. */
export interface QuickAddFacts {
  readonly check: NumberCheck;
  /** The refusal a pressed Save met at the phone, `null` while none stands. */
  readonly phoneRefusal: PhoneRefusal | null;
  /** Why the last save came back undone, `null` while none did. */
  readonly saveFailure: AttemptFailureLike | null;
  /** The referrer as the screen shows them — their name, else their number — `null` for none. */
  readonly referrer: string | null;
}

/** A failed attempt in one sentence: the transport's words, the server code's, else the fallback. */
function failureSentence(t: T, failure: AttemptFailureLike): TranslatedText {
  return t(attemptFailureMessageId(failure) ?? INTERNAL_ERROR);
}

function checkWords(t: T, check: NumberCheck): TranslatedText {
  switch (check.kind) {
    case 'new':
      return t(QUICK_ADD.newNumber);
    case 'known':
      return t(QUICK_ADD.known);
    case 'unchecked':
      return t(QUICK_ADD.unchecked);
    default:
      return t(QUICK_ADD.checking);
  }
}

function phoneRefusalWords(t: T, refusal: PhoneRefusal): TranslatedText {
  if (refusal.kind === 'missing') return t(QUICK_ADD.missing);
  return t(SIGN_IN.digitsMismatch, { typed: refusal.typed, needed: refusal.needed });
}

/** Every word the capture says, for its facts now (`packages/ui`'s `QuickAddFormWords` and more). */
export function quickAddWords(t: T, facts: QuickAddFacts) {
  const { check, phoneRefusal, saveFailure, referrer } = facts;
  return {
    title: t(QUICK_ADD.title),
    close: t(SHELL.close),
    form: {
      phone: t(QUICK_ADD.phone),
      phoneField: phoneFieldWords(t),
      name: t(QUICK_ADD.name),
      city: t(QUICK_ADD.city),
      type: t(QUICK_ADD.type),
      segments: {
        residential: t(DEAL_SEGMENT_WORD.residential),
        commercial: t(DEAL_SEGMENT_WORD.commercial),
      } satisfies Record<DealSegment, TranslatedText>,
      save: t(QUICK_ADD.save),
      saving: t(QUICK_ADD.saving),
      tryAgain: t(SIGN_IN.tryAgain),
      dismiss: t(CATALOG_SETTINGS.dismiss),
    },
    check: check.kind === 'none' ? null : { kind: check.kind, words: checkWords(t, check) },
    phoneRefusal: phoneRefusal === null ? null : phoneRefusalWords(t, phoneRefusal),
    returned:
      saveFailure === null
        ? null
        : t(QUICK_ADD.notSaved, { reason: failureSentence(t, saveFailure) }),
    cameFrom: referrer === null ? null : t(QUICK_ADD.cameFrom, { name: referrer }),
  };
}

/** The duplicate sheet's words over this capture: `phone` is the typed number as the screen shows it. */
export function quickAddDuplicateWords(t: T, duplicate: QuickAddDuplicate, phone: string) {
  const { record } = duplicate;
  return dedupeSheetWords(t, {
    phone,
    inScope: record.kind === 'visible',
    recordName: record.kind === 'visible' ? record.name : null,
    ownerName: duplicate.ownerName,
    stage: duplicate.stage,
    lastContactElapsedMs: duplicate.lastContactElapsedMs,
  });
}

/** The sheet's act that is out, or came back undone with what failed. */
export type QuickAddSheetAct =
  | { readonly state: 'waiting'; readonly choice: DedupeChoice }
  | {
      readonly state: 'failed';
      readonly choice: DedupeChoice;
      readonly failure: AttemptFailureLike;
    };

/** The act as the sheet draws it: a failure said in one sentence under the choice pressed. */
export function quickAddSheetAct(t: T, act: QuickAddSheetAct | null) {
  if (act === null || act.state === 'waiting') return act;
  return { state: act.state, choice: act.choice, reason: failureSentence(t, act.failure) };
}

/**
 * The toast a finished capture leaves as its sheet closes: *Lead saved* with its *Open*, which
 * calls `open` with the saved lead's id; the enquiry added to the existing lead; or the request
 * sent to its owner.
 */
export function quickAddDoneToast(t: T, done: QuickAddDone, open: (leadId: string) => void) {
  switch (done.kind) {
    case 'saved':
      return {
        tone: 'success' as const,
        title: t(QUICK_ADD.saved),
        act: { label: t(QUICK_ADD.open), onAct: () => open(done.leadId) },
      };
    case 'enquiry_logged':
      return {
        tone: 'success' as const,
        title:
          done.name === null
            ? t(QUICK_ADD.enquiryUnnamed)
            : t(QUICK_ADD.enquiryNamed, { name: done.name }),
      };
    default:
      return {
        tone: 'success' as const,
        title:
          done.ownerName === null
            ? t(QUICK_ADD.askedCompany)
            : t(QUICK_ADD.askedOwner, { owner: done.ownerName }),
      };
  }
}
