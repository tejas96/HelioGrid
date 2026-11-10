import type {
  CreateLead,
  DedupeMatchWire,
  EnquiryLogged,
  LeadDetail,
  LogEnquiry,
  OwnerRequest,
  OwnerRequestSent,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt, bodyOrRefusalAt } from '../errors/errors';

/**
 * What a quick add came to: the lead it made, or the record its number already belongs to — the
 * dedupe sheet's facts (`M02-07`, `M02-66`). Nothing was saved in the second case.
 */
export type LeadCaptureOutcome =
  | { readonly kind: 'created'; readonly lead: LeadDetail }
  | { readonly kind: 'duplicate'; readonly match: DedupeMatchWire };

/**
 * What logging an enquiry came to: the lead as it stands, or — for a lead outside the reader's
 * scope — only which lead and when (`M02-08`).
 */
export type EnquiryOutcome =
  | { readonly kind: 'in_scope'; readonly lead: LeadDetail }
  | { readonly kind: 'out_of_scope'; readonly logged: EnquiryLogged };

/**
 * Capture (`SCR-M02-01`, `M02-01`…`M02-16`): the live number check, the quick add, and the dedupe
 * sheet's answers — log an enquiry on the existing lead, or ask its owner for it.
 */
export interface LeadCaptureRepository {
  /** What the number already belongs to, `null` when nothing (`M02-07`). */
  match(phoneE164: string, signal?: AbortSignal): Promise<DedupeMatchWire | null>;
  /**
   * One key per body: a retried send makes one lead, and a changed body — a *Keep both* with its
   * reason — is a new create.
   */
  create(body: CreateLead): Promise<LeadCaptureOutcome>;
  /** On any lead the sheet showed, in the reader's scope or not (`M02-11`, `M02-08`). */
  logEnquiry(leadId: string, body: LogEnquiry): Promise<EnquiryOutcome>;
  /** *Open existing* on a lead outside the reader's scope: its owner is asked (`M02-08`). */
  askOwner(leadId: string, body: OwnerRequest): Promise<OwnerRequestSent>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadCaptureRepository(api: ApiClient): LeadCaptureRepository {
  const createKeys = createCreationKeys();
  const enquiryKeys = createCreationKeys();
  const askKeys = createCreationKeys();
  return {
    async match(phoneE164, signal) {
      const found = await bodyAt(
        () => api.leadCapture.match({ query: { phone: phoneE164 }, fetchOptions: { signal } }),
        200,
      );
      return found.match;
    },
    async create(body) {
      const headers = createKeys.headersFor(body);
      const answer = await bodyOrRefusalAt(
        () => api.leadCapture.create({ body, headers }),
        201,
        409,
      );
      if (!answer.answered) return { kind: 'duplicate', match: answer.refusal.error.facts };
      createKeys.settle();
      return { kind: 'created', lead: answer.body };
    },
    async logEnquiry(leadId, body) {
      const headers = enquiryKeys.headersFor({ leadId, body });
      const answer = await bodyAt(
        () => api.leadCapture.logEnquiry({ params: { id: leadId }, body, headers }),
        201,
      );
      enquiryKeys.settle();
      return 'lead' in answer
        ? { kind: 'in_scope', lead: answer }
        : { kind: 'out_of_scope', logged: answer };
    },
    async askOwner(leadId, body) {
      const headers = askKeys.headersFor({ leadId, body });
      const sent = await bodyAt(
        () => api.leadCapture.askOwner({ params: { id: leadId }, body, headers }),
        201,
      );
      askKeys.settle();
      return sent;
    },
  };
}
