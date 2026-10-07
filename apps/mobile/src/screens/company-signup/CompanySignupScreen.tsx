import { useCompanySignup, useSession, useSignIn } from '@heliogrid/data/react';
import { homeOf, signupView } from '@heliogrid/domain';
import { COMPANY_SIGNUP, homeTitle, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SuccessDwell, useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { CodeStep } from '../shared/CodeStep';
import { PhoneStep } from '../shared/PhoneStep';
import { CompanyStep } from './components/CompanyStep';
import { JoinRequestSent } from './components/JoinRequestSent';
import { KnownNumber } from './components/KnownNumber';
import { SignupProgress } from './components/SignupProgress';

/**
 * Company signup (`SCR-M01-02`): the number, the code, then three fields, over the flow
 * `T-M01-036` landed. Two routes render it — the door's "Create a company account" while signed
 * out, and the company step for a verified number without a company (`M01-10`). Which panel
 * shows is `signupView`'s, over the join steer `useCompanySignup` holds (`M01-09`); this
 * composes.
 */
export function CompanySignupScreen() {
  const t = useTranslate();
  const navigation = useNavigation();
  const session = useSession();
  const { pack } = useFormat();
  const signIn = useSignIn(pack, 'signup');
  const signup = useCompanySignup();
  const view = signupView(session, signIn.state.step, signup.steer);

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
        lead={<SignupProgress current={1} />}
        labels={{ verify: COMPANY_SIGNUP.verifyAndContinue }}
        note={t(COMPANY_SIGNUP.codeMakesTheAccount)}
      />
    );
  }
  return (
    <PhoneStep
      signIn={signIn}
      lead={<SignupProgress current={0} />}
      title={t(COMPANY_SIGNUP.createYourCompany)}
      intro={t(COMPANY_SIGNUP.intro)}
      note={t(COMPANY_SIGNUP.nothingElse)}
      road={{
        question: t(COMPANY_SIGNUP.alreadyOnHelioGrid),
        label: t(COMPANY_SIGNUP.signInInstead),
        onPress: () => navigation.navigate('Login'),
      }}
    />
  );
}
