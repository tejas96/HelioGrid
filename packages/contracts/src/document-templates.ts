import { HEX_COLOUR, PROJECT_STAGE_CHAIN, PROPOSAL_SECTIONS } from '@heliogrid/domain';
import { z } from 'zod';
import { percentSchema, uuidSchema } from './common';
import {
  lineSchema,
  packLabelSchema,
  paragraphSchema,
  perLanguage,
  richTextValueSchema,
} from './document-content';

/**
 * The tenant's document defaults (`M01-50`–`M01-54`): branding, the proposal template, the
 * timeline template and the payment-term templates — what every proposal is made of before a
 * tenant says otherwise. Each mirrors a domain view-model (`commerce/effective-settings.ts`).
 */

/** `#RRGGBB` or `#RGB` — the same pattern the derivation accepts. */
export const hexColourSchema = z.string().regex(HEX_COLOUR, 'a colour is #RRGGBB');

/** The band's extra lines and the note along every page's foot — the design system's `DocumentLetterhead`. */
export const letterheadSchema = z.object({
  tagline: packLabelSchema.nullable(),
  lines: z.array(perLanguage(lineSchema)).max(6),
  footerNote: perLanguage(lineSchema).nullable(),
});
export type Letterhead = z.infer<typeof letterheadSchema>;

export const brandingWriteSchema = z.object({
  brandColour: hexColourSchema.nullable(),
  letterhead: letterheadSchema.nullable(),
});
export type BrandingWrite = z.infer<typeof brandingWriteSchema>;

/** The two answers `SCR-M01-18` draws: the colour that may be a word, and whether white may sit on the raw one. */
export const compliantShadesSchema = z.object({
  brand: hexColourSchema,
  ink: hexColourSchema,
  whiteOnBrand: z.boolean(),
});

/** Branding as read: what was set, and the shades derived from it on this read — never stored (`F7-07`). */
export const brandingSchema = brandingWriteSchema.extend({
  shades: compliantShadesSchema.nullable(),
});
export type Branding = z.infer<typeof brandingSchema>;

export const proposalSectionSchema = z.enum(PROPOSAL_SECTIONS);
export type ProposalSection = z.infer<typeof proposalSectionSchema>;

/** The cover's achievements block (`M06-08`); each count is the tenant's own declaration, `estimated · declared by you`. */
export const proposalCoverSchema = z.object({
  aboutCompany: perLanguage(paragraphSchema).nullable(),
  totalCapacityInstalledKw: z.number().nonnegative().nullable(),
  happyCustomers: z.number().int().nonnegative().nullable(),
  citiesServed: z.number().int().nonnegative().nullable(),
});

/** The document defaults (`M01-51`): the save keeps the terms in whatever the list says (`SCR-M01-19`). */
export const proposalTemplateSchema = z.object({
  cover: proposalCoverSchema.nullable(),
  sectionsIncluded: z.array(proposalSectionSchema),
  defaultTerms: perLanguage(richTextValueSchema),
});
export type ProposalTemplate = z.infer<typeof proposalTemplateSchema>;

export const timelinePhaseSchema = z.object({
  name: packLabelSchema,
  description: perLanguage(paragraphSchema),
});

/** The project-timeline template (`M01-52`): ordered phases, the order as sent. */
export const timelineTemplateSchema = z.object({
  phases: z.array(timelinePhaseSchema).min(1).max(20),
});
export type TimelineTemplate = z.infer<typeof timelineTemplateSchema>;

/** The stage a tranche falls due on (`M01-54`): `M08-08`'s chain, never the terminal. */
export const projectChainStageSchema = z.enum(PROJECT_STAGE_CHAIN);
export type ProjectChainStage = z.infer<typeof projectChainStageSchema>;

export const trancheLineSchema = z.object({
  label: packLabelSchema,
  /** Two-decimal percent on the wire; whole basis points in the store — one number, two spellings. */
  percent: percentSchema,
  dueOnStage: projectChainStageSchema,
});
export type TrancheLine = z.infer<typeof trancheLineSchema>;

/** What a save carries: the name and the lines; the sum rule is the server's verdict (`M01-54`). */
export const trancheTemplateWriteSchema = z.object({
  name: packLabelSchema,
  lines: z.array(trancheLineSchema).min(1).max(12),
});
export type TrancheTemplateWrite = z.infer<typeof trancheTemplateWriteSchema>;

export const trancheTemplateSchema = trancheTemplateWriteSchema.extend({
  id: uuidSchema,
  isDefault: z.boolean(),
  archived: z.boolean(),
  /** Edited since it was given: a seeded split reads platform until the tenant touches it. */
  changed: z.boolean(),
});
export type TrancheTemplate = z.infer<typeof trancheTemplateSchema>;
