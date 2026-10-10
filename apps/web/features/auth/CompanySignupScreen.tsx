'use client';
import { useCompanySignup, useSession, useSessionPhase, useSignIn } from '@heliogrid/data/react';
import { homeOf, signupView } from '@heliogrid/domain';
import { COMPANY_SIGNUP, homeTitle, SIGN_IN, signupExplainers } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SuccessDwell, useFormat } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import './sign-in.css';
import './company-signup.css';
import { CodeStep } from './components/CodeStep';
import { CompanyStep } from './components/CompanyStep';
import { JoinRequestSent } from './components/JoinRequestSent';
import { KnownNumber } from './components/KnownNumber';
import { PhoneStep } from './components/PhoneStep';
import { SignupProgress } from './components/SignupProgress';
import { HOME_ROUTE, LOGIN_ROUTE } from './constants';
import { UnreachableScreen } from './UnreachableScreen';

/**
 * Company signup on the web (`SCR-M01-02` at 1536): the number, the code, then three fields, over
 * the flow `T-M01-036` landed and the door's two-field composition. The open group holds no gate:
 * the screen opens to a new number before any session exists and to a verified number
 * without a company (`M01-10`). Which panel shows is `signupView`'s, over the join steer
 * `useCompanySignup` holds (`M01-09`); this composes, and on the
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
  const signup = useCompanySignup();
  const view = signupView(session, signIn.state.step, signup.steer);
  const sendHome = view === 'done' && phase === 'signedIn';

  useEffect(() => {
    if (sendHome) router.replace(HOME_ROUTE);
  }, [sendHome, router]);

  // This route sits outside the gates, so it answers a boot check with no answer itself (`M01-07`).
  if (session.unreachable) return <UnreachableScreen />;

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
  if (view === 'sent' && session.user !== null && signup.found !== null) {
    return (
      <JoinRequestSent
        company={signup.found}
        name={signup.typedName ?? session.user.name}
        phoneE164={session.user.phoneE164}
        onCreateInstead={() => void signup.createAnyway()}
      />
    );
  }
  if ((view === 'company' || view === 'join') && session.user !== null) {
    return (
      <CompanyStep
        user={session.user}
        restored={session.restored}
        joining={view === 'join'}
        signup={signup}
      />
    );
  }
  if (view === 'code') {
    return (
      <CodeStep
        signIn={signIn}
        taskMeasure="steps"
        lead={<SignupProgress current={1} />}
        labels={{
          verify: COMPANY_SIGNUP.verifyAndContinue,
          explainer: signupExplainers(t).whatTheCodeDoes,
        }}
        helper={t(COMPANY_SIGNUP.codeHelper)}
      />
    );
  }
  return (
    <PhoneStep
      signIn={signIn}
      taskMeasure="steps"
      lead={<SignupProgress current={0} />}
      title={t(COMPANY_SIGNUP.createYourCompany)}
      intro={t(COMPANY_SIGNUP.intro)}
      explainer={signupExplainers(t).whatSignupAsks}
      helper={t(COMPANY_SIGNUP.numberHelper)}
      road={{
        question: t(COMPANY_SIGNUP.alreadyOnHelioGrid),
        label: t(COMPANY_SIGNUP.signInInstead),
        onPress: () => router.push(LOGIN_ROUTE),
      }}
    />
  );
}
