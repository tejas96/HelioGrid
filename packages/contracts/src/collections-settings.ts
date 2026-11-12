import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { amountSchema } from './common';
import { settingsChangedSchema } from './document-templates';
import { baseError, errorEnvelope } from './error';

const c = initContract();

/** How the customer pays the company (`SCR-M11-04`): its UPI ID and bank, or what is missing. */
export const payToSchema = z.object({
  upiId: z.string().nullable(),
  payee: z.string(),
  bank: z
    .object({
      bankName: z.string(),
      accountName: z.string(),
      accountNumber: z.string(),
      routing: z.string(),
    })
    .nullable(),
  /** The market's cap on one UPI request — above it the sheet opens on the bank; null for none. */
  upiLimit: amountSchema.nullable(),
});
export type PayTo = z.infer<typeof payToSchema>;

/**
 * How customers pay the company (`SCR-M11-04`): its own UPI ID and the name a UPI app shows. The
 * bank account is the business profile's and is only shown here. Spread into
 * `tenantSettingsContract`, so each route keeps its key, path and operation id there.
 */

/** The settings as the page reads them, with a ₹1 request to test the UPI ID from a phone. */
export const collectionsSettingsSchema = z.object({
  payTo: payToSchema,
  /** `upi://pay?…` for one rupee (one of the currency's main unit), or null with no UPI ID. */
  testUri: z.string().nullable(),
  /** Only the owner changes where the money goes. */
  canEdit: z.boolean(),
  /** The market pack's modes a payment may be recorded as (`M11-35`). */
  modes: z.array(z.string()),
  lastSaved: settingsChangedSchema.nullable(),
});
export type CollectionsSettings = z.infer<typeof collectionsSettingsSchema>;

export const collectionsSettingsWriteSchema = z
  .object({
    /** `name@bank`, or null to take the UPI ID away. */
    upiId: z.string().trim().min(3).max(320).nullable(),
    payee: z.string().trim().min(1).max(100),
  })
  .strict();
export type CollectionsSettingsWrite = z.infer<typeof collectionsSettingsWriteSchema>;

/** The refusal only this write raises: the UPI ID does not read as `name@bank`. */
export const collectionsSettingsErrorCodes = ['UPI_ID_MALFORMED'] as const;
const malformed = errorEnvelope(z.enum(collectionsSettingsErrorCodes));
const guarded = { 401: errorEnvelope(baseError('UNAUTHENTICATED')) } as const;

export const collectionsSettingsRoutes = c.router({
  collections: {
    method: 'GET',
    path: '/settings/collections',
    summary: 'How customers pay the company — its UPI ID, the name shown and its bank account',
    responses: { 200: collectionsSettingsSchema, ...guarded },
  },
  saveCollections: {
    method: 'PUT',
    path: '/settings/collections',
    body: collectionsSettingsWriteSchema,
    summary: 'Set the UPI ID and the name shown — the owner alone, audited, and the owner is told',
    responses: { 200: collectionsSettingsSchema, 422: malformed, ...guarded },
  },
});
