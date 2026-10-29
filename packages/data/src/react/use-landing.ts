'use client';
import type { OnboardingProgress } from '@heliogrid/contracts';
import {
  landingFor,
  managesSetup,
  mapRead,
  type Read,
  type SessionLanding,
  type SessionPhase,
  setupStepOwed,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { pausedWithNoValue, readOf } from './read';
import { useSession } from './use-session';

/**
 * Where a visitor belongs, answered once for both apps (Law 11): the web's gate and the phone's
 * guards read this and map it to their own routes. The decision is domain's (`landingFor`,
 * `setupStepOwed`); this adds the one fact they need from the server — where the company's setup
 * stands. It is read only for a person the api answers, and from the moment the session is known,
 * so the read runs while the sign-in beat plays. `phase` is handed in because each navigator
 * computes it once.
 *
 * The answer never goes stale by itself: only a step's answer changes it, and that answer replaces
 * what is held (`useSetupLanguage`, `useSetupWhatYouSell`, `useCompanyProfile`). A read made again on a focus could land
 * after it and put the step just answered back.
 */
export function useLanding(phase: SessionPhase): SessionLanding {
  const { status, user, ended, setupPutOff } = useSession();
  const repositories = useRepositories();
  const progress = useQuery({
    queryKey: queryKeys.setup.progress(user?.tenant?.id ?? ''),
    queryFn: ({ signal }) => repositories.onboarding.progress(signal),
    enabled: status === 'authenticated' && ended === null && managesSetup(user),
    staleTime: Number.POSITIVE_INFINITY,
  });
  // A read held back while the device is offline is no answer either: left as loading it would
  // keep the person on a blank wait, where the home has the no-connection screen and its retry.
  // What is held wins: a later read that fails never sends a person back to a step answered.
  const held: Read<OnboardingProgress> = pausedWithNoValue(progress)
    ? { kind: 'failed', failure: 'no_connection', retry: () => void progress.refetch() }
    : readOf(progress);
  const owed = setupStepOwed(
    user,
    setupPutOff,
    mapRead(held, (read) => read.steps),
  );
  return landingFor(phase, user, ended, owed);
}
