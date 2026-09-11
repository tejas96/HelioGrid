import { doorView, homeOf } from '@heliogrid/data';
import { useSession, useSignIn } from '@heliogrid/data/react';
import { homeTitle, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { CodeStep } from '../shared/CodeStep';
import { PhoneStep } from '../shared/PhoneStep';
import { SuccessDwell } from '../shared/SuccessDwell';
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
  const door = {
    question: t(SIGN_IN.newCompany),
    label: t(SIGN_IN.createCompany),
    onPress: () => navigation.navigate('CompanySignup'),
  };

  const view = doorView(session, signIn.state.step);

  if (view === 'switch' && session.switch !== null) {
    return (
      <>
        <PhoneStep signIn={signIn} title={t(SIGN_IN.signIn)} intro={t(SIGN_IN.intro)} door={door} />
        <SwitchSheet pending={session.switch} onConfirm={() => void session.completeSwitch()} />
      </>
    );
  }
  if (view === 'done') {
    const home = homeOf(session.user);
    const destination = home === null ? t(SIGN_IN.companySetup) : homeTitle(t, home);
    return (
      <SuccessDwell title={t(SIGN_IN.youAreIn)} line={t(SIGN_IN.takingYouTo, { destination })} />
    );
  }
  if (view === 'code') return <CodeStep signIn={signIn} />;
  return (
    <PhoneStep signIn={signIn} title={t(SIGN_IN.signIn)} intro={t(SIGN_IN.intro)} door={door} />
  );
}
