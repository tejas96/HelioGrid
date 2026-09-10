'use client';
import {
  COUNTDOWN_TICK_MS,
  type FormatPack,
  INITIAL_LOGIN_STATE,
  type LoginFrame,
  type LoginPress,
  type LoginState,
  loginFrame,
  loginReducer,
} from '@heliogrid/domain';
import { useEffect, useMemo, useReducer } from 'react';
import type { SignInDoor } from '../session/types';
import { useDataLayer } from './context';

/** The sign-in flow as a screen consumes it: the facts, the frame they add up to, and the presses. */
export interface SignIn {
  readonly state: LoginState;
  readonly frame: LoginFrame;
  /** A round trip is in flight: the primary spins and the fields lock. */
  readonly busy: boolean;
  typePhone(phone: string): void;
  typeCode(code: string): void;
  press(control: LoginPress): void;
}

/**
 * The ONE sign-in flow both doors run (Law 11). The reducer decides; this hook only does what
 * it asked for — the round trip `pending` names, and the once-a-second clock while the resend
 * gap runs — and hands the answer back as an event. `pack` is the tenant market's format pack,
 * which says how many digits a number here has; `door` says which door verifies, because the
 * signup door holds a number that already has a company back for the person's choice (`M01-08`).
 */
export function useSignIn(pack: FormatPack, door: SignInDoor = 'sign-in'): SignIn {
  const { session } = useDataLayer();
  const [state, dispatch] = useReducer(loginReducer, INITIAL_LOGIN_STATE);
  const { pending, cooldownLeft } = state;

  useEffect(() => {
    if (pending === null) return;
    if (pending.kind === 'request') {
      void session
        .requestOtp(pending.phone, pending.channel)
        .then((outcome) => dispatch({ type: 'request-ended', outcome, now: Date.now() }));
      return;
    }
    void session
      .verifyOtp(pending.code, door)
      .then(({ outcome, triesLeft }) => dispatch({ type: 'verify-ended', outcome, triesLeft }));
  }, [pending, session, door]);

  useEffect(() => {
    if (cooldownLeft === 0) return;
    const tick = setTimeout(() => dispatch({ type: 'tick', now: Date.now() }), COUNTDOWN_TICK_MS);
    return () => clearTimeout(tick);
  }, [cooldownLeft]);

  return useMemo(
    () => ({
      state,
      frame: loginFrame(state),
      busy: state.pending !== null,
      typePhone: (phone: string) => dispatch({ type: 'phone-typed', phone }),
      typeCode: (code: string) => dispatch({ type: 'code-typed', code }),
      press: (control: LoginPress) =>
        dispatch(control === 'send' ? { type: 'send', pack } : { type: control }),
    }),
    [state, pack],
  );
}
