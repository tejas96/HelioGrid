'use client';
import type { FormatPack, StepState } from '@heliogrid/domain';
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
   * Leaves the step for good — *Skip for now*, *Continue setup* at the cap, and *Open Team*:
   * Team is where an invite is offered from then on (M01 "exactly one later prompt-point").
   * Settles once the step is recorded, or put off when it could not be; a press while a send is out
   * does nothing, and one while the step is being recorded waits for that record.
   */
  skip(): Promise<void>;
}

/**
 * `SCR-M01-07`'s way on (`M01-12`): a sent invite records the step completed, a skip records it
 * skipped, and the progress each answers replaces the one `useLanding` holds, which is what moves
 * the person on. One answer is recorded, never two: a later write replaces an earlier one, so a
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
  const record = (state: StepState): Promise<void> => {
    const answering = (async () => {
      setLeaving(true);
      try {
        const progress = await repositories.onboarding.recordStep('invite_team', state);
        queryClient.setQueryData(queryKeys.setup.progress(tenantId), progress);
      } catch {
        putOffSetup('invite_team');
      } finally {
        out.current = null;
        setLeaving(false);
      }
    })();
    out.current = answering;
    return answering;
  };
  const invite = useInvite(pack, () => record('completed'));
  return {
    ...invite,
    leaving,
    skip: async () => {
      if (out.current !== null) return out.current;
      if (!invite.sending) await record('skipped');
    },
  };
}
