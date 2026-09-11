'use client';
import { homeOf, signupView } from '@heliogrid/data';
import { useSession, useSessionPhase, useSignIn } from '@heliogrid/data/react';
import { COMPANY_SIGNUP, homeTitle, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import './sign-in.css';
import './company-signup.css';
import { CodeStep } from './components/CodeStep';
import { CompanyStep } from './components/CompanyStep';
import { KnownNumber } from './components/KnownNumber';
import { PhoneStep } from './components/PhoneStep';
import { SignupProgress } from './components/SignupProgress';
import { SuccessDwell } from './components/SuccessDwell';
import { HOME_ROUTE, LOGIN_ROUTE } from './constants';

/**
 * Company signup on the web (`SCR-M01-02` at 1536): the number, the code, then three fields, over
 * the flow `T-M01-036` landed and the door's two-field composition. The open group holds no gate
 * (`M114`): the screen opens to a new number before any session exists and to a verified number
 * without a company (`M01-10`). Which panel shows is `signupView`'s; this composes, and on the
 * `done` view sends a person who has a company to their home once the session phase is signed in
 * (`M01-08`) — at once for an owner who arrives signed in, after the beat for a known number
 * entered here.
 */
export function CompanySignupScreen() {
  const t = useTranslate();
  const router = useRouter();
  const session = useSession();
  const phase = useSessionPhase();
  const { pack } = useFormat();
  const signIn = useSignIn(pack, 'signup');
  const view = signupView(session, signIn.state.step);
  const sendHome = view === 'done' && phase === 'signedIn';

  useEffect(() => {
    if (sendHome) router.replace(HOME_ROUTE);
  }, [sendHome, router]);

  /** The held account's session ends, and the number step comes back with the field cleared. */
  const leaveForAnotherNumber = () => {
    void session.leaveKnownAccount();
    signIn.press('change-number');
    signIn.typePhone('');
  };

  if (view === 'known' && session.known !== null) {
    return (
      <KnownNumber
        known={session.known}
        onEnter={session.enterKnownAccount}
        onLeave={leaveForAnotherNumber}
      />
    );
  }
  if (view === 'done') {
    const home = homeOf(session.user);
    const destination = home === null ? t(SIGN_IN.companySetup) : homeTitle(t, home);
    return (
      <SuccessDwell title={t(SIGN_IN.youAreIn)} line={t(SIGN_IN.takingYouTo, { destination })} />
    );
  }
  if (view === 'company' && session.user !== null) {
    return <CompanyStep user={session.user} restored={session.restored} />;
  }
  if (view === 'code') {
    return (
      <CodeStep
        signIn={signIn}
        door="signup"
        lead={<SignupProgress current={1} />}
        labels={{ verify: COMPANY_SIGNUP.verifyAndContinue }}
        note={t(COMPANY_SIGNUP.codeMakesTheAccount)}
      />
    );
  }
  return (
    <PhoneStep
      signIn={signIn}
      door="signup"
      lead={<SignupProgress current={0} />}
      title={t(COMPANY_SIGNUP.createYourCompany)}
      intro={t(COMPANY_SIGNUP.intro)}
      note={t(COMPANY_SIGNUP.nothingElse)}
      road={{
        question: t(COMPANY_SIGNUP.alreadyOnHelioGrid),
        label: t(COMPANY_SIGNUP.signInInstead),
        onPress: () => router.push(LOGIN_ROUTE),
      }}
    />
  );
}
