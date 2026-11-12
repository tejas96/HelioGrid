import type { PayRequest, PayTo, ProjectPayments } from '@heliogrid/contracts';
import {
  availablePaymentModes,
  type CalendarDate,
  formatMoney,
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
    parts: stood.map((part) => partOf(part, format)),
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

function requestOf(part: StoodPart, input: PaymentsViewInput, format: MoneyFormat): PayRequest {
  const { facts, pack, payTo } = input;
  const owed = part.standing.outstanding;
  const amount = minorUnitsToDecimal(owed, format.digits);
  const limit = pack.paymentRails.upiRequestLimit ?? null;
  const overUpiLimit = limit !== null && owed > limit;
  const note = `${projectNumberOf(facts.head.number)} · ${part.facts.label}`;
  const upiId = payTo.upiId !== null && limit !== null && !overUpiLimit ? payTo.upiId : null;
  const text = payRequestMessage(input.t, {
    customer: facts.head.customerName,
    part: part.facts.label,
    number: projectNumberOf(facts.head.number),
    amount: formatMoney(pack.formats, amount),
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
    note,
    message: { language: input.language, text },
    chatUri: chatRequestUri(pack.paymentRails.requestChat ?? null, facts.head.phoneE164, text),
  };
}
