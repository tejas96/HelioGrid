/**
 * The words of the invite landing (`SCR-M01-08`, `M01-13`), for the frame domain's
 * `inviteLandingFrame` decides — authored once for both platforms (Law 11). The code area is the
 * door's own family (`signInWords`), so a cap, the lock or a failed send reads as it does on the
 * front door; only the landing's parts and the board's code words are its own.
 */
import {
  FOUNDER_ROLE,
  firstNameOf,
  INVITATION_EXPIRY_DAYS,
  type InviteFacts,
  type InviteLandingFrame,
  type InvitePrimaryLabel,
  RESEND_SECONDS,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import {
  declinedWords,
  type InviteDeclineWords,
  inviteDeclineWords,
  NOT_THROUGH,
} from './invite-decline';
import { presetName } from './shell';
import { SIGN_IN } from './sign-in';
import { signInWords } from './sign-in-frames';

export const INVITE_LANDING = {
  loading: /*i18n*/ { id: 'Loading the invite' },
  inviterLabel: /*i18n*/ { id: '{role} · {company}' },
  title: /*i18n*/ { id: '{first} invited you to {company}' },
  factsLabel: /*i18n*/ { id: 'Your invite' },
  rolesLabel: /*i18n*/ { id: '{first} set you up as' },
  phoneLabel: /*i18n*/ { id: 'Mobile number' },
  codeWent: /*i18n*/ {
    id: 'The code went to the number {first} entered; if it is wrong, decline.',
  },
  codeLabel: /*i18n*/ { id: 'Code from the SMS' },
  filled: /*i18n*/ { id: 'Filled from the SMS — check it, or type over it.' },
  wrong: /*i18n*/ {
    id: 'That is not the code we sent. {tries, plural, one {# wrong try} other {# wrong tries}} so far — check the last SMS, or ask for a new one.',
  },
  join: /*i18n*/ { id: 'Join {company}' },
  joinFailedLine: /*i18n*/ { id: 'You have not joined yet, and this invite still works.' },
  expired: /*i18n*/ { id: 'This invite has expired' },
  expiredLine: /*i18n*/ {
    id: 'An invite lasts {days, plural, one {# day} other {# days}}, and this one is past that.',
  },
  ask: /*i18n*/ { id: 'Ask {first} to invite you again' },
  askFoot: /*i18n*/ { id: 'One tap tells {first} you are still waiting.' },
  goneTitle: /*i18n*/ { id: 'This invite is not there any more' },
  goneLine: /*i18n*/ {
    id: 'It may already have been used, or taken back by the person who sent it.',
  },
  goneNote: /*i18n*/ { id: 'Not joined yet? Ask whoever invited you for a new invite.' },
  askedTitle: /*i18n*/ { id: '{first} has been asked for a new invite' },
  askedLine: /*i18n*/ { id: 'When {first} sends it, a new link reaches this phone.' },
  otherAccountNote: /*i18n*/ { id: 'For an account you already have with another company.' },
  signIn: /*i18n*/ { id: 'Sign in to HelioGrid' },
  loadFailed: /*i18n*/ { id: 'Your invite did not load' },
  loadFailedLine: /*i18n*/ { id: 'Something on our side failed; try again in a moment.' },
};

/** Every word the landing draws for one frame; `null` where the frame has no such part. */
export interface InviteLandingWords {
  readonly loading: string;
  readonly inviter: { readonly name: string; readonly label: string } | null;
  readonly title: string | null;
  readonly facts: {
    readonly label: string;
    readonly rolesLabel: string;
    readonly roles: string[];
    readonly phoneLabel: string;
    readonly line: string;
  } | null;
  readonly banner: {
    readonly tone: 'danger' | 'warning';
    readonly title: string;
    readonly line: string | null;
  } | null;
  readonly block: { readonly tone: 'danger' | 'warning'; readonly title: string } | null;
  readonly codeLabel: string;
  readonly codeHelper: string | null;
  readonly codeError: string | null;
  readonly primary: string | null;
  readonly resend: string | null;
  readonly wait: { readonly label: string; readonly spoken: string } | null;
  readonly foot: string | null;
  readonly place: {
    readonly title: string;
    readonly line: string;
    readonly act: string;
    readonly note: string;
  } | null;
  readonly loadError: { readonly title: string; readonly line: string } | null;
  readonly decline: InviteDeclineWords | null;
}

/** The numbers that move: the resend gap and the tries left on this code. */
export interface InviteLandingFacts {
  readonly cooldownLeft: number;
  readonly triesLeft: number;
}

const NONE = {
  inviter: null,
  title: null,
  facts: null,
  banner: null,
  block: null,
  codeHelper: null,
  codeError: null,
  primary: null,
  resend: null,
  wait: null,
  foot: null,
  place: null,
  loadError: null,
  decline: null,
} as const;

export function inviteLandingWords(
  translate: Translator['t'],
  frame: InviteLandingFrame,
  invite: InviteFacts | null,
  facts: InviteLandingFacts,
): InviteLandingWords {
  const first = invite === null ? '' : firstNameOf(invite.inviterName);
  const company = invite?.companyName ?? '';
  const t = (message: MessageRef) => translate(message, { first, company });
  const base = {
    ...NONE,
    loading: t(INVITE_LANDING.loading),
    codeLabel: t(INVITE_LANDING.codeLabel),
  };
  switch (frame.kind) {
    case 'loading':
      return base;
    case 'empty':
      return { ...base, place: gonePlace(t) };
    case 'reinvite-requested':
      return { ...base, place: askedPlace(t) };
    case 'declined':
      return {
        ...base,
        place: {
          ...declinedWords(translate, invite),
          act: t(INVITE_LANDING.signIn),
          note: t(INVITE_LANDING.otherAccountNote),
        },
      };
    case 'load-error':
      return {
        ...base,
        loadError: { title: t(INVITE_LANDING.loadFailed), line: t(INVITE_LANDING.loadFailedLine) },
        primary: t(SIGN_IN.tryAgain),
      };
    case 'expired':
      return {
        ...base,
        ...inviteHead(translate, t, invite),
        banner:
          frame.askRefused !== null
            ? { tone: 'danger', title: t(NOT_THROUGH[frame.askRefused]), line: null }
            : {
                tone: 'warning',
                title: t(INVITE_LANDING.expired),
                line: translate(INVITE_LANDING.expiredLine, { days: INVITATION_EXPIRY_DAYS }),
              },
        primary: t(INVITE_LANDING.ask),
        foot: t(INVITE_LANDING.askFoot),
      };
    case 'landing':
      return {
        ...base,
        ...inviteHead(translate, t, invite),
        ...codeArea(translate, t, frame, facts),
        decline: inviteDeclineWords(translate, frame, invite),
      };
  }
}

/** Who invited, the heading, and the invite card's facts. */
function inviteHead(
  translate: Translator['t'],
  t: (message: MessageRef) => string,
  invite: InviteFacts | null,
): Pick<InviteLandingWords, 'inviter' | 'title' | 'facts'> {
  if (invite === null) return { inviter: null, title: null, facts: null };
  // Only the founder's preset may invite (`F2.M01.manage-team`), so the label is its name (brief decision 3, D217).
  const role = presetName(translate, FOUNDER_ROLE);
  return {
    inviter: {
      name: invite.inviterName,
      label: translate(INVITE_LANDING.inviterLabel, { role, company: invite.companyName }),
    },
    title: t(INVITE_LANDING.title),
    facts: {
      label: t(INVITE_LANDING.factsLabel),
      rolesLabel: t(INVITE_LANDING.rolesLabel),
      roles: invite.roles.map((preset) => presetName(translate, preset)),
      phoneLabel: t(INVITE_LANDING.phoneLabel),
      line: t(INVITE_LANDING.codeWent),
    },
  };
}

/** The code, its act and its resend: the door's family, with the board's own code words. */
function codeArea(
  translate: Translator['t'],
  t: (message: MessageRef) => string,
  frame: InviteLandingFrame,
  facts: InviteLandingFacts,
): Partial<InviteLandingWords> {
  const { code } = frame;
  if (code === null) return {};
  // Before the first send answers the gap has not started: the wait reads its whole length.
  const waiting = code.resend?.kind === 'wait' && facts.cooldownLeft === 0;
  const door = signInWords(
    translate,
    code,
    waiting ? { ...facts, cooldownLeft: RESEND_SECONDS } : facts,
  );
  const wrong = code.codeError === 'wrong';
  return {
    banner: frame.joinFailed
      ? {
          tone: 'danger',
          title: t(SIGN_IN.ourSideFailed),
          line: t(INVITE_LANDING.joinFailedLine),
        }
      : null,
    block: door.block,
    codeHelper: code.kind === 'filled' && !frame.joinFailed ? t(INVITE_LANDING.filled) : null,
    codeError: wrong
      ? translate(INVITE_LANDING.wrong, { tries: frame.wrongTries })
      : door.codeError,
    primary: frame.primary === null ? null : primaryOf(frame.primary.label, t, door.primary),
    // The board's live resend reads as the control's own name, not the door's *Send a new code*.
    resend: code.resend?.kind === 'live' && !frame.joinFailed ? t(SIGN_IN.resendCode) : null,
    wait: frame.joinFailed ? null : door.wait,
  };
}

const LANDING_PRIMARY: Partial<Record<InvitePrimaryLabel, MessageRef>> = {
  join: INVITE_LANDING.join,
  ask: INVITE_LANDING.ask,
  'try-again': SIGN_IN.tryAgain,
};

function primaryOf(
  label: InvitePrimaryLabel,
  t: (message: MessageRef) => string,
  door: string | null,
): string | null {
  const own = LANDING_PRIMARY[label];
  return own === undefined ? door : t(own);
}

function gonePlace(t: (message: MessageRef) => string): InviteLandingWords['place'] {
  return {
    title: t(INVITE_LANDING.goneTitle),
    line: t(INVITE_LANDING.goneLine),
    act: t(INVITE_LANDING.signIn),
    note: t(INVITE_LANDING.goneNote),
  };
}

function askedPlace(t: (message: MessageRef) => string): InviteLandingWords['place'] {
  return {
    title: t(INVITE_LANDING.askedTitle),
    line: t(INVITE_LANDING.askedLine),
    act: t(INVITE_LANDING.signIn),
    note: t(INVITE_LANDING.otherAccountNote),
  };
}
