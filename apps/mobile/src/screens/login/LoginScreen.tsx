import { useSession, useSignIn } from '@heliogrid/data/react';
import { homeFor } from '@heliogrid/domain';
import { homeTitle, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { CodeStep } from './components/CodeStep';
import { PhoneStep } from './components/PhoneStep';
import { SuccessDwell } from './components/SuccessDwell';
import { SwitchSheet } from './components/SwitchSheet';

/**
 * The front door (`SCR-M01-01`): phone, then code, then the success beat — which stays mounted
 * for `DONE_DWELL_MS` because the navigator swaps groups only after the dwell (`phase.tsx`).
 * The flow is `useSignIn`'s and the session's; this composes.
 */
export function LoginScreen() {
  const t = useTranslate();
  const navigation = useNavigation();
  const session = useSession();
  const { pack } = useFormat();
  const signIn = useSignIn(pack);
  const toCompanySignup = () => navigation.navigate('CompanySignup');

  if (session.switch !== null) {
    return (
      <>
        <PhoneStep signIn={signIn} onCreateCompany={toCompanySignup} />
        <SwitchSheet pending={session.switch} onConfirm={() => void session.completeSwitch()} />
      </>
    );
  }
  if (session.status === 'authenticated' && session.user !== null) {
    const home = session.user.tenant === null ? null : homeFor(session.user.tenant.roles);
    const destination = home === null ? t(SIGN_IN.companySetup) : homeTitle(t, home);
    return (
      <SuccessDwell title={t(SIGN_IN.youAreIn)} line={t(SIGN_IN.takingYouTo, { destination })} />
    );
  }
  if (signIn.state.step === 'otp') return <CodeStep signIn={signIn} />;
  return <PhoneStep signIn={signIn} onCreateCompany={toCompanySignup} />;
}
