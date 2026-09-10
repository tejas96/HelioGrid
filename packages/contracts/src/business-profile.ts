import { z } from 'zod';
import { tenantSegmentSchema } from './common';
import { labelSchema } from './document-content';
import { citySchema, companyNameSchema } from './tenant';

/**
 * The company's identity facts (`M01-24`, `M01-25`, `M01-31`): one write-point every document,
 * script, link and invoice reads by reference. Mirrors domain's `BusinessProfileSettings` and
 * `TaxRegistration`.
 */

/** `M06-17`'s four bank facts under market-neutral names; the routing identifier is what the pack labels IFSC in IN. */
export const bankDetailsSchema = z.object({
  bankName: labelSchema,
  accountName: labelSchema,
  /** ISO 13616 bounds an account identifier at 34 characters; a national number is shorter. */
  accountNumber: z.string().trim().min(1).max(34),
  bankRoutingIdentifier: z.string().trim().min(1).max(34),
});
export type BankDetails = z.infer<typeof bankDetailsSchema>;

/**
 * The business profile (`M01-31`): the five parts as one write, the two `M01-23` declarations
 * among them. Replaced whole — a screen sends what it read, changed where the owner typed.
 */
export const businessProfileSchema = z.object({
  companyName: companyNameSchema,
  city: citySchema,
  segment: tenantSegmentSchema.nullable(),
  /** Declared in kWp; rendered with the tier it was declared at — `estimated · declared by you`. */
  typicalSystemKwp: z.number().nonnegative().nullable(),
  address: z.string().trim().min(1).max(500).nullable(),
  bankDetails: bankDetailsSchema.nullable(),
});
export type BusinessProfile = z.infer<typeof businessProfileSchema>;

/** One registration of a type the tenant's market declares (`M01-24`, `M01-25`); the type is `pack.tax`'s word. */
export const taxRegistrationSchema = z.object({
  registrationType: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(40),
});
export type TaxRegistration = z.infer<typeof taxRegistrationSchema>;

export const taxRegistrationsSchema = z.object({
  registrations: z.array(taxRegistrationSchema),
});
export type TaxRegistrations = z.infer<typeof taxRegistrationsSchema>;
