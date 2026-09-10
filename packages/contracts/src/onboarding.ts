import {
  ONBOARDING_STEPS,
  PROMPT_POINT_FACTS,
  PROMPT_POINT_STATES,
  STEP_STATES,
} from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseError, errorEnvelope } from './error';

const c = initContract();

/**
 * The setup corridor (`M01-10`, `M01-22`, `M01-29`): where a returning owner resumes, and the
 * one prompt-point each skipped fact is owed. The vocabularies are domain's
 * (`tenancy/onboarding-steps.ts`), derived here.
 */

export const onboardingStepSchema = z.enum(ONBOARDING_STEPS);
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export const stepStateSchema = z.enum(STEP_STATES);
export type StepState = z.infer<typeof stepStateSchema>;
export const promptPointFactSchema = z.enum(PROMPT_POINT_FACTS);
export type PromptPointFact = z.infer<typeof promptPointFactSchema>;
export const promptPointStateSchema = z.enum(PROMPT_POINT_STATES);
export type PromptPointState = z.infer<typeof promptPointStateSchema>;

/** Where setup stands (`M01-10`): the step to resume at, each step's answer, each prompt-point's state. */
export const onboardingProgressSchema = z.object({
  resumeStep: onboardingStepSchema.nullable(),
  steps: z.record(onboardingStepSchema, stepStateSchema),
  promptPoints: z.record(promptPointFactSchema, promptPointStateSchema),
  /** The skipped facts still owed their one prompt-point (`M01-29`). */
  pendingPromptPoints: z.array(promptPointFactSchema),
});
export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;

const unauthenticated = errorEnvelope(baseError('UNAUTHENTICATED'));
const forbidden = errorEnvelope(baseError('FORBIDDEN'));
const conflict = errorEnvelope(baseError('CONFLICT'));
const guarded = { 401: unauthenticated, 403: forbidden } as const;

export const onboardingContract = c.router({
  progress: {
    method: 'GET',
    path: '/onboarding/progress',
    summary: 'Where setup stands: the step to resume at and every prompt-point’s state',
    responses: { 200: onboardingProgressSchema, ...guarded },
  },
  recordStep: {
    method: 'PUT',
    path: '/onboarding/progress/:step',
    pathParams: z.object({ step: onboardingStepSchema }),
    body: z.object({ state: stepStateSchema }),
    summary: 'A step answered — completed or skipped; answering again replaces the answer',
    responses: { 200: onboardingProgressSchema, ...guarded },
  },
  promptPoint: {
    method: 'PUT',
    path: '/onboarding/prompt-points/:fact',
    pathParams: z.object({ fact: promptPointFactSchema }),
    body: z.object({ state: promptPointStateSchema }),
    summary:
      'A prompt-point’s one life: fired once, then completed or declined — a second fire is refused',
    responses: {
      200: onboardingProgressSchema,
      ...guarded,
      /** Already fired, already answered, or answered before it fired. */
      409: conflict,
    },
  },
});
