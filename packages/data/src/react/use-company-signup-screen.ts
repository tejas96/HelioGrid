'use client';
import type { RequestedCompany } from '@heliogrid/contracts';
import {
  type FormatPack,
  homeOf,
  type RolePreset,
  type SessionUser,
  signupView,
} from '@heliogrid/domain';
import type { SessionApi } from '../session/types';
import { type CompanySignup, useCompanySignup } from './use-company-signup';
import { useSession } from './use-session';
import { type SignIn, useSignIn } from './use-sign-in';

/** Company signup's one panel (`signupView`), carrying what only that panel draws. */
export type SignupPanel =
  | {
      readonly view: 'known';
      /** The number that already has a company (`M01-08`). */
      readonly phoneE164: string;
      enter(): void;
      /** The held account's session ends, and the number step comes back with the field cleared. */
      leave(): void;
    }
  | {
      readonly view: 'done';
      /** The home the beat names; `null` while the person has no company — the company setup. */
      readonly home: RolePreset | null;
    }
  | {
      readonly view: 'sent';
      /** The company the request went to, as it is stored. */
      readonly found: RequestedCompany;
      /** The asker's name as the request carries it. */
      readonly name: string;
      readonly phoneE164: string;
    }
  | {
      /** `join`: the steer replaces the company step's primary (`M01-09`). */
      readonly view: 'company' | 'join';
      readonly user: SessionUser;
      /** The person is back on a live session, which the step greets (`M01-10`). */
      readonly restored: boolean;
    }
  | { readonly view: 'code' }
  | { readonly view: 'phone' };

/**
 * Company signup (`SCR-M01-02`) as both screens draw it, assembled once (Law 11, `F7-30`): the
 * number's flow, the company step's write and steer, and the one panel they show.
 */
export interface CompanySignupScreen {
  readonly signIn: SignIn;
  readonly signup: CompanySignup;
  readonly panel: SignupPanel;
  /** The boot check got no answer (`M01-07`); a screen outside the gates answers it itself. */
  readonly unreachable: boolean;
}

/** Fills `CompanySignupScreen`; `pack` is the market's format pack (`useFormat().pack`). */
export function useCompanySignupScreen(pack: FormatPack): CompanySignupScreen {
  const session = useSession();
  const signIn = useSignIn(pack, 'signup');
  const signup = useCompanySignup();
  return {
    signIn,
    signup,
    panel: signupPanel(session, signIn, signup),
    unreachable: session.unreachable,
  };
}

function signupPanel(session: SessionApi, signIn: SignIn, signup: CompanySignup): SignupPanel {
  const view = signupView(session, signIn.state.step, signup.steer);
  const { known, user } = session;
  switch (view) {
    case 'known':
      if (known === null) return { view: 'phone' };
      return {
        view,
        phoneE164: known.next.phoneE164,
        enter: session.enterKnownAccount,
        leave: () => {
          void session.leaveKnownAccount();
          signIn.press('change-number');
          signIn.typePhone('');
        },
      };
    case 'done':
      return { view, home: homeOf(user) };
    case 'sent':
      if (user === null || signup.found === null) return { view: 'phone' };
      return {
        view,
        found: signup.found,
        name: signup.typedName ?? user.name,
        phoneE164: user.phoneE164,
      };
    case 'company':
    case 'join':
      if (user === null) return { view: 'phone' };
      return { view, user, restored: session.restored };
    default:
      return { view };
  }
}
