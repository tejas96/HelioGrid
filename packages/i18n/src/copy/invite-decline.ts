/**
 * The words of the invite landing's decline (`SCR-M01-08` declined-notifies-owner, `S1.wrong.2`):
 * the control on the live invite, the confirm that names both consequences and the way back, and
 * the after-state, which names them again (brief decision 6). A decline that did not go through
 * reads in the door's own words (brief ruling 19).
 */
import { firstNameOf, type InviteFacts, type InviteLandingFrame } from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { SIGN_IN } from './sign-in';

export const INVITE_DECLINE = {
  open: /*i18n*/ { id: "This invite isn't for me" },
  title: /*i18n*/ { id: 'Decline this invite?' },
  line: /*i18n*/ {
    id: '{inviter} is told it was not for you, and the link stops working. If it was meant for you after all, {first} can invite you again.',
  },
  keep: /*i18n*/ { id: 'Keep the invite' },
  go: /*i18n*/ { id: 'Decline the invite' },
  closed: /*i18n*/ { id: 'This invite is closed' },
  closedLine: /*i18n*/ {
    id: 'We have told {inviter} it was not for you. If it was meant for you after all, {first} can invite you again.',
  },
};

/** Why a decline or an ask did not go through: no answer names both sides (`F8-36`), a refusal is ours. */
export const NOT_THROUGH: Record<'unreached' | 'failed', MessageRef> = {
  unreached: SIGN_IN.notReached,
  failed: SIGN_IN.ourSideFailed,
};

/** The decline on the live invite: its control, its confirm, and why the last one did not go through. */
export interface InviteDeclineWords {
  readonly open: string;
  readonly title: string;
  readonly line: string;
  readonly keep: string;
  readonly go: string;
  readonly refused: string | null;
}

export function inviteDeclineWords(
  translate: Translator['t'],
  frame: InviteLandingFrame,
  invite: InviteFacts | null,
): InviteDeclineWords | null {
  const { decline } = frame;
  if (decline === null) return null;
  return {
    open: translate(INVITE_DECLINE.open),
    title: translate(INVITE_DECLINE.title),
    line: translate(INVITE_DECLINE.line, namesOf(invite)),
    keep: translate(INVITE_DECLINE.keep),
    go: translate(INVITE_DECLINE.go),
    refused: decline.refused === null ? null : translate(NOT_THROUGH[decline.refused]),
  };
}

/** The after-state's heading and line: the link is closed, the inviter told, the way back named. */
export function declinedWords(
  translate: Translator['t'],
  invite: InviteFacts | null,
): { readonly title: string; readonly line: string } {
  return {
    title: translate(INVITE_DECLINE.closed),
    line: translate(INVITE_DECLINE.closedLine, namesOf(invite)),
  };
}

function namesOf(invite: InviteFacts | null) {
  if (invite === null) return { inviter: '', first: '' };
  return { inviter: invite.inviterName, first: firstNameOf(invite.inviterName) };
}
