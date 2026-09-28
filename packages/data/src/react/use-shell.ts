'use client';
import type { MyMembership } from '@heliogrid/contracts';
import {
  type CentreVerb,
  type ComposedHome,
  centreVerbFor,
  composedHome,
  FIRST_RUN_COACH_MARKS,
  homesOf,
  type RolePreset,
  type StandingDestinationSet,
  standingDestinationsFor,
} from '@heliogrid/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { useSession } from './use-session';

/** Where the shell's two reads stand: the frame renders its loading, error or normal state from this. */
export type ShellLoad = 'loading' | 'failed' | 'ready';

/**
 * The app shell's facts, as both platforms render them (Law 11): which company, the home in force
 * and the presets composed into it, the switcher's list, the centre verb and the four slots, and
 * the first-run coach marks passed. Each platform renders this; neither computes any of it.
 */
export interface Shell {
  readonly load: ShellLoad;
  readonly companyName: string | null;
  /** Null only for a person who holds no preset — no home to land on. */
  readonly home: ComposedHome | null;
  /** The switcher's list, in ladder order; one entry means no switcher (`M13-10`). */
  readonly homes: readonly RolePreset[];
  readonly centreVerb: CentreVerb | null;
  readonly destinations: StandingDestinationSet | null;
  /** How many of the first-run marks are passed; the marks after it are the ones still to show. */
  readonly coachMarksPassed: number | null;
  chooseHome(preset: RolePreset): void;
  /** The person moved past mark `count` (1-based). A count at or below the stored one sends nothing. */
  passCoachMark(count: number): void;
  /** The run was dismissed or finished: every mark is passed, for good (`M01-16`). */
  dismissCoachMarks(): void;
  retry(): void;
}

/**
 * Mounted only under a session that acts for a company: `landingFor` sends a session with none to the
 * company step (`M01-10`) before any shell mounts. Without a company nothing is read, and
 * `load` stays `loading`.
 */
export function useShell(): Shell {
  const { user, chosenHome, chooseHome } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const roles = user?.tenant?.roles;
  const membershipKey = queryKeys.shell.membership(tenantId);

  const company = useQuery({
    queryKey: queryKeys.shell.tenant(tenantId),
    queryFn: ({ signal }) => repositories.tenant.me(signal),
    enabled: tenantId !== '',
  });
  const membership = useQuery({
    queryKey: membershipKey,
    queryFn: ({ signal }) => repositories.tenant.myMembership(signal),
    enabled: tenantId !== '',
  });

  // The count moves at once and the server catches up. A refusal means another device is ahead,
  // so the server's count is read again; a lost network leaves the raised count until the next
  // read, which may show a mark again — a tap, never lost work.
  const pass = useMutation({
    mutationFn: (count: number) =>
      repositories.tenant.updateMyMembership({ coachMarksDismissed: count }),
    onMutate: async (count) => {
      await queryClient.cancelQueries({ queryKey: membershipKey });
      queryClient.setQueryData<MyMembership>(membershipKey, (held) => ({
        coachMarksDismissed: Math.max(held?.coachMarksDismissed ?? 0, count),
      }));
    },
    // Replies can land out of order: an older, lower one never moves the count back down.
    onSuccess: (stored) =>
      queryClient.setQueryData<MyMembership>(membershipKey, (held) => ({
        coachMarksDismissed: Math.max(held?.coachMarksDismissed ?? 0, stored.coachMarksDismissed),
      })),
    onError: (error) => {
      if (error instanceof ApiError)
        void queryClient.invalidateQueries({ queryKey: membershipKey });
    },
  });

  const passed = membership.data?.coachMarksDismissed ?? null;
  const { mutate } = pass;
  const passCoachMark = useCallback(
    (count: number) => {
      if (passed !== null && count > passed) mutate(Math.min(count, FIRST_RUN_COACH_MARKS));
    },
    [passed, mutate],
  );
  const dismissCoachMarks = useCallback(
    () => passCoachMark(FIRST_RUN_COACH_MARKS),
    [passCoachMark],
  );
  const { refetch: refetchCompany } = company;
  const { refetch: refetchMembership } = membership;
  const retry = useCallback(() => {
    void refetchCompany();
    void refetchMembership();
  }, [refetchCompany, refetchMembership]);

  return useMemo(() => {
    const home = composedHome(roles ?? [], chosenHome);
    return {
      load: shellLoad(company.status, membership.status),
      companyName: company.data?.companyName ?? null,
      home,
      homes: homesOf(roles ?? []),
      centreVerb: home === null ? null : centreVerbFor(home.home),
      destinations: home === null ? null : standingDestinationsFor(home.home),
      coachMarksPassed: passed,
      chooseHome,
      passCoachMark,
      dismissCoachMarks,
      retry,
    };
  }, [
    roles,
    chosenHome,
    company.status,
    company.data,
    membership.status,
    passed,
    chooseHome,
    passCoachMark,
    dismissCoachMarks,
    retry,
  ]);
}

type ReadStatus = 'pending' | 'error' | 'success';

function shellLoad(company: ReadStatus, membership: ReadStatus): ShellLoad {
  if (company === 'error' || membership === 'error') return 'failed';
  if (company === 'success' && membership === 'success') return 'ready';
  return 'loading';
}
