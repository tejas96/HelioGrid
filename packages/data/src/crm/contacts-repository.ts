import type {
  AddContact,
  Contact,
  ContactRoleLabel,
  ContactRoleLabels,
  Customer,
  DedupeMatchWire,
  EditContact,
  SetPrimaryContact,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt, bodyOrRefusalAt } from '../errors/errors';

/**
 * What a contact's save came to: the contact, or the record its number already belongs to — shown
 * with the dedupe sheet's facts, pointing to Merge (`M02-02`). Nothing was saved in the second case.
 */
export type ContactSaveOutcome =
  | { readonly kind: 'saved'; readonly contact: Contact }
  | { readonly kind: 'phone_taken'; readonly match: DedupeMatchWire };

/**
 * A customer's contacts (`M02-34`): name, number and role label, and the one primary — the customer
 * themself unless a contact is named — with the company's role labels.
 */
export interface ContactsRepository {
  /** One key per customer and body: a retried send adds one contact. */
  add(customerId: string, body: AddContact): Promise<ContactSaveOutcome>;
  edit(contactId: string, body: EditContact): Promise<ContactSaveOutcome>;
  setPrimary(customerId: string, body: SetPrimaryContact): Promise<Customer>;
  roleLabels(signal?: AbortSignal): Promise<ContactRoleLabels>;
  /** The same text again answers the label the company has. */
  addRoleLabel(text: string): Promise<ContactRoleLabel>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createContactsRepository(api: ApiClient): ContactsRepository {
  const contactKeys = createCreationKeys();
  const labelKeys = createCreationKeys();
  return {
    async add(customerId, body) {
      const headers = contactKeys.headersFor({ customerId, body });
      const answer = await bodyOrRefusalAt(
        () => api.contacts.add({ params: { id: customerId }, body, headers }),
        201,
        409,
      );
      if (!answer.answered) return { kind: 'phone_taken', match: answer.refusal.error.facts };
      contactKeys.settle();
      return { kind: 'saved', contact: answer.body };
    },
    async edit(contactId, body) {
      const answer = await bodyOrRefusalAt(
        () => api.contacts.edit({ params: { id: contactId }, body }),
        200,
        409,
      );
      if (!answer.answered) return { kind: 'phone_taken', match: answer.refusal.error.facts };
      return { kind: 'saved', contact: answer.body };
    },
    setPrimary: (customerId, body) =>
      bodyAt(() => api.contacts.setPrimary({ params: { id: customerId }, body }), 200),
    roleLabels: (signal) =>
      bodyAt(() => api.contacts.roleLabels({ fetchOptions: { signal } }), 200),
    async addRoleLabel(text) {
      const body = { text };
      const headers = labelKeys.headersFor(body);
      const label = await bodyAt(() => api.contacts.addRoleLabel({ body, headers }), 201);
      labelKeys.settle();
      return label;
    },
  };
}
