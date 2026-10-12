'use client';
import type { UiLanguage } from '@heliogrid/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useSession } from './use-session';

/** The language step's one save, as both screens consume it (Law 11). */
export interface SetupLanguageStep {
  readonly saving: boolean;
  /** The last save did not land: the language or the step is not stored. */
  readonly failed: boolean;
  /** Saves the language the person reads, then records the step as answered. */
  record(language: UiLanguage): void;
  /** Opens the next step without the record; the next sign-in asks for this step again. */
  putOff(): void;
}

/**
 * `SCR-M01-03`'s way on. The language is sent again here although a tap already sent it: a tap's
 * save may fail with no sign (`F3-04`), and a step recorded over a language that was never stored
 * would open the next sign-in in the old one. The step's answer replaces the progress `useLanding`
 * holds, which is what moves the person on.
 */
export function useSetupLanguage(): SetupLanguageStep {
  const { user, setInterfaceLanguage, putOffSetup } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const save = useMutation({
    mutationFn: async (language: UiLanguage) =>
      (await setInterfaceLanguage(language))
        ? repositories.onboarding.recordStep('language', 'completed')
        : null,
    onSuccess: (progress) => {
      if (progress !== null) queryClient.setQueryData(queryKeys.setup.progress(tenantId), progress);
    },
  });
  const { mutate, isPending, isError, data } = save;
  return useMemo(
    () => ({
      saving: isPending,
      failed: isError || data === null,
      record: mutate,
      putOff: () => putOffSetup('language'),
    }),
    [isPending, isError, data, mutate, putOffSetup],
  );
}
