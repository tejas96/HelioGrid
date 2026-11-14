import { DEVICE_CLASSES, LINK_STATUSES } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createHeadersSchema, extensibleEnum, uuidSchema } from '../common';
import { leadParamsSchema } from '../crm/leads';
import { capturedAtSchema, memberRefSchema } from '../crm/schemas';
import {
  baseError,
  errorEnvelope,
  errorEnvelopeWithFacts,
  IDEMPOTENCY_KEY_REUSED,
  unauthenticatedEnvelope,
} from '../error';

const c = initContract();

/*
 * A deal's customer links, as the company sees them (`F5-26`, `F5-27`, `F5-30`, `SCR-M06-20`): one
 * named link per person, who opened which and when. The customer's page shows none of this. A link
 * is minted by the first share (`F5-20`); here a person names another for a second contact, gives
 * one a new address, or turns one off — at once, with no undo (`F5-76`).
 */

const labelSchema = z.string().trim().min(1).max(80);

/** One named link (`F5-26`). Its address is shown only when it is asked for: it is the key. */
const customerLinkObject = z.object({
  id: uuidSchema,
  label: z.string(),
  /** The person it was minted for, where one was named. */
  contact: z.object({ id: uuidSchema, name: z.string() }).nullable(),
  status: extensibleEnum(LINK_STATUSES),
  mintedAt: z.string().datetime(),
  mintedBy: memberRefSchema.nullable(),
  /** Opens attributed to this link (`F5-27`): how many, the latest, and on what kind of device. */
  opens: z.number().int().nonnegative(),
  lastOpenedAt: z.string().datetime().nullable(),
  lastDeviceClass: extensibleEnum(DEVICE_CLASSES).nullable(),
  /** This link carried the customer's answer on the version in question. */
  answered: z.boolean(),
  revokedAt: z.string().datetime().nullable(),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface CustomerLinkSchema extends CustomerLinkSchemaObject {}
type CustomerLinkSchemaObject = typeof customerLinkObject;
export const customerLinkSchema: CustomerLinkSchema = customerLinkObject;
export type CustomerLink = z.infer<typeof customerLinkSchema>;

const customerLinksObject = z.object({
  links: z.array(customerLinkSchema),
  /** The contacts a new link can be named for. */
  contacts: z.array(z.object({ id: uuidSchema, name: z.string() })),
  acts: z.object({ mint: z.boolean(), revoke: z.boolean() }),
});
/** Named, so each route that carries it references the name rather than spelling its whole type. */
export interface CustomerLinksSchema extends CustomerLinksSchemaObject {}
type CustomerLinksSchemaObject = typeof customerLinksObject;
export const customerLinksSchema: CustomerLinksSchema = customerLinksObject;
export type CustomerLinks = z.infer<typeof customerLinksSchema>;

/** A link with its address — the one moment the address crosses the wire. */
export const customerLinkAddressSchema = z.object({
  link: customerLinkSchema,
  url: z.string().url(),
});

export const mintLinkSchema = z
  .object({
    label: labelSchema,
    contactId: uuidSchema.nullable(),
    capturedAt: capturedAtSchema,
  })
  .strict();
export type MintLink = z.infer<typeof mintLinkSchema>;

const linkActSchema = z.object({ capturedAt: capturedAtSchema }).strict();

/** A new address for the same link; `revokeEarlier` kills the old one in the same act (`F5-76`). */
export const remintLinkSchema = z
  .object({ revokeEarlier: z.boolean(), capturedAt: capturedAtSchema })
  .strict();

/** No link can be named before the proposal is shared (`F5-20`), or the link is already off. */
export const LINK_ACT_REFUSED = 'LINK_ACT_REFUSED' as const;
const LINK_ACT_REFUSALS = ['not_shared', 'already_revoked'] as const;
const refused = errorEnvelopeWithFacts(
  z.literal(LINK_ACT_REFUSED),
  z.object({ refusal: extensibleEnum(LINK_ACT_REFUSALS) }),
);

const linkParamsSchema = z.object({ id: uuidSchema });
const notFound = errorEnvelope(baseError('NOT_FOUND'));

export const customerLinksContract = c.router({
  ofLead: {
    method: 'GET',
    path: '/leads/:id/links',
    pathParams: leadParamsSchema,
    summary: 'The deal’s named links: who each is for, its state and who opened it when',
    responses: { 200: customerLinksSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  mint: {
    method: 'POST',
    path: '/leads/:id/links',
    pathParams: leadParamsSchema,
    headers: createHeadersSchema,
    body: mintLinkSchema,
    summary: 'Name a link for another person on a shared deal — its address is answered once, here',
    responses: {
      201: customerLinkAddressSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: z.union([refused, errorEnvelope(extensibleEnum([IDEMPOTENCY_KEY_REUSED]))]),
    },
  },
  address: {
    method: 'POST',
    path: '/links/:id/address',
    pathParams: linkParamsSchema,
    body: linkActSchema,
    summary: 'Read a live link’s address to copy it — never a list field',
    responses: {
      200: customerLinkAddressSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: refused,
    },
  },
  relabel: {
    method: 'PUT',
    path: '/links/:id/label',
    pathParams: linkParamsSchema,
    body: z.object({ label: labelSchema }).strict(),
    summary: 'Rename a link — only the company sees its name',
    responses: { 200: customerLinkSchema, 401: unauthenticatedEnvelope, 404: notFound },
  },
  remint: {
    method: 'POST',
    path: '/links/:id/remint',
    pathParams: linkParamsSchema,
    body: remintLinkSchema,
    summary:
      'Give the link a new address — the earlier one keeps working unless it is turned off in the same act (`F5-22`)',
    responses: {
      200: customerLinkAddressSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: refused,
    },
  },
  revoke: {
    method: 'POST',
    path: '/links/:id/revoke',
    pathParams: linkParamsSchema,
    body: linkActSchema,
    summary: 'Turn the link off — it stops at once, and every other link on the deal keeps working',
    responses: {
      200: customerLinkSchema,
      401: unauthenticatedEnvelope,
      404: notFound,
      422: refused,
    },
  },
});
