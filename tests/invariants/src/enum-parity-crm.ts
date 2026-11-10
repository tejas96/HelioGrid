import {
  activityActorSchema,
  activityKindSchema,
  buyingTimelineSchema,
  contactRoleSeedSchema,
  dealSegmentSchema,
  decisionMakerSchema,
  disqualifyReasonSchema,
  importDuplicateChoiceSchema,
  leadLifecycleStateSchema,
  leadSourceSchema,
  leadStageSchema,
  lostReasonSchema,
  roofOwnershipSchema,
  roofTypeSchema,
  shadingSchema,
  taskKindSchema,
  taskProvenanceSchema,
  taskStatusSchema,
  transitionCauseSchema,
} from '@heliogrid/contracts';
import { LEAD_MOVE_KINDS } from '@heliogrid/domain';

/** The CRM's pg enums (migrations 0051–0056) → the contract schema each must match, exactly. */
export const CRM_ENUMS: Record<string, { options: readonly string[]; contract: string }> = {
  lead_stage: { options: leadStageSchema.options, contract: 'leadStageSchema' },
  lead_lifecycle_state: {
    options: leadLifecycleStateSchema.options,
    contract: 'leadLifecycleStateSchema',
  },
  lead_source: { options: leadSourceSchema.options, contract: 'leadSourceSchema' },
  deal_segment: { options: dealSegmentSchema.options, contract: 'dealSegmentSchema' },
  roof_ownership: { options: roofOwnershipSchema.options, contract: 'roofOwnershipSchema' },
  roof_type: { options: roofTypeSchema.options, contract: 'roofTypeSchema' },
  shading: { options: shadingSchema.options, contract: 'shadingSchema' },
  buying_timeline: { options: buyingTimelineSchema.options, contract: 'buyingTimelineSchema' },
  decision_maker: { options: decisionMakerSchema.options, contract: 'decisionMakerSchema' },
  disqualify_reason: {
    options: disqualifyReasonSchema.options,
    contract: 'disqualifyReasonSchema',
  },
  lost_reason: { options: lostReasonSchema.options, contract: 'lostReasonSchema' },
  contact_role_seed: { options: contactRoleSeedSchema.options, contract: 'contactRoleSeedSchema' },
  activity_kind: { options: activityKindSchema.options, contract: 'activityKindSchema' },
  activity_actor: { options: activityActorSchema.options, contract: 'activityActorSchema' },
  task_kind: { options: taskKindSchema.options, contract: 'taskKindSchema' },
  task_status: { options: taskStatusSchema.options, contract: 'taskStatusSchema' },
  task_provenance: { options: taskProvenanceSchema.options, contract: 'taskProvenanceSchema' },
  transition_cause: { options: transitionCauseSchema.options, contract: 'transitionCauseSchema' },
  lead_move_kind: {
    // The funnel history's own split; no response carries it, so its one owner is domain's tuple.
    options: LEAD_MOVE_KINDS,
    contract: 'LEAD_MOVE_KINDS (no wire form)',
  },
  import_duplicate_choice: {
    options: importDuplicateChoiceSchema.options,
    contract: 'importDuplicateChoiceSchema',
  },
};
