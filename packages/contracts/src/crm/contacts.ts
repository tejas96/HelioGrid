import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, phoneE164Schema, uuidSchema } from '../common';
import {
  baseError,
  errorEnvelope,
  errorEnvelopeWithFacts,
  keyReusedEnvelope,
  unauthenticatedEnvelope,
} from '../error';
import { personNameSchema } from '../tenant';
import {
  contactRoleLabelSchema,
  contactSchema,
  customerSchema,
  dedupeMatchSchema,
} from './schemas';

const c = initContract();

/*
 * A customer's contacts (`M02-34`): name, number and role label, exactly one primary — the customer
 * themself unless a contact is named. A contact's number joins dedupe (`M02-02`), so a number that
 * already belongs to another customer is refused with that record's facts, pointing to Merge.
 */

const roleLabelTextSchema = z.string().trim().min(1).max(60);

export const addContactSchema = z
  .object({
    name: personNameSchema,
    phoneE164: phoneE164Schema,
    roleLabelId: uuidSchema.nullable(),
  })
  .strict();
export type AddContact = z.infer<typeof addContactSchema>;

/** One or more of a contact's facts; `roleLabelId: null` takes its label away. */
export const editContactSchema = addContactSchema.partial().strict();
export type EditContact = z.infer<typeof editContactSchema>;

/** The primary contact: a contact of this customer, or `null` for the customer themself. */
export const setPrimaryContactSchema = z.object({ contactId: uuidSchema.nullable() }).strict();
export type SetPrimaryContact = z.infer<typeof setPrimaryContactSchema>;

/** The company's own label, as typed (`F3-10`); the seeded three are worded by the catalog. */
export const addContactRoleLabelSchema = z.object({ text: roleLabelTextSchema }).strict();
export type AddContactRoleLabel = z.infer<typeof addContactRoleLabelSchema>;

export const contactRoleLabelsSchema = z.object({ items: z.array(contactRoleLabelSchema) });
export type ContactRoleLabels = z.infer<typeof contactRoleLabelsSchema>;

/** The number is already a customer's or a contact's; `facts` is that record, as the sheet shows it. */
export const contactErrorCodes = ['CONTACT_PHONE_TAKEN'] as const;
export const contactErrorCodeSchema = z.enum(contactErrorCodes);
const phoneTaken = errorEnvelopeWithFacts(contactErrorCodeSchema, dedupeMatchSchema);

const notFound = errorEnvelope(baseError('NOT_FOUND'));
const customerParams = z.object({ id: uuidSchema });

export const contactsContract = c.router({
  add: {
    method: 'POST',
    path: '/customers/:id/contacts',
    pathParams: customerParams,
    headers: createHeadersSchema,
    body: addContactSchema,
    summary:
      'Add a contact with a role label — refused with the existing record’s facts when the number is someone’s already',
    responses: {
      201: contactSchema,
      401: unauthenticatedEnvelope,
      /** No such customer the reader may see, or no such label. */
      404: notFound,
      409: phoneTaken,
      422: keyReusedEnvelope,
    },
  },
  edit: {
    method: 'PATCH',
    path: '/contacts/:id',
    pathParams: z.object({ id: uuidSchema }),
    body: editContactSchema,
    summary: 'Change a contact’s name, number or label — a number someone else holds is refused',
    responses: { 200: contactSchema, 401: unauthenticatedEnvelope, 404: notFound, 409: phoneTaken },
  },
  setPrimary: {
    method: 'PUT',
    path: '/customers/:id/primary-contact',
    pathParams: customerParams,
    body: setPrimaryContactSchema,
    summary: 'Name the one primary contact — a contact of this customer, or the customer themself',
    responses: { 200: customerSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  roleLabels: {
    method: 'GET',
    path: '/contact-role-labels',
    summary: 'The company’s contact role labels: the seeded three and its own',
    responses: { 200: contactRoleLabelsSchema, 401: unauthenticatedEnvelope },
  },
  addRoleLabel: {
    method: 'POST',
    path: '/contact-role-labels',
    headers: createHeadersSchema,
    body: addContactRoleLabelSchema,
    summary: 'Add a label of the company’s own; the same text again answers the label it has',
    responses: {
      201: contactRoleLabelSchema,
      401: unauthenticatedEnvelope,
      422: keyReusedEnvelope,
    },
  },
});
