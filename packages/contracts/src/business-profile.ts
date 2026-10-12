import { columnHoldsTypicalSystemSize } from '@heliogrid/domain';
import { z } from 'zod';
import { tenantSegmentSchema } from './common';
import { labelSchema } from './document-content';
import { citySchema, companyNameSchema } from './tenant';

/**
 * The company's identity facts (`M01-24`, `M01-25`, `M01-31`): one write-point every document,
 * script, link and invoice reads by reference. Mirrors domain's `BusinessProfileSettings` and
 * `TaxRegistration`.
 */

/**
 * `M06-17`'s four bank facts under market-neutral names; the routing identifier is what the pack
 * labels IFSC in IN (`formats.bankRoutingLabel`).
 */
export const bankDetailsSchema = z.object({
  bankName: labelSchema,
  accountName: labelSchema,
  /** ISO 13616 bounds an account identifier at 34 characters; a national number is shorter. */
  accountNumber: z.string().trim().min(1).max(34),
  bankRoutingIdentifier: z.string().trim().min(1).max(34),
});
export type BankDetails = z.infer<typeof bankDetailsSchema>;

/** A postal code as the owner writes it. No market declares its format yet, so only its length is held. */
const postalCodeSchema = z.string().trim().min(1).max(16);

/**
 * The business profile (`M01-31`): the five parts as one write, the two `M01-23` declarations
 * among them. Replaced whole — a screen sends what it read, changed where the owner typed.
 */
export const businessProfileSchema = z.object({
  companyName: companyNameSchema,
  city: citySchema,
  segment: tenantSegmentSchema.nullable(),
  /**
   * Declared in kWp; rendered with the tier it was declared at — `estimated · declared by you`.
   * A figure the stored column cannot hold is refused here, not there: one over its ceiling
   * fails in the database, one finer than its precision is rounded away. The rule is domain's and
   * a refinement, which the emitted spec does not print: a `max` or a `multipleOf` written here
   * reads as a breaking bound to the judge that compares specs.
   */
  typicalSystemKwp: z
    .number()
    .nonnegative()
    .refine(columnHoldsTypicalSystemSize, 'not a figure the column holds')
    .nullable(),
  address: z.string().trim().min(1).max(500).nullable(),
  postalCode: postalCodeSchema.nullable(),
  bankDetails: bankDetailsSchema.nullable(),
});
export type BusinessProfile = z.infer<typeof businessProfileSchema>;

/**
 * The profile as a client writes it. `postalCode` may be left out: a client built before the field
 * existed sends back what it read, and a whole replace must not clear a fact it never saw — absent
 * keeps what is stored, `null` clears it.
 */
export const businessProfileWriteSchema = businessProfileSchema.extend({
  postalCode: postalCodeSchema.nullable().optional(),
});
export type BusinessProfileWrite = z.infer<typeof businessProfileWriteSchema>;

/** One registration of a type the tenant's market declares (`M01-24`, `M01-25`); the type is `pack.tax`'s word. */
export const taxRegistrationSchema = z.object({
  registrationType: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(40),
});
export type TaxRegistration = z.infer<typeof taxRegistrationSchema>;

/**
 * The registrations as one list, replaced whole. One entry per type: a second entry of a type
 * already in the list is refused on that entry's field, never silently collapsed.
 */
export const taxRegistrationsSchema = z
  .object({
    registrations: z.array(taxRegistrationSchema),
  })
  .superRefine(({ registrations }, ctx) => {
    const seen = new Set<string>();
    registrations.forEach((registration, index) => {
      if (seen.has(registration.registrationType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['registrations', index, 'registrationType'],
          message: 'one registration per type',
        });
      }
      seen.add(registration.registrationType);
    });
  });
export type TaxRegistrations = z.infer<typeof taxRegistrationsSchema>;
