'use client';
import {
  inviteAgainOf,
  noteLeavesRow,
  ownerLostBetween,
  type TeamAct,
  type TeamActAnswer,
  type TeamActNote,
  type TeamConfirmState,
  type TeamRow,
  teamActNote,
  teamActOutcome,
  teamRowAct,
} from '@heliogrid/domain';
import { useCallback, useState } from 'react';
import { answerOf } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { useSession } from './use-session';
import type { Team } from './use-team';

type Asking = Extract<TeamConfirmState, { kind: 'asking' }>;

export interface TeamActs {
  readonly confirm: TeamConfirmState;
  /** The confirm's write is out. */
  readonly busy: boolean;
  /** The row whose act opened the last confirm — where focus goes back when it shuts. */
  readonly opener: string | null;
  /** This row's *Invite again* is out, so its button shows it is working. */
  sending(rowId: string): boolean;
  /** A row's act: *Deactivate* and *Revoke invite* ask first; *Invite again* sends at once. */
  start(row: TeamRow): void;
  /** The confirm's go button. */
  go(): void;
  /** Cancel, or Close on the refused form. */
  shut(): void;
}

/**
 * The Team row acts (`M01-19`): one confirm at a time, each write sent once per tap, and what each
 * answer means read from domain's `teamActOutcome`. The server decides every write; a stale list
 * meets a refresh, the refused form, or a re-read of the person's own presets.
 */
export function useTeamActs(team: Team, onNote: (note: TeamActNote) => void): TeamActs {
  const { signOut, rereadUser } = useSession();
  const repositories = useRepositories();
  const [confirm, setConfirm] = useState<TeamConfirmState>({ kind: 'shut' });
  const [opener, setOpener] = useState<string | null>(null);

  /* Stable: the overlay re-runs its focus effect whenever its close handler changes. */
  const shut = useCallback(() => setConfirm({ kind: 'shut' }), []);

  const write = async (act: TeamAct, row: TeamRow): Promise<TeamActAnswer> => {
    try {
      if (act === 'deactivate') await repositories.tenant.deactivate(row.id);
      else if (act === 'revoke') await repositories.invitation.revoke(row.id);
      else {
        const body = inviteAgainOf(row);
        if (body !== null) await repositories.invitation.create(body);
      }
      return { status: 200, code: '' };
    } catch (error) {
      return answerOf(error);
    }
  };

  const settle = async (act: TeamAct, row: TeamRow, answer: TeamActAnswer) => {
    const outcome = teamActOutcome(act, answer);
    if (outcome === 'done' && act === 'deactivate' && row.isViewer) {
      /* The server ended this session with the deactivation: there is nothing left to read. */
      await signOut();
      return;
    }
    if (outcome === 'refused') {
      /* With no fresh list the form names no one: it cannot say who left. */
      const lostOwner = ownerLostBetween(team.roster, (await team.reread()) ?? team.roster);
      /* Only over the confirm still asking: one the person cancelled meanwhile stays shut. */
      setConfirm((now) => (now.kind === 'asking' ? { kind: 'refused', row, lostOwner } : now));
      return;
    }
    if (outcome === 'forbidden') {
      setConfirm({ kind: 'shut' });
      await rereadUser();
      return;
    }
    const note = teamActNote(act, outcome, row.name, answer?.code ?? '');
    if (noteLeavesRow(note)) {
      setConfirm({ kind: 'shut' });
      await team.reread();
    }
    onNote(note);
  };

  const confirmed = useAction(async ({ act, row }: Asking) =>
    settle(act, row, await write(act, row)),
  );
  const invitedAgain = useAction(
    async (row: TeamRow) => settle('invite-again', row, await write('invite-again', row)),
    { key: (row) => row.id },
  );

  return {
    confirm,
    busy: confirm.kind === 'asking' && confirmed.pending,
    opener,
    sending: invitedAgain.pendingFor,
    start: (row) => {
      const offered = teamRowAct(row, team.roster);
      if (offered === null || offered.off) return;
      if (offered.act !== 'invite-again') {
        setOpener(row.id);
        setConfirm({ kind: 'asking', act: offered.act, row });
        return;
      }
      /* One *Invite again* at a time, as the list has always sent it. */
      if (!invitedAgain.isOut()) void invitedAgain.run(row);
    },
    go: () => {
      if (confirm.kind === 'asking') void confirmed.run(confirm);
    },
    shut,
  };
}
