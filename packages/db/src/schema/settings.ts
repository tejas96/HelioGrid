import type {
  BankDetails,
  Letterhead,
  PackLabel,
  PerLanguage,
  PromptPointStates,
  ProposalCover,
  ProposalSection,
  RichTextValue,
  StepStates,
  TimelinePhase,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { tenant } from './tenant';

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

const id = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7());

const tenantId = () =>
  uuid('tenant_id')
    .notNull()
    .references(() => tenant.id);

/**
 * Tenant settings (`T-M01-026`): every setting's one home, one row a consumer can index, no
 * settings JSONB. A tenant that never writes any of these still works — the effective read fills
 * the platform default in domain (`M01-28`) — so absence is a state, never an error. Every table
 * is tenant-scoped, all four always; a one-per-tenant setting carries a unique key on `tenant_id`
 * so a save is an upsert and two rows can never disagree.
 */

/**
 * The company's identity facts beyond the signup ones (`M01-24`, `M01-31`): the address and the
 * bank details. Company name, city and the two `M01-23` declarations stay on `tenant`; the logo's
 * column arrives with the first `file` slice (Law 9). One row per tenant, empty from creation.
 */
export const businessProfile = pgTable(
  'business_profile',
  {
    id: id(),
    tenantId: tenantId(),
    address: text('address'),
    /** `M06-17`'s four bank facts under market-neutral names; financial (sensitive-data register). */
    bankDetails: jsonb('bank_details').$type<BankDetails>(),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [uniqueIndex('business_profile_tenant_key').on(table.tenantId)],
);

/**
 * One tax registration of a type the tenant's market declares (`M01-24`, `M01-25`). The type is
 * `text` validated against `pack.tax`, never a closed enum (`F1-13`); the value is a regulated
 * identifier (sensitive-data register). Empty until the first proposal forces the prompt.
 */
export const taxRegistration = pgTable(
  'tax_registration',
  {
    id: id(),
    tenantId: tenantId(),
    registrationType: text('registration_type').notNull(),
    value: text('value').notNull(),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('tax_registration_tenant_type_key').on(table.tenantId, table.registrationType),
  ],
);

/**
 * Where setup stands (`M01-10`, `M01-29`): the step to resume at, each step's answer, and each
 * prompt-point's one life. One row per tenant from creation; `resume_step` is null once the
 * corridor is closed. The vocabularies and the transitions are domain's.
 */
export const onboardingProgress = pgTable(
  'onboarding_progress',
  {
    id: id(),
    tenantId: tenantId(),
    resumeStep: text('resume_step'),
    stepStates: jsonb('step_states').$type<StepStates>().notNull(),
    promptPointStates: jsonb('prompt_point_states').$type<PromptPointStates>().notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [uniqueIndex('onboarding_progress_tenant_key').on(table.tenantId)],
);

/**
 * Customer-document branding only (`M01-50`, `F7-07`): the brand colour and the letterhead's
 * text. The compliant shades are derived on every read and never stored; the logo and letterhead
 * imagery arrive with the first `file` slice. One row per tenant, absent until first saved.
 */
export const brandingSettings = pgTable(
  'branding_settings',
  {
    id: id(),
    tenantId: tenantId(),
    brandColour: text('brand_colour'),
    letterhead: jsonb('letterhead').$type<Letterhead>(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [uniqueIndex('branding_settings_tenant_key').on(table.tenantId)],
);

/**
 * The document defaults (`M01-51`, `M01-53`): the cover's achievements block, the section set and
 * the one default T&C body per language. Bank details are read from the profile. One row per
 * tenant, absent until first saved; sent documents never change when it does (`F8-15`).
 */
export const proposalTemplateSettings = pgTable(
  'proposal_template_settings',
  {
    id: id(),
    tenantId: tenantId(),
    cover: jsonb('cover').$type<ProposalCover>(),
    sectionsIncluded: text('sections_included').array().$type<ProposalSection[]>().notNull(),
    defaultTerms: jsonb('default_terms').$type<PerLanguage<RichTextValue>>().notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [uniqueIndex('proposal_template_settings_tenant_key').on(table.tenantId)],
);

/** The project-timeline template (`M01-52`): ordered phases, name and description per language. One per tenant. */
export const timelineTemplate = pgTable(
  'timeline_template',
  {
    id: id(),
    tenantId: tenantId(),
    phases: jsonb('phases').$type<TimelinePhase[]>().notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [uniqueIndex('timeline_template_tenant_key').on(table.tenantId)],
);

/**
 * A named payment-term template (`M01-54`): two seeded at creation, exactly one default — a
 * partial unique key holds that — archived never deleted, and generated documents carry their own
 * snapshot (`F8-15`). `changed_at` is null while the seeded split is untouched, which is what lets
 * the effective read call it the platform's until the tenant makes it their own.
 */
export const trancheTemplate = pgTable(
  'tranche_template',
  {
    id: id(),
    tenantId: tenantId(),
    name: jsonb('name').$type<PackLabel>().notNull(),
    isDefault: boolean('is_default').notNull(),
    archived: boolean('archived').notNull(),
    createdAt: instant('created_at').notNull(),
    changedAt: instant('changed_at'),
    archivedAt: instant('archived_at'),
  },
  (table) => [
    /** The list and the builder's default read. */
    index('tranche_template_tenant_archived_default_idx').on(
      table.tenantId,
      table.archived,
      table.isDefault,
    ),
    /** Exactly one default per tenant, held by the database and not by a promise. */
    uniqueIndex('tranche_template_tenant_default_key')
      .on(table.tenantId)
      .where(sql`${table.isDefault}`),
  ],
);

/**
 * One row of a payment-term template: a label per language, a share in whole basis points
 * (10 000 is the whole — domain's `allocationVerdict` is the one sum rule), and the chain stage
 * it falls due on — `text` validated against `PROJECT_STAGES` until M08 mirrors the pgEnum.
 */
export const trancheTemplateLine = pgTable(
  'tranche_template_line',
  {
    id: id(),
    tenantId: tenantId(),
    trancheTemplateId: uuid('tranche_template_id')
      .notNull()
      .references(() => trancheTemplate.id),
    position: integer('position').notNull(),
    label: jsonb('label').$type<PackLabel>().notNull(),
    shareBasisPoints: integer('share_basis_points').notNull(),
    dueOnStage: text('due_on_stage').notNull(),
  },
  (table) => [
    uniqueIndex('tranche_template_line_tenant_template_position_key').on(
      table.tenantId,
      table.trancheTemplateId,
      table.position,
    ),
    /** Every line of one template, in one read. */
    index('tranche_template_line_template_idx').on(table.trancheTemplateId),
  ],
);

/**
 * A tenant-added holiday (`M01-59`): narrows the calling calendar on top of the pack's floor and
 * never widens past it (`F1-17`). A DAY, no zone — its readers compare on the tenant's clock.
 */
export const tenantHoliday = pgTable(
  'tenant_holiday',
  {
    id: id(),
    tenantId: tenantId(),
    date: date('date', { mode: 'string' }).notNull(),
    label: text('label').notNull(),
    createdAt: instant('created_at').notNull(),
  },
  (table) => [uniqueIndex('tenant_holiday_tenant_date_key').on(table.tenantId, table.date)],
);
