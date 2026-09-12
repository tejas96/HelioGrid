'use client';
import { doorView, homeOf } from '@heliogrid/data';
import { useSession, useSignIn } from '@heliogrid/data/react';
import { homeTitle, SIGN_IN } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SuccessDwell, useFormat } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import './sign-in.css';
import { CodeStep } from './components/CodeStep';
import { PhoneStep } from './components/PhoneStep';
import { SwitchPanel } from './components/SwitchPanel';

/**
 * The front door on the web (`SCR-M01-01` at 1536): the two-field composition over the flow the
 * phone runs — `useSignIn` decides, `signInWords` speaks, this composes. The success beat stays
 * mounted because the route's gate holds the door until the dwell is over.
 */
export function SignInScreen({ companySignupHref }: { companySignupHref: string }) {
  const t = useTranslate();
  const router = useRouter();
  const session = useSession();
  const { pack } = useFormat();
  const signIn = useSignIn(pack);
  const road = {
    question: t(SIGN_IN.newCompany),
    label: t(SIGN_IN.createCompany),
    onPress: () => router.push(companySignupHref),
  };

  const view = doorView(session, signIn.state.step);

  if (view === 'switch' && session.switch !== null) {
    return (
      <PhoneStep
        signIn={signIn}
        title={t(SIGN_IN.signIn)}
        intro={t(SIGN_IN.intro)}
        road={road}
        task={
          <SwitchPanel pending={session.switch} onConfirm={() => void session.completeSwitch()} />
        }
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
  if (view === 'code') return <CodeStep signIn={signIn} />;
  return (
    <PhoneStep signIn={signIn} title={t(SIGN_IN.signIn)} intro={t(SIGN_IN.intro)} road={road} />
  );
}
