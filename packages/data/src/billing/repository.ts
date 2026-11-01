import type {
  BillingDocuments,
  BillingDocumentsQuery,
  BillingHistory,
  BillingHome,
  BillingReminders,
  BillingStanding,
  CancelRequest,
  CheckoutRequest,
  FileDownload,
  PaginationQuery,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/**
 * Platform billing as a company reads and acts on it (`SCR-M12-02`). `standing` answers every
 * member; the rest are the Owner's. Every act opens the gateway's own page or moves the row on
 * the server; nothing here holds a payment instrument (`M12-10`).
 */
export interface BillingRepository {
  /** `null` for a company that holds no subscription. */
  standing(signal?: AbortSignal): Promise<BillingStanding | null>;
  /** `null` for a company that holds no subscription. */
  home(signal?: AbortSignal): Promise<BillingHome | null>;
  documents(query: BillingDocumentsQuery, signal?: AbortSignal): Promise<BillingDocuments>;
  /** `null` while the PDF is not made, or for a document this company does not hold. */
  documentDownload(id: string): Promise<FileDownload | null>;
  reminders(query: PaginationQuery, signal?: AbortSignal): Promise<BillingReminders>;
  history(query: PaginationQuery, signal?: AbortSignal): Promise<BillingHistory>;
  /** A trial's conversion or a dead row's reactivation: the gateway's page to open. */
  checkout(request: CheckoutRequest): Promise<string>;
  /** Answers the paid period's end the plan runs to. */
  cancel(request: CancelRequest): Promise<string>;
  /** Answers the credit note's number. */
  refund(): Promise<string>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createBillingRepository(api: ApiClient): BillingRepository {
  return {
    async standing(signal) {
      try {
        const res = await api.billingHome.standing({ fetchOptions: { signal } });
        if (res.status === 404) return null;
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async home(signal) {
      try {
        const res = await api.billingHome.home({ fetchOptions: { signal } });
        if (res.status === 404) return null;
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async documents(query, signal) {
      try {
        const res = await api.billingHome.documents({ query, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async documentDownload(id) {
      try {
        const res = await api.billingDocument.documentDownload({ params: { id } });
        if (res.status === 404) return null;
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async reminders(query, signal) {
      try {
        const res = await api.billingHome.reminders({ query, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async history(query, signal) {
      try {
        const res = await api.billingHome.history({ query, fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async checkout(request) {
      try {
        const res = await api.billing.checkout({ body: request });
        if (res.status !== 200) throw toApiError(res);
        return res.body.checkoutUrl;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async cancel(request) {
      try {
        const res = await api.billing.cancel({ body: request });
        if (res.status !== 200) throw toApiError(res);
        return res.body.runsUntil;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async refund() {
      try {
        const res = await api.billing.refund({ body: {} });
        if (res.status !== 200) throw toApiError(res);
        return res.body.creditNoteNumber;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
