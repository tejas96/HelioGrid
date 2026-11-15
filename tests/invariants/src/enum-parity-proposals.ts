import {
  deviceClassSchema,
  energyDatabaseSchema,
  linkEventTypeSchema,
  linkPhaseSchema,
  linkScopeSchema,
  linkSectionSchema,
  linkStatusSchema,
  proposalAnswerSchema,
  proposalStatusSchema,
  savedPartKindSchema,
  shareChannelSchema,
  supplyPhaseSchema,
  versionTriggerSchema,
} from '@heliogrid/contracts';

/**
 * The proposals' and the customer link's pg enums (migrations 0065 and 0066) → the contract schema
 * each must match, exactly.
 */
export const PROPOSAL_ENUMS: Record<string, { options: readonly string[]; contract: string }> = {
  proposal_status: { options: proposalStatusSchema.options, contract: 'proposalStatusSchema' },
  proposal_answer: { options: proposalAnswerSchema.options, contract: 'proposalAnswerSchema' },
  version_trigger: { options: versionTriggerSchema.options, contract: 'versionTriggerSchema' },
  share_channel: { options: shareChannelSchema.options, contract: 'shareChannelSchema' },
  saved_part_kind: { options: savedPartKindSchema.options, contract: 'savedPartKindSchema' },
  supply_phase: { options: supplyPhaseSchema.options, contract: 'supplyPhaseSchema' },
  energy_database: { options: energyDatabaseSchema.options, contract: 'energyDatabaseSchema' },
  link_status: { options: linkStatusSchema.options, contract: 'linkStatusSchema' },
  link_scope: { options: linkScopeSchema.options, contract: 'linkScopeSchema' },
  link_phase: { options: linkPhaseSchema.options, contract: 'linkPhaseSchema' },
  link_event_type: { options: linkEventTypeSchema.options, contract: 'linkEventTypeSchema' },
  device_class: { options: deviceClassSchema.options, contract: 'deviceClassSchema' },
  link_section: { options: linkSectionSchema.options, contract: 'linkSectionSchema' },
};
