'use client';
import type { FormatPack, OnboardingStep, StepState } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { type Invite, useInvite } from './use-invite';
import { useSession } from './use-session';

/** The invite step of setup, as both screens consume it (Law 11). */
export interface SetupInvite extends Invite {
  /** The step's answer is being recorded: no other way out may be taken meanwhile. */
  readonly leaving: boolean;
  /**
   * Leaves the step for good — *Skip for now* and *Continue setup* at the cap: Team is where an
   * invite is offered from then on (M01 "exactly one later prompt-point").
   * Settles once the step is recorded, or put off when it could not be; a press while a send is out
   * does nothing, and one while the step is being recorded waits for that record.
   */
  skip(): Promise<void>;
  /**
   * *Open Team*: leaves setup for good — the step, and *You're ready* after it, both skipped — so
   * Team opens inside the app (owner ruling D2 on `T-M01-006`). Both answers land before the progress
   * is replaced, so *You're ready* does not show on the way — unless a skip was already out, which
   * lands first; one that could not be recorded is put off for the session.
   */
  openTeam(): Promise<void>;
}

/**
 * `SCR-M01-07`'s way on (`M01-12`): a sent invite records the step completed, a skip records it
 * skipped, and the progress each answers replaces the one `useLanding` holds, which is what moves
 * the person on. One way out is recorded, never two: a later write replaces an earlier one, so a
 * skip pressed while a sent invite is being recorded would store the invite as skipped. When the
 * step could not be recorded it is put off for the session instead: the person still moves on, and
 * an invite that went out is never sent twice.
 */
export function useSetupInvite(pack: FormatPack): SetupInvite {
  const { user, putOffSetup } = useSession();
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = user?.tenant?.id ?? '';
  const [leaving, setLeaving] = useState(false);
  /* Set in the same tick as the send's answer hands over to the record, so no press slips between;
     a later way out waits on it, so a link opened after it finds the routes the answer brings. */
  const out = useRef<Promise<void> | null>(null);
  const record = (answers: readonly (readonly [OnboardingStep, StepState])[]): Promise<void> => {
    const answering = (async () => {
      setLeaving(true);
      try {
        let progress: Awaited<ReturnType<typeof repositories.onboarding.recordStep>> | undefined;
        for (const [step, state] of answers) {
          progress = await repositories.onboarding.recordStep(step, state);
        }
        queryClient.setQueryData(queryKeys.setup.progress(tenantId), progress);
      } catch {
        for (const [step] of answers) putOffSetup(step);
      } finally {
        out.current = null;
        setLeaving(false);
      }
    })();
    out.current = answering;
    return answering;
  };
  const invite = useInvite(pack, () => record([['invite_team', 'completed']]));
  const leave = async (answers: readonly (readonly [OnboardingStep, StepState])[]) => {
    if (out.current !== null) return out.current;
    if (!invite.sending) await record(answers);
  };
  return {
    ...invite,
    leaving,
    skip: () => leave([['invite_team', 'skipped']]),
    openTeam: async () => {
      // An answer already out settles the step; *Open Team* still closes what follows it.
      if (out.current !== null) {
        await out.current;
        await record([['ready', 'skipped']]);
        return;
      }
      await leave([
        ['invite_team', 'skipped'],
        ['ready', 'skipped'],
      ]);
    },
  };
}
