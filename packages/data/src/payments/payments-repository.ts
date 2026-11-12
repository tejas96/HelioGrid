import {
  type MoneyDue,
  PAYMENT_ACT_REFUSED,
  type PaymentReceipt,
  type ProjectPayments,
  type paymentsContract,
  type ReceiptPdf,
  type RecordedPayment,
  type ReferenceCheck,
} from '@heliogrid/contracts';
import type { ClientInferRequest } from '@ts-rest/core';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { ApiError, bodyAt, bodyOrRefusalAt } from '../errors/errors';

/**
 * A money act the part's standing does not allow (`M11-38`, `M11-46`, `M11-49`): an `ApiError`
 * with code `PAYMENT_ACT_REFUSED` that keeps domain's reason, and for a reused UTR the receipt that
 * already carries it, so the sheet says which.
 */
export class PaymentActRefusedError extends ApiError {
  constructor(
    /** Domain's `PaymentRefusal` — or one a newer server has learned. */
    readonly refusal: string,
    readonly receiptNumber: string | null,
    message: string,
  ) {
    super(422, message, { code: PAYMENT_ACT_REFUSED });
    this.name = 'PaymentActRefusedError';
  }
}

export type RecordPaymentBody = ClientInferRequest<typeof paymentsContract.record>['body'];
export type MoneyDueAsk = ClientInferRequest<typeof paymentsContract.moneyDue>['query'];

/**
 * A project's money (`SCR-M11-01`…`03`): Money due across the projects the reader may see, one
 * project's schedule and ledger, a receipt to share, and the four acts — each answering the
 * payments screen as it now stands.
 */
export interface PaymentsRepository {
  moneyDue(query: MoneyDueAsk, signal?: AbortSignal): Promise<MoneyDue>;
  payments(projectId: string, signal?: AbortSignal): Promise<ProjectPayments>;
  receipt(projectId: string, entryId: string, signal?: AbortSignal): Promise<PaymentReceipt>;
  /** The receipt PDF's link: made on the first ask, kept after; null while it is still made. */
  receiptPdf(projectId: string, entryId: string): Promise<ReceiptPdf>;
  /** Whether a typed UTR or cheque number is already on a receipt that stands (`M11-38`). */
  referenceCheck(reference: string, signal?: AbortSignal): Promise<ReferenceCheck>;
  /**
   * Money that arrived. The same body sent again — a second tap after a dropped answer — carries
   * the same retry key and answers the entry the first made (`F4-07`) — and names it, so its photo
   * is stored against it (`M11-37`).
   */
  record(projectId: string, body: RecordPaymentBody): Promise<RecordedPayment>;
  reverse(projectId: string, entryId: string, reason: string): Promise<ProjectPayments>;
  waive(projectId: string, partId: string, reason: string): Promise<ProjectPayments>;
  /** The person shared the part's request: a tap, never a delivery (ruling 2026-11-10). */
  shared(projectId: string, partId: string): Promise<ProjectPayments>;
}

type Refusal = { readonly error: { readonly code: string; readonly message: string } } & {
  readonly error: {
    readonly facts?: { readonly refusal: string; readonly receiptNumber: string | null };
  };
};

/** A refused act: domain's reason where the api gave one, else the plain error. */
function refusedWith(refusal: Refusal): never {
  const { error } = refusal;
  if (error.facts !== undefined) {
    throw new PaymentActRefusedError(error.facts.refusal, error.facts.receiptNumber, error.message);
  }
  throw new ApiError(422, error.message, { code: error.code });
}

type ActAnswer = Awaited<ReturnType<ApiClient['payments']['reverse']>>;

/** Every act but recording answers alike: the payments screen at 200, or the refusal at 422. */
async function standingAfter(send: () => Promise<ActAnswer>): Promise<ProjectPayments> {
  const answer = await bodyOrRefusalAt(send, 200, 422);
  if (answer.answered) return answer.body;
  return refusedWith(answer.refusal as Refusal);
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createPaymentsRepository(api: ApiClient): PaymentsRepository {
  const money = api.payments;
  const creationKeys = createCreationKeys();
  /*
   * A retry is the same payment when the person's facts are the same: the moment it was captured
   * changes on every press, so it never makes a new key — or a lost answer pressed again would
   * record the money twice.
   */
  const retryOf = (id: string, body: RecordPaymentBody) => ({
    id,
    partId: body.partId,
    amount: body.amount,
    mode: body.mode,
    reference: body.reference,
    receivedOn: body.receivedOn,
  });
  const capturedAt = () => new Date().toISOString();
  return {
    moneyDue: (query, signal) =>
      bodyAt(() => money.moneyDue({ query, fetchOptions: { signal } }), 200),
    payments: (id, signal) =>
      bodyAt(() => money.payments({ params: { id }, fetchOptions: { signal } }), 200),
    receipt: (id, entryId, signal) =>
      bodyAt(() => money.receipt({ params: { id, entryId }, fetchOptions: { signal } }), 200),
    receiptPdf: (id, entryId) => bodyAt(() => money.receiptPdf({ params: { id, entryId } }), 200),
    referenceCheck: (reference, signal) =>
      bodyAt(() => money.referenceCheck({ query: { reference }, fetchOptions: { signal } }), 200),
    record: async (id, body) => {
      const answer = await bodyOrRefusalAt(
        () =>
          money.record({
            params: { id },
            body,
            headers: creationKeys.headersFor(retryOf(id, body)),
          }),
        201,
        422,
      );
      if (!answer.answered) return refusedWith(answer.refusal as Refusal);
      creationKeys.settle();
      return answer.body;
    },
    reverse: (id, entryId, reason) =>
      standingAfter(() =>
        money.reverse({ params: { id, entryId }, body: { reason, capturedAt: capturedAt() } }),
      ),
    waive: (id, partId, reason) =>
      standingAfter(() =>
        money.waive({ params: { id, partId }, body: { reason, capturedAt: capturedAt() } }),
      ),
    shared: (id, partId) =>
      standingAfter(() =>
        money.shared({ params: { id, partId }, body: { capturedAt: capturedAt() } }),
      ),
  };
}
