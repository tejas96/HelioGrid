import { LEAD_STAGES, type LeadStage } from '@heliogrid/domain';
import type { StageStepStanding } from './StageTrack.types';

export interface StageStep {
  readonly stage: LeadStage;
  readonly standing: StageStepStanding;
}

/** Every step of the funnel, in order, standing against the lead's stage. */
export function stageStepsOf(stage: LeadStage): readonly StageStep[] {
  const at = LEAD_STAGES.indexOf(stage);
  return LEAD_STAGES.map((step, index) => ({
    stage: step,
    standing: index < at ? 'done' : index === at ? 'now' : 'ahead',
  }));
}
