import {
  blockerClearSchema,
  blockerPartySchema,
  blockerReasonSchema,
  cancelReasonSchema,
  documentStateSchema,
  projectFileSlotSchema,
  projectMoveCauseSchema,
  projectStageSchema,
} from '@heliogrid/contracts';

/** The projects' pg enums (migration 0061) → the contract schema each must match, exactly. */
export const PROJECT_ENUMS: Record<string, { options: readonly string[]; contract: string }> = {
  project_stage: { options: projectStageSchema.options, contract: 'projectStageSchema' },
  project_move_cause: {
    options: projectMoveCauseSchema.options,
    contract: 'projectMoveCauseSchema',
  },
  blocker_party: { options: blockerPartySchema.options, contract: 'blockerPartySchema' },
  blocker_reason: { options: blockerReasonSchema.options, contract: 'blockerReasonSchema' },
  blocker_clear: { options: blockerClearSchema.options, contract: 'blockerClearSchema' },
  project_cancel_reason: { options: cancelReasonSchema.options, contract: 'cancelReasonSchema' },
  project_document_state: {
    options: documentStateSchema.options,
    contract: 'documentStateSchema',
  },
  project_file_slot: { options: projectFileSlotSchema.options, contract: 'projectFileSlotSchema' },
};
