'use client';
import {
  type TenantSegment,
  WHAT_YOU_SELL_STEP_AT_OPEN,
  type WhatYouSellAnswers,
  type WhatYouSellQuestion,
  whatYouSellAnswers,
  whatYouSellRefused,
  whatYouSellStep,
  whatYouSellUnanswered,
} from '@heliogrid/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useReducer } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useSession } from './use-session';

/** The what-you-sell step, as both screens consume it (Law 11). */
export interface SetupWhatYouSellStep {
  readonly answers: WhatYouSellAnswers;
  /** The company's stored answers are still being read: the questions are live, the way on waits. */
  readonly checking: boolean;
  /** The questions `Continue` was refused at and that are still owed. */
  readonly refused: readonly WhatYouSellQuestion[];
  /** How many times `Continue` was refused; it rises in the render that names the questions. */
  readonly refusals: number;
  readonly saving: boolean;
  /** The last save did not land: nothing the person answered is lost. */
  readonly failed: boolean;
  chooseSegment(segment: TenantSegment): void;
  declareSize(kwp: number): void;
  /** Refuses at the questions still owed; with both answered, saves them and records the step. */
  submit(): void;
  /** Moves on without the answers; the next sign-in asks for the step again. */
  putOff(): void;
}

/**
 * `SCR-M01-04`'s way on. The profile is read before it is written because the write replaces it
 * whole: the name, the city, the address and the bank details go back exactly as they came. A read
 * that got no answer is made again by the save, so a person is never held on a failed check. The
 * step's answer replaces the progress `useLanding` holds, which is what moves the person on.
 */
export function useSetupWhatYouSell(): SetupWhatYouSellStep {
  const { user, putOffSetup } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const [step, dispatch] = useReducer(whatYouSellStep, WHAT_YOU_SELL_STEP_AT_OPEN);
  // Neither the read nor the save waits for a connection: held back offline, the save would spin
  // with no end and no second way on, where a failure draws both.
  const profileRead = {
    queryKey: queryKeys.settings.businessProfile(tenantId),
    queryFn: ({ signal }: { signal: AbortSignal }) => repositories.settings.businessProfile(signal),
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: 'always',
  } as const;
  const profile = useQuery(profileRead);
  const stored = profile.data ?? null;

  const save = useMutation({
    networkMode: 'always',
    mutationFn: async (declared: WhatYouSellAnswers) => {
      const read = await queryClient.fetchQuery(profileRead);
      const saved = await repositories.settings.saveBusinessProfile({ ...read, ...declared });
      queryClient.setQueryData(profileRead.queryKey, saved);
      return repositories.onboarding.recordStep('what_you_sell', 'completed');
    },
    onSuccess: (progress) => {
      queryClient.setQueryData(queryKeys.setup.progress(tenantId), progress);
    },
  });
  const { mutate, isPending, isError } = save;
  // A save reads again when the first read got no answer; that read is the save's, not a check.
  const checking = profile.isPending && !isPending;

  return useMemo(() => {
    const answers = whatYouSellAnswers(step, stored);
    return {
      answers,
      checking,
      refused: whatYouSellRefused(step, stored),
      refusals: step.refusals,
      saving: isPending,
      failed: isError,
      chooseSegment: (segment) => dispatch({ type: 'segment-chosen', segment }),
      declareSize: (kwp) => dispatch({ type: 'size-declared', kwp }),
      submit: () => {
        if (isPending) return;
        dispatch({ type: 'continue-pressed', stored });
        if (whatYouSellUnanswered(answers).length === 0) mutate(answers);
      },
      putOff: putOffSetup,
    };
  }, [step, stored, checking, isPending, isError, mutate, putOffSetup]);
}
