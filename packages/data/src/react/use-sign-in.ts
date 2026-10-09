'use client';
import {
  COUNTDOWN_TICK_MS,
  type DoorNotice,
  doorNotice,
  type FormatPack,
  type GoogleSheetResult,
  INITIAL_LOGIN_STATE,
  type LoginFrame,
  type LoginPress,
  type LoginState,
  loginFrame,
  loginReducer,
  type PhoneGoogle,
  phoneGoogle,
  type SignInDoor,
} from '@heliogrid/domain';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { useDataLayer } from './context';
import { useSession } from './use-session';

/** The sign-in flow as a screen consumes it: the facts, the frame they add up to, and the presses. */
export interface SignIn {
  readonly state: LoginState;
  readonly frame: LoginFrame;
  /** A round trip is in flight: the primary spins and the fields lock. */
  readonly busy: boolean;
  /** The phone step's Google control; `null` on a door with no Google sheet — it draws none. */
  readonly google: PhoneGoogle | null;
  /** The block above the number; `null` when the number step carries none. */
  readonly notice: DoorNotice | null;
  typePhone(phone: string): void;
  typeCode(code: string): void;
  press(control: LoginPress): void;
  /** The web's Google return route hands in how Google's page closed: it left the tab to open. */
  returnFromGoogle(result: GoogleSheetResult): void;
}

/** Opens Google's sheet on this platform and says how it closed; part of the screen, never this package. */
export type OpenGoogle = () => Promise<GoogleSheetResult>;

/** A press that reaches a door with no sheet — never drawn, so never pressed — ends as a failure, not a hang. */
const NO_SHEET: OpenGoogle = () => Promise.resolve({ kind: 'failed' });

/**
 * The ONE sign-in flow both doors run (Law 11). The reducer decides; this hook only does what
 * it asked for — the round trip `pending` names, and the once-a-second clock while the resend
 * gap runs — and hands the answer back as an event. `pack` is the tenant market's format pack,
 * which says how many digits a number here has; `door` says which door verifies, because the
 * signup door holds a number that already has a company back for the person's choice (`M01-08`).
 * `openGoogle` is the platform's Google sheet; a door without one draws no Google control at all —
 * the frames leave it out here, once, so no screen decides it (`MS12-17`: no dead control).
 */
export function useSignIn(
  pack: FormatPack,
  door: SignInDoor = 'sign-in',
  openGoogle?: OpenGoogle,
): SignIn {
  const googleOffered = openGoogle !== undefined;
  const { session } = useDataLayer();
  const { ended } = useSession();
  const [state, dispatch] = useReducer(loginReducer, INITIAL_LOGIN_STATE);
  const { pending, cooldownLeft } = state;
  // Read through a ref: a screen's inline function is new every render, and the call it makes
  // must run once per pending round trip, not once per render.
  const sheet = useRef(openGoogle);
  sheet.current = openGoogle;

  useEffect(() => {
    if (pending === null) return;
    switch (pending.kind) {
      case 'request':
        void session
          .requestOtp(pending.phone, pending.channel)
          .then((outcome) => dispatch({ type: 'request-ended', outcome, now: Date.now() }));
        return;
      case 'verify':
        void session
          .verifyOtp(pending.code, door)
          .then(({ outcome, triesLeft }) => dispatch({ type: 'verify-ended', outcome, triesLeft }));
        return;
      case 'google-sheet':
        void (sheet.current ?? NO_SHEET)()
          .catch((): GoogleSheetResult => ({ kind: 'failed' }))
          .then((result) => dispatch({ type: 'google-sheet-ended', result }));
        return;
      case 'google':
        void session
          .signInWithGoogle(pending.token, pending.code)
          .then(({ outcome, triesLeft }) => dispatch({ type: 'google-ended', outcome, triesLeft }));
        return;
    }
  }, [pending, session, door]);

  useEffect(() => {
    if (cooldownLeft === 0) return;
    const tick = setTimeout(() => dispatch({ type: 'tick', now: Date.now() }), COUNTDOWN_TICK_MS);
    return () => clearTimeout(tick);
  }, [cooldownLeft]);

  return useMemo(
    () => ({
      state,
      frame: loginFrame(state, googleOffered),
      busy: state.pending !== null,
      google: googleOffered ? phoneGoogle(state) : null,
      notice: doorNotice(state, ended, door),
      typePhone: (phone: string) => dispatch({ type: 'phone-typed', phone }),
      typeCode: (code: string) => dispatch({ type: 'code-typed', code }),
      press: (control: LoginPress) =>
        dispatch(control === 'send' ? { type: 'send', pack } : { type: control }),
      returnFromGoogle: (result: GoogleSheetResult) =>
        dispatch({ type: 'google-sheet-ended', result }),
    }),
    [state, pack, googleOffered, ended, door],
  );
}
