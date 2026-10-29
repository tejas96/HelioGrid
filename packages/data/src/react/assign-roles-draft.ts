'use client';
import { opensAssignRoles, type RolePreset, type TeamRow } from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useSession } from './use-session';
import type { Team } from './use-team';

/** What `stepAside` keeps while the screen is away: the person's membership and the ticks. */
interface AssignRolesDraft {
  readonly membershipId: string;
  readonly picked: readonly RolePreset[];
}

/** The editor as it stands now, and its two moves the draft needs. */
interface EditorNow {
  readonly open: boolean;
  /** A save is out: its answer lands on the open sheet, so the sheet does not step aside. */
  readonly saving: boolean;
  readonly person: TeamRow | null;
  readonly picked: readonly RolePreset[];
}
interface EditorMoves {
  close(): void;
  openOn(row: TeamRow, ticks: readonly RolePreset[]): void;
}

/**
 * Assign Roles' unsaved ticks kept while the screen leaves for the Roles reference (`SCR-M01-14`),
 * a page of its own: the web unmounts Team, the phone keeps it under a pushed page. The draft lives
 * in the query cache, which both outlive.
 */
export function useAssignRolesDraft(team: Team, now: EditorNow, moves: EditorMoves) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const draftKey = queryKeys.assignDraft(user?.tenant?.id ?? '');
  const [resuming, setResuming] = useState(false);
  /* Stable, so a screen may call it from an effect that runs once per showing. */
  const resume = useCallback(() => setResuming(true), []);

  /* A draft is judged against the list as read, never against a list still loading. */
  useEffect(() => {
    if (!resuming || team.read.kind !== 'ready') return;
    setResuming(false);
    const draft = queryClient.getQueryData<AssignRolesDraft>(draftKey);
    if (draft === undefined) return;
    queryClient.removeQueries({ queryKey: draftKey, exact: true });
    const row = team.roster.find((held) => held.id === draft.membershipId);
    if (row !== undefined && opensAssignRoles(row)) moves.openOn(row, draft.picked);
  });

  return {
    stepAside() {
      if (!now.open || now.saving || now.person === null) return;
      /* Nothing watches the draft while the screen is away, so nothing may collect it. */
      queryClient.setQueryDefaults(draftKey, { gcTime: Number.POSITIVE_INFINITY });
      queryClient.setQueryData<AssignRolesDraft>(draftKey, {
        membershipId: now.person.id,
        picked: now.picked,
      });
      moves.close();
    },
    resume,
  };
}

/**
 * Whether Assign Roles' ticks are being kept for Team — the Roles reference's way back returns to
 * the page under it only then; opened any other way, there may be no Team to go back to.
 */
export function useAssignRolesDraftHeld(): boolean {
  const { user } = useSession();
  const queryClient = useQueryClient();
  return queryClient.getQueryData(queryKeys.assignDraft(user?.tenant?.id ?? '')) !== undefined;
}
