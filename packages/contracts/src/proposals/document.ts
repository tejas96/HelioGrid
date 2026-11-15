import { z } from 'zod';
import { nonNegativeAmountSchema, phoneE164Schema, uuidSchema } from '../common';
import { dealSegmentSchema } from '../crm/vocabulary';
import { compliantShadesSchema, hexColourSchema } from '../document-templates';
import { uiLanguageResponseSchema } from '../locale';
import { proposalFieldSetSchema } from './field-set';
import {
  proposalEmiSchema,
  proposalGenerationSchema,
  proposalMoneySchema,
  proposalSavingsSchema,
} from './money';
import { basisLineSchema, proposalPageSchema, supplyPhaseSchema } from './vocabulary';

/*
 * The proposal document's one value set (`M06-50`, `F5-38`, `T-M06-015`): what the builder's stage,
 * the preview, the document screen, the PDF's print page and the customer's link all draw their
 * pages from — so they cannot differ. A draft's is assembled live; a version's is its frozen
 * snapshot. Our cost and the margin are never in it for a reader who may not see cost, and never
 * in a version's (`M06-09`).
 */

/** The site's region and district as the lead holds them (`M06-09`). */
export const areaRefSchema = z.object({
  /** The market pack's region code — `IN-MH`. */
  area: z.string().min(1).max(12),
  district: z.string().min(1).max(120).nullable(),
});
export type AreaRefWire = z.infer<typeof areaRefSchema>;

/** What the proposal reads of its lead and customer (`T-M06-032`) — the lead's own facts, never a copy. */
export const proposalDealSchema = z.object({
  segment: dealSegmentSchema.nullable(),
  area: areaRefSchema.nullable(),
  siteAddress: z.string().nullable(),
  sanctionedLoadKw: z.number().positive().nullable(),
  supplyPhase: supplyPhaseSchema.nullable(),
  monthlyBill: nonNegativeAmountSchema.nullable(),
  clientName: z.string().nullable(),
  /** Whether the customer's number passes the market pack's phone format (`M06-57`). */
  clientPhoneValid: z.boolean(),
});
export type ProposalDealWire = z.infer<typeof proposalDealSchema>;

const bankDetailsSchema = z.object({
  bankName: z.string(),
  accountName: z.string(),
  accountNumber: z.string(),
  bankRoutingIdentifier: z.string(),
});

/**
 * The company's facts as the document prints them (`M06-07`, `M06-17`): read live until Generate,
 * frozen with the version. A fact the company has not given is `null` and its block is left out —
 * no placeholder ever prints. A picture travels as a short-lived address.
 */
export const proposalCompanySchema = z.object({
  name: z.string(),
  phoneE164: phoneE164Schema.nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  logoUrl: z.string().url().nullable(),
  /** The company's own cover photo, when the proposal's cover picture is `own`. */
  coverPhotoUrl: z.string().url().nullable(),
  taxRegistration: z.object({ registrationType: z.string(), value: z.string() }).nullable(),
  /** `null` where the company has none, or this proposal does not print them. */
  bankDetails: bankDetailsSchema.nullable(),
  brandColour: hexColourSchema.nullable(),
  /** The shades derived from the colour on this read (`F7-07`) — never a raw colour that fails contrast. */
  shades: compliantShadesSchema.nullable(),
});
export type ProposalCompanyWire = z.infer<typeof proposalCompanySchema>;

const documentShape = {
  /** `PRP-0042`; `null` until the first Generate assigns it (`M06-44`). */
  number: z.string().nullable(),
  /** `null` for a draft's live assembly. */
  version: z.number().int().positive().nullable(),
  /** When the version was generated; for a draft, when this read was assembled. */
  date: z.string().datetime(),
  fields: proposalFieldSetSchema,
  deal: proposalDealSchema,
  company: proposalCompanySchema,
  /** `null` on a draft while no price is typed: a figure with no resolved value is never read as zero. */
  money: proposalMoneySchema.nullable(),
  generation: proposalGenerationSchema.nullable(),
  savings: proposalSavingsSchema.nullable(),
  emi: proposalEmiSchema.nullable(),
  /** The pages this document prints, in order (`pagesPrinted`). */
  pages: z.array(proposalPageSchema),
  /** The line that names the document's basis (`F8-20`, `F8-22`); the words are the catalog's. */
  basisLine: basisLineSchema.nullable(),
  /**
   * The days the terms state (`M06-15`), decided by the server where the terms were filled; `null`
   * for a company's own words, which state their own validity. Frozen in a version at Generate.
   */
  validityDays: z.number().int().positive().nullable(),
  /** The customer's language, else the company's default (`T-M06-017`). */
  language: uiLanguageResponseSchema,
  /** The cover's "Prepared by"; `userId` is absent on the customer's side. */
  preparedBy: z.object({
    userId: uuidSchema.nullable(),
    name: z.string(),
    phoneE164: phoneE164Schema.nullable(),
  }),
};

/** Named, so each route that carries the document references it rather than spelling its type. */
export interface ProposalDocumentSchema extends z.ZodObject<typeof documentShape> {}
export const proposalDocumentSchema: ProposalDocumentSchema = z.object(documentShape);
export type ProposalDocument = z.infer<typeof proposalDocumentSchema>;
