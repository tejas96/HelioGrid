/**
 * What the invite landing draws (`SCR-M01-08`), read from its facts once for both platforms
 * (Law 11). The code area is the door's own frame (`loginFrame`), so the code family's refusals
 * read as they do on the front door; the landing decides only its own parts — the read, the join,
 * the ask, the decline — and which act its primary is.
 */
import { declineOffered, type InviteLandingState, joinHeld } from './invite-landing';
import { type LoginFrame, loginFrame } from './login-frame';
import type { CodeField, PrimaryLabel } from './login-frame-parts';
import type { LoginPress } from './login-state';
import { OTP_MAX_FAILED_VERIFIES } from './otp-policy';

/**
 * The landing's frames: `landing` names the invite and takes the code; `empty` is a link with no
 * invite behind it; `load-error` a read with no answer; `expired` offers the ask;
 * `reinvite-requested` follows it; `declined` follows the decline.
 */
export type InviteLandingFrameKind =
  | 'loading'
  | 'empty'
  | 'load-error'
  | 'landing'
  | 'expired'
  | 'reinvite-requested'
  | 'declined';

/** Every press the landing raises: the door's code presses, and its own. */
export type InviteLandingPress =
  | LoginPress
  | 'try-again'
  | 'ask'
  | 'decline'
  | 'keep'
  | 'confirm-decline';

/** The primary's words: Join, the ask, Try again, or a door control a code refusal offers. */
export type InvitePrimaryLabel = Exclude<PrimaryLabel, 'verify'> | 'join' | 'ask';

export interface InvitePrimary {
  readonly press: InviteLandingPress;
  readonly label: InvitePrimaryLabel;
}

/** The decline on the live invite (`S1.wrong.2`): its control and its confirm. */
export interface InviteDeclineFrame {
  /** The confirm is open; only Keep or Decline closes it (brief ruling 11). */
  readonly confirming: boolean;
  /** The decline is out: Decline spins, and Keep waits. */
  readonly sending: boolean;
  /** Why the last decline did not go through, said in the confirm (ruling 19); `null` when it has not failed. */
  readonly refused: 'unreached' | 'failed' | null;
  /** A code check or a join is out, or the join is done: the control waits. */
  readonly held: boolean;
}

export interface InviteLandingFrame {
  readonly kind: InviteLandingFrameKind;
  /** The door's code frame on the invite's number; `null` where the landing takes no code. */
  readonly code: LoginFrame | null;
  /** The code field as drawn: held read-only while a failed join waits for Try again (`D232`). */
  readonly codeField: CodeField;
  readonly primary: InvitePrimary | null;
  /** No code this page owns yet: Join is drawn and waits for the resend. */
  readonly joinHeld: boolean;
  /** A join failed after a right code: the error above the code. */
  readonly joinFailed: boolean;
  /** Why the last ask did not reach the inviter — no answer, or the server failed — said above its act; `null` when it has not failed. */
  readonly askRefused: 'unreached' | 'failed' | null;
  /** Wrong tries so far on this code — the field's own error counts them. */
  readonly wrongTries: number;
  /** The decline's control and confirm; `null` where the landing offers no decline. */
  readonly decline: InviteDeclineFrame | null;
  /** A round trip of the landing's own is in flight, or the join is done and the hand-off is under way: the primary spins. */
  readonly busy: boolean;
}

const NO_CODE = { code: null, codeField: 'absent', joinHeld: false, wrongTries: 0 } as const;

export function inviteLandingFrame(state: InviteLandingState): InviteLandingFrame {
  // A decline in flight spins its own act in the confirm, never the landing's behind it.
  const own = state.pending !== null && state.pending.kind !== 'decline';
  const busy = own || state.code.pending !== null || state.join === 'joined';
  const settled = { busy, joinFailed: false, askRefused: null, decline: null } as const;
  switch (state.read) {
    case 'loading':
      return { ...settled, ...NO_CODE, kind: 'loading', primary: null };
    case 'gone':
      return { ...settled, ...NO_CODE, kind: 'empty', primary: null };
    case 'unread':
      return { ...settled, ...NO_CODE, kind: 'load-error', primary: TRY_AGAIN };
    case 'expired':
      return state.ask === 'asked'
        ? { ...settled, ...NO_CODE, kind: 'reinvite-requested', primary: null }
        : {
            ...settled,
            ...NO_CODE,
            kind: 'expired',
            primary: ASK,
            askRefused: state.ask === 'unreached' || state.ask === 'failed' ? state.ask : null,
          };
    case 'declined':
      return { ...settled, ...NO_CODE, kind: 'declined', primary: null };
    case 'pending':
      return { ...settled, ...landingFrame(state), decline: declineFrame(state) };
  }
}

function declineFrame(state: InviteLandingState): InviteDeclineFrame {
  const { decline } = state;
  return {
    confirming: decline !== 'none',
    sending: state.pending?.kind === 'decline',
    refused: decline === 'unreached' || decline === 'failed' ? decline : null,
    held: !declineOffered(state),
  };
}

const TRY_AGAIN: InvitePrimary = { press: 'try-again', label: 'try-again' };
const ASK: InvitePrimary = { press: 'ask', label: 'ask' };
const JOIN: InvitePrimary = { press: 'verify', label: 'join' };

/** The live invite: the door's code frame, with Join in Verify's place and a failed join held. */
function landingFrame(state: InviteLandingState) {
  const door = loginFrame(state.code, false);
  // While the code on arrival is sending, its resend waits: pressed there it would not be sent.
  const sending = state.code.pending?.kind === 'request';
  const code: LoginFrame = sending ? { ...door, resend: { kind: 'wait' } } : door;
  const joinFailed = state.join === 'failed';
  return {
    kind: 'landing',
    code,
    codeField: joinFailed ? 'read-only' : code.code,
    primary: joinFailed ? TRY_AGAIN : primaryOf(code),
    joinHeld: joinHeld(state),
    joinFailed,
    wrongTries: OTP_MAX_FAILED_VERIFIES - state.code.triesLeft,
  } as const;
}

function primaryOf(code: LoginFrame): InvitePrimary | null {
  const { primary } = code;
  if (primary === null) return null;
  if (primary.label === 'verify') return JOIN;
  return { press: primary.press, label: primary.label };
}
