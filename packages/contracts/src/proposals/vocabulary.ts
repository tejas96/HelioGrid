import {
  AREA_GRAINS,
  BASIS_LINES,
  BATTERY_CHEMISTRIES,
  COMPONENT_CATEGORIES,
  COMPONENT_LINE_SOURCES,
  COVER_PICTURES,
  DISCOUNT_MODES,
  ENERGY_DATABASES,
  FORECAST_STAGES,
  INCENTIVE_RECEIVERS,
  INVERTER_TYPES,
  MAINTENANCE_KINDS,
  PANEL_TECHNOLOGIES,
  PROPOSAL_ACT_REFUSALS,
  PROPOSAL_ANSWERS,
  PROPOSAL_ENTRY_FILTERS,
  PROPOSAL_LIST_FILTERS,
  PROPOSAL_PAGES,
  PROPOSAL_STANDINGS,
  PROPOSAL_STATUSES,
  PROPOSAL_STEPS,
  PROPOSAL_TYPES,
  SAVED_PART_KINDS,
  SHARE_CHANNELS,
  STEP_STANDINGS,
  SUPPLY_PHASES,
  SYSTEM_TYPES,
  VERSION_FACTS,
  VERSION_TRIGGERS,
} from '@heliogrid/domain';
import { z } from 'zod';
import { extensibleEnum } from '../common';

/*
 * The proposal's closed sets on the wire (`M06`): each derived from domain's tuple, so the screen,
 * the store and the wire read one list. A set a RESPONSE carries and a later slice may grow — the
 * status, the tracked standing, a refusal — travels as `extensibleEnum`, and its reader keeps a
 * fallback.
 */

export const proposalStatusSchema = z.enum(PROPOSAL_STATUSES);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;
export const proposalStatusReadSchema = extensibleEnum(PROPOSAL_STATUSES);

/** What a screen shows of a proposal: its status read with what the customer's link saw (`M06-54`). */
export const proposalStandingSchema = z.enum(PROPOSAL_STANDINGS);
export const proposalStandingReadSchema = extensibleEnum(PROPOSAL_STANDINGS);

export const proposalListFilterSchema = z.enum(PROPOSAL_LIST_FILTERS);
export type ProposalListFilter = z.infer<typeof proposalListFilterSchema>;
/** The Proposals page's chips: `3d`, then the list's own (`T-M05-001b`). */
export const proposalEntryFilterSchema = z.enum(PROPOSAL_ENTRY_FILTERS);
export type ProposalEntryFilter = z.infer<typeof proposalEntryFilterSchema>;

export const proposalTypeSchema = z.enum(PROPOSAL_TYPES);
export const systemTypeSchema = z.enum(SYSTEM_TYPES);
export const supplyPhaseSchema = z.enum(SUPPLY_PHASES);
export const maintenanceKindSchema = z.enum(MAINTENANCE_KINDS);
export const discountModeSchema = z.enum(DISCOUNT_MODES);
export const componentCategorySchema = z.enum(COMPONENT_CATEGORIES);
export const componentLineSourceSchema = z.enum(COMPONENT_LINE_SOURCES);
export const savedPartKindSchema = z.enum(SAVED_PART_KINDS);
export type SavedPartKind = z.infer<typeof savedPartKindSchema>;
export const inverterTypeSchema = z.enum(INVERTER_TYPES);
export const panelTechnologySchema = z.enum(PANEL_TECHNOLOGIES);
export const batteryChemistrySchema = z.enum(BATTERY_CHEMISTRIES);
export const coverPictureKeySchema = z.enum(COVER_PICTURES);
export const proposalStepSchema = z.enum(PROPOSAL_STEPS);
export const stepStandingSchema = z.enum(STEP_STANDINGS);
export const proposalPageSchema = z.enum(PROPOSAL_PAGES);
export const versionTriggerSchema = z.enum(VERSION_TRIGGERS);
export const shareChannelSchema = z.enum(SHARE_CHANNELS);
export const proposalAnswerSchema = z.enum(PROPOSAL_ANSWERS);
export const proposalAnswerReadSchema = extensibleEnum(PROPOSAL_ANSWERS);
export const areaGrainSchema = z.enum(AREA_GRAINS);
export const energyDatabaseSchema = z.enum(ENERGY_DATABASES);
export const basisLineSchema = z.enum(BASIS_LINES);
export const incentiveReceiverSchema = z.enum(INCENTIVE_RECEIVERS);
export const forecastStageSchema = z.enum(FORECAST_STAGES);
export const proposalActRefusalSchema = extensibleEnum(PROPOSAL_ACT_REFUSALS);
export const versionFactSchema = extensibleEnum(VERSION_FACTS);
