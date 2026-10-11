import type { OnboardingProgress, OnboardingStep, StepState } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { normalizeClientError, toApiError } from '../errors/errors';

/** Where a company's setup stands, and a step's answer (`M01-10`). The api answers only a person who manages the company's settings. */
export interface OnboardingRepository {
  progress(signal?: AbortSignal): Promise<OnboardingProgress>;
  /** Answering a step again replaces its answer; the reply is the progress after it. */
  recordStep(step: OnboardingStep, state: StepState): Promise<OnboardingProgress>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createOnboardingRepository(api: ApiClient): OnboardingRepository {
  return {
    async progress(signal) {
      try {
        const res = await api.onboarding.progress({ fetchOptions: { signal } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
    async recordStep(step, state) {
      try {
        const res = await api.onboarding.recordStep({ params: { step }, body: { state } });
        if (res.status !== 200) throw toApiError(res);
        return res.body;
      } catch (error) {
        throw normalizeClientError(error);
      }
    },
  };
}
