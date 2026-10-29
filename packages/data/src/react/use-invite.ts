'use client';
import { type CreateInvitation, inviteFormSchema } from '@heliogrid/contracts';
import {
  type FormatPack,
  type InviteOutcome,
  type InviteRefusal,
  inviteOutcome,
  inviteRefusal,
} from '@heliogrid/domain';
import { useMemo, useState } from 'react';
import { answerOf } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';

export interface Invite {
  /** The form's schema, held to this market's digit count (`inviteFormSchema`). */
  readonly schema: ReturnType<typeof inviteFormSchema>;
  /**
   * A send is out — until what follows a sent invite (`onSent`) has settled too; *Send invite*
   * shows it is working and a second press sends nothing.
   */
  readonly sending: boolean;
  /** The api's last refusal the form draws in place of the send; null while none stands. */
  readonly refusal: InviteRefusal | null;
  /** What the answer meant; null for a press while one is out, which sends nothing. */
  send(values: CreateInvitation): Promise<InviteOutcome | null>;
  /** Takes the refusal down — a new number, or the form opened again. */
  clearRefusal(): void;
}

/**
 * Invite Teammate's send (`M01-12`): one invite per press, the repository's creation key making a
 * retried press the same invite, and what the answer means read from domain's `inviteOutcome`.
 * `onSent` runs once the invite exists — Team reads its list again, the setup step moves on.
 */
export function useInvite(pack: FormatPack, onSent: () => void | Promise<void>): Invite {
  const repositories = useRepositories();
  const schema = useMemo(() => inviteFormSchema(pack), [pack]);
  const [refusal, setRefusal] = useState<InviteRefusal | null>(null);

  const answerTo = async (values: CreateInvitation): Promise<InviteOutcome> => {
    try {
      await repositories.invitation.create(values);
      return inviteOutcome({ status: 201, code: '' });
    } catch (error) {
      return inviteOutcome(answerOf(error));
    }
  };
  const sent = useAction(async (values: CreateInvitation) => {
    const read = await answerTo(values);
    setRefusal(inviteRefusal(read));
    /* After the answer, so a list that fails to read again never reads as an invite that failed;
       still out, so a press meanwhile sends nothing twice. */
    if (read === 'sent') await onSent();
    return read;
  });

  const send = async (values: CreateInvitation): Promise<InviteOutcome | null> => {
    const answer = await sent.run(values);
    return answer.kind === 'done' ? answer.output : null;
  };

  return {
    schema,
    sending: sent.pending,
    refusal,
    send,
    clearRefusal: () => setRefusal(null),
  };
}
