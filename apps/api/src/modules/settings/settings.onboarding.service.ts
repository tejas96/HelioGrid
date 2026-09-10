import type { OnboardingProgress } from '@heliogrid/contracts';
import {
  absentFacts,
  type OnboardingStep,
  type PromptPointFact,
  type PromptPointState,
  pendingPromptPoints,
  promptPointTransition,
  recordStep,
  resumeStep,
  type StepState,
} from '@heliogrid/domain';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { type ProgressRow, SettingsOnboardingRepository } from './settings.onboarding.repository';
import { SettingsRepository } from './settings.repository';

const FRESH: ProgressRow = { resumeStep: resumeStep({}), stepStates: {}, promptPointStates: {} };

/**
 * The setup corridor (`M01-10`, `M01-29`): where a returning owner resumes, and the one life of
 * each prompt-point. The transitions are domain's; this reads the row, applies them, and writes
 * the row back with its resume step kept in step.
 */
@Injectable()
export class SettingsOnboardingService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsOnboardingRepository) private readonly scoped: SettingsOnboardingRepository,
    @Inject(SettingsRepository) private readonly settings: SettingsRepository,
  ) {}

  async progress(tenantId: string): Promise<OnboardingProgress> {
    return this.projection(tenantId, (await this.scoped.progress(tenantId)) ?? FRESH);
  }

  async recordStep(
    tenantId: string,
    step: OnboardingStep,
    state: StepState,
    now: number,
  ): Promise<OnboardingProgress> {
    const row = (await this.scoped.progress(tenantId)) ?? FRESH;
    const stepStates = recordStep(row.stepStates, step, state);
    const saved = await this.scoped.saveProgress(
      tenantId,
      { ...row, stepStates, resumeStep: resumeStep(stepStates) },
      now,
    );
    return this.projection(tenantId, saved);
  }

  async promptPoint(
    tenantId: string,
    fact: PromptPointFact,
    state: PromptPointState,
    now: number,
  ): Promise<OnboardingProgress> {
    const row = (await this.scoped.progress(tenantId)) ?? FRESH;
    const transition = promptPointTransition(row.promptPointStates, fact, state);
    if (transition.outcome !== 'done') {
      throw new ConflictException(REFUSALS[transition.outcome]);
    }
    const saved = await this.scoped.saveProgress(
      tenantId,
      { ...row, promptPointStates: transition.states },
      now,
    );
    return this.projection(tenantId, saved);
  }

  /** The row as the wire carries it, with the prompt-points still owed judged from the settings themselves. */
  private async projection(tenantId: string, row: ProgressRow): Promise<OnboardingProgress> {
    const read = await this.settings.everything(tenantId);
    if (read === null) {
      throw new Error(
        'the guard admitted an onboarding route for a company its session cannot see',
      );
    }
    return {
      resumeStep: row.resumeStep,
      steps: { ...row.stepStates },
      promptPoints: { ...row.promptPointStates },
      pendingPromptPoints: [
        ...pendingPromptPoints(row.promptPointStates, absentFacts(read.settings)),
      ],
    };
  }
}

const REFUSALS = {
  'already-fired': 'This prompt has already been shown once.',
  'already-answered': 'This prompt was already answered.',
  'not-fired': 'This prompt has not been shown yet.',
} as const;
