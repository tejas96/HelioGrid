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
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { useSession } from './use-session';
import type { Team } from './use-team';

export interface TeamActs {
  readonly confirm: TeamConfirmState;
  /** The confirm's write is out. */
  readonly busy: boolean;
  /** The row whose act opened the last confirm — where focus goes back when it shuts. */
  readonly opener: string | null;
  /** The row whose *Invite again* is out, so its button shows it is working. */
  readonly sending: string | null;
  /** A row's act: *Deactivate* and *Revoke invite* ask first; *Invite again* sends at once. */
  start(row: TeamRow): void;
  /** The confirm's go button. */
  go(): void;
  /** Cancel, or Close on the refused form. */
  shut(): void;
}

function answerOf(error: unknown): TeamActAnswer {
  return error instanceof ApiError ? { status: error.status, code: error.code } : null;
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
  const [sending, setSending] = useState<string | null>(null);
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
      const lostOwner = ownerLostBetween(team.roster, await team.reread());
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
    } else {
      setConfirm((now) => (now.kind === 'asking' ? { ...now, busy: false } : now));
    }
    onNote(note);
  };

  return {
    confirm,
    busy: confirm.kind === 'asking' && confirm.busy,
    opener,
    sending,
    start: (row) => {
      const offered = teamRowAct(row, team.roster);
      if (offered === null || offered.off) return;
      if (offered.act !== 'invite-again') {
        setOpener(row.id);
        setConfirm({ kind: 'asking', act: offered.act, row, busy: false });
        return;
      }
      if (sending !== null) return;
      setSending(row.id);
      void write('invite-again', row)
        .then((answer) => settle('invite-again', row, answer))
        .finally(() => setSending(null));
    },
    go: () => {
      if (confirm.kind !== 'asking' || confirm.busy) return;
      const { act, row } = confirm;
      setConfirm({ ...confirm, busy: true });
      void write(act, row).then((answer) => settle(act, row, answer));
    },
    shut,
  };
}
