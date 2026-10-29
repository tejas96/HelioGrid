'use client';
import {
  doorView,
  type FormatPack,
  type GoogleLinkFrame,
  googleLinkFrame,
  homeOf,
  type PendingSwitch,
  type RolePreset,
} from '@heliogrid/domain';
import type { SessionApi } from '../session/types';
import { useSession } from './use-session';
import { type OpenGoogle, type SignIn, useSignIn } from './use-sign-in';

/** The door's one panel (`doorView`), carrying what only that panel draws. */
export type DoorPanel =
  | {
      readonly view: 'switch';
      /** The person who verified, and the work this device holds for the one before (`F4-37`). */
      readonly pending: PendingSwitch;
      confirm(): void;
    }
  | {
      readonly view: 'done';
      /** The home the beat names; `null` while the person has no company — the company setup. */
      readonly home: RolePreset | null;
    }
  | { readonly view: 'code' }
  | {
      readonly view: 'google-link';
      readonly frame: GoogleLinkFrame;
      /** The Google login's email, for the link step's tile. */
      readonly email: string;
    }
  | { readonly view: 'phone' };

/**
 * The front door (`SCR-M01-01`) as both screens draw it, assembled once (Law 11, `F7-30`): the
 * sign-in flow and the one panel it shows.
 */
export interface SignInScreen {
  readonly signIn: SignIn;
  readonly panel: DoorPanel;
}

/**
 * Fills `SignInScreen`. What only the screen's packages know is its input: the market's format
 * pack (`useFormat().pack`) and the platform's Google sheet — a door without one draws no Google
 * control (`useSignIn`).
 */
export function useSignInScreen(pack: FormatPack, openGoogle?: OpenGoogle): SignInScreen {
  const session = useSession();
  const signIn = useSignIn(pack, 'sign-in', openGoogle);
  return { signIn, panel: doorPanel(session, signIn) };
}

function doorPanel(session: SessionApi, signIn: SignIn): DoorPanel {
  const view = doorView(session, signIn.state.step);
  switch (view) {
    case 'switch':
      return session.switch === null
        ? { view: 'phone' }
        : { view, pending: session.switch, confirm: () => void session.completeSwitch() };
    case 'done':
      return { view, home: homeOf(session.user) };
    case 'google-link':
      return {
        view,
        frame: googleLinkFrame(signIn.state),
        email: signIn.state.google?.email ?? '',
      };
    default:
      return { view };
  }
}
