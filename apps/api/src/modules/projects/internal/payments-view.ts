import type { PayRequest, PayTo, ProjectPayments } from '@heliogrid/contracts';
import {
  availablePaymentModes,
  type CalendarDate,
  formatMinorUnitsPlainly,
  type MarketPack,
  minorUnits,
  UI_LANGUAGES,
  type UiLanguage,
} from '@heliogrid/domain';
import {
  chatRequestUri,
  minorUnitsToDecimal,
  projectNumberOf,
  receiptNumberOf,
  upiRequestUri,
} from '@heliogrid/domain/server';
import { payRequestMessage, type Translator } from '@heliogrid/i18n';
import type { PaymentsFacts } from '../projects.payments-read.repository';
import { glanceOf, type MoneyFormat, partOf, type StoodPart, stoodPartsOf } from './money';

/*
 * The payments screen (`SCR-M11-02`) built from its facts: every part with its standing, the
 * ledger with each reversed payment marked, and a pay request for each part that still owes —
 * exactly what it owes (`M11-25`), to the company's own UPI ID or bank (`M11-01`), in the
 * customer's language (`F3-06`).
 */

/** The customer's language where the product speaks it, else English. */
export function languageOfCustomer(preferred: string | null): UiLanguage {
  return UI_LANGUAGES.find((language) => language === preferred) ?? 'en';
}

export interface PaymentsViewInput {
  readonly facts: PaymentsFacts;
  readonly pack: MarketPack;
  readonly payTo: PayTo;
  readonly company: string;
  readonly t: Translator['t'];
  readonly language: UiLanguage;
  readonly today: CalendarDate;
  readonly acts: ProjectPayments['acts'];
}

export function paymentsViewOf(input: PaymentsViewInput): ProjectPayments {
  const { facts, pack } = input;
  const format: MoneyFormat = {
    currency: pack.formats.currency,
    digits: pack.formats.minorUnitDigits,
    timeZone: facts.head.timeZone,
  };
  const decimal = (amount: number) => minorUnitsToDecimal(minorUnits(amount), format.digits);
  const stood = stoodPartsOf(facts.parts);
  const { duePart: _, ...money } = glanceOf(stood, format);
  const reversed = new Set(facts.entries.flatMap((entry) => entry.reversesId ?? []));
  return {
    projectId: facts.head.projectId,
    number: projectNumberOf(facts.head.number),
    name: facts.head.customerName,
    stage: facts.head.stage,
    today: input.today,
    money,
    // A part's stored position keeps growing across plans; the screen counts the parts in force.
    parts: stood.map((part, at) => ({ ...partOf(part, format), position: at + 1 })),
    entries: facts.entries.map((entry) => ({
      id: entry.id,
      partId: entry.partId,
      kind: entry.kind,
      amount: decimal(entry.amountMinor),
      mode: entry.mode,
      reference: entry.reference,
      receivedOn: entry.receivedOn,
      receiptNumber: entry.receiptNumber === null ? null : receiptNumberOf(entry.receiptNumber),
      fileId: entry.fileId,
      recordedAt: entry.recordedAt.toISOString(),
      recordedBy: entry.recordedBy,
      reversesId: entry.reversesId,
      reason: entry.reason,
      reversed: reversed.has(entry.id),
    })),
    earlierPlans: facts.earlierPlans.map((plan) => ({
      version: plan.version,
      replacedAt: plan.replacedAt.toISOString(),
      replacedBy: plan.replacedBy,
      parts: plan.parts.map((part) => ({
        id: part.id,
        label: part.label,
        amount: decimal(part.amountMinor),
        dueOnStage: part.dueOnStage,
      })),
    })),
    payTo: input.payTo,
    requests: owingFirst(stood).map((part) => requestOf(part, input, format)),
    modes: availablePaymentModes(pack.paymentRails, false).map((mode) => mode.mode),
    acts: input.acts,
  };
}

/** The parts that still owe money: due ones first, longest waiting first, then the rest in order. */
function owingFirst(parts: readonly StoodPart[]): StoodPart[] {
  return parts
    .filter((part) => part.standing.outstanding > 0)
    .sort(
      (a, b) =>
        Number(b.due) - Number(a.due) ||
        (a.facts.dueSince ?? 0) - (b.facts.dueSince ?? 0) ||
        a.facts.position - b.facts.position,
    );
}

/** How one owing part is paid: its exact amount, the UPI request where one fits, and its note. */
export interface PayInstrument {
  readonly amount: string;
  readonly note: string;
  /** The company's UPI ID, where it saved one and the amount is within the market's request cap. */
  readonly upiId: string | null;
  readonly upiUri: string | null;
  readonly overUpiLimit: boolean;
}

/**
 * The instrument for what a part still owes (`M11-25`, `F5-58`): exactly that amount, to the
 * company's own UPI ID or bank — the one arithmetic the payments screen and the customer's link
 * both show.
 */
export function payInstrumentOf(
  part: StoodPart,
  facts: { readonly projectNumber: number; readonly pack: MarketPack; readonly payTo: PayTo },
  format: MoneyFormat,
): PayInstrument {
  const { pack, payTo } = facts;
  const owed = part.standing.outstanding;
  const limit = pack.paymentRails.upiRequestLimit ?? null;
  const overUpiLimit = limit !== null && owed > limit;
  const note = `${projectNumberOf(facts.projectNumber)} · ${part.facts.label}`;
  const upiId = payTo.upiId !== null && limit !== null && !overUpiLimit ? payTo.upiId : null;
  return {
    amount: minorUnitsToDecimal(owed, format.digits),
    note,
    upiId,
    upiUri:
      upiId === null
        ? null
        : upiRequestUri({
            upiId,
            payee: payTo.payee,
            amount: owed,
            fractionDigits: format.digits,
            currency: format.currency,
            note,
          }),
    overUpiLimit,
  };
}

function requestOf(part: StoodPart, input: PaymentsViewInput, format: MoneyFormat): PayRequest {
  const { facts, pack, payTo } = input;
  const { amount, note, upiId, upiUri, overUpiLimit } = payInstrumentOf(
    part,
    { projectNumber: facts.head.number, pack, payTo },
    format,
  );
  const text = payRequestMessage(input.t, {
    customer: facts.head.customerName,
    part: part.facts.label,
    number: projectNumberOf(facts.head.number),
    // What is owed, never rounded: a zero fraction is left unsaid, paise are printed (`F1-07`).
    amount: formatMinorUnitsPlainly(pack.formats, part.standing.outstanding),
    company: input.company,
    upi: upiId === null ? null : { upiId, payee: payTo.payee, note },
    bank:
      payTo.bank === null
        ? null
        : {
            accountName: payTo.bank.accountName,
            accountNumber: payTo.bank.accountNumber,
            routingLabel: pack.formats.bankRoutingLabel,
            routing: payTo.bank.routing,
            bankName: payTo.bank.bankName,
          },
  });
  return {
    partId: part.facts.id,
    amount,
    upiUri,
    overUpiLimit,
    note,
    message: { language: input.language, text },
    chatUri: chatRequestUri(pack.paymentRails.requestChat ?? null, facts.head.phoneE164, text),
  };
}
