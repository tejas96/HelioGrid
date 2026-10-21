/**
 * The notices the invited person's two answers raise (`M01.2` S1.wrong.1, S1.wrong.2). The api
 * renders each in the RECIPIENT's language when the answer arrives and stores it as written
 * (`F6-08`), so these words are the record's, never re-translated on read. The invitee is named as
 * the inviter typed them; their number is not shown, because the name is what Team lists.
 */
import type { MessageRef, Translator } from '../runtime';

const INVITE_ANSWER_NOTICE = {
  declinedTitle: /*i18n*/ { id: '{name} declined the invite' },
  declinedBody: /*i18n*/ {
    id: 'They said the invite to {company} was not for them. The link no longer works.',
  },
  reinviteTitle: /*i18n*/ { id: '{name} asks for a new invite' },
  reinviteBody: /*i18n*/ {
    id: 'Their invite to {company} ran out. Send a new one from Team.',
  },
} satisfies Record<string, MessageRef>;

export function inviteDeclinedNotice(
  translate: Translator['t'],
  invitee: string,
  company: string,
): { title: string; body: string } {
  return {
    title: translate(INVITE_ANSWER_NOTICE.declinedTitle, { name: invitee }),
    body: translate(INVITE_ANSWER_NOTICE.declinedBody, { company }),
  };
}

export function reinviteRequestedNotice(
  translate: Translator['t'],
  invitee: string,
  company: string,
): { title: string; body: string } {
  return {
    title: translate(INVITE_ANSWER_NOTICE.reinviteTitle, { name: invitee }),
    body: translate(INVITE_ANSWER_NOTICE.reinviteBody, { company }),
  };
}
